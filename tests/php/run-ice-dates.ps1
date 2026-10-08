$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$mysqlContainer = "ice-date-mysql-$suffix"
$phpContainer = "ice-date-php-$suffix"
function RunDocker {
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "Docker failed: $($args[0])" }
}
try {
    RunDocker run --pull never --name $mysqlContainer --network none -e MYSQL_ROOT_PASSWORD=isolated-test-password -e MYSQL_DATABASE=ice_system_test -d mysql:8.0
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        $ErrorActionPreference = 'Continue'
        & docker exec -e MYSQL_PWD=isolated-test-password $mysqlContainer mysqladmin ping -h 127.0.0.1 -u root --silent 2>$null
        $ErrorActionPreference = 'Stop'
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (!$ready) { throw 'Isolated MySQL did not become ready' }
    $testCommand = @'
set -eu
docker-php-ext-install pdo_mysql >/tmp/extensions.log 2>&1 || { cat /tmp/extensions.log; exit 1; }
mkdir -p /tmp/ice-date-test/backend/lib /tmp/ice-date-test/backend/api
cp /workspace/backend/lib/ice_dates.php /workspace/backend/lib/opening_hours.php /workspace/backend/lib/auth.php /tmp/ice-date-test/backend/lib/
cp /workspace/backend/api/ice_date_*.php /tmp/ice-date-test/backend/api/
cp /workspace/tests/php/fixtures/ice-date-notifications.php /tmp/ice-date-test/backend/lib/notification_dispatcher.php
cp /workspace/tests/php/fixtures/systemmeldung-db.php /tmp/ice-date-test/backend/systemmeldung-db.php
cp /workspace/tests/php/fixtures/ice-date-db.php /tmp/ice-date-test/backend/db_connect.php
ICE_DATE_TEST_BACKEND=/tmp/ice-date-test/backend php /workspace/tests/php/ice_dates_integration_test.php
for file in backend/lib/ice_dates.php backend/api/ice_date_*.php; do php -l "$file"; done
'@
    RunDocker run --pull never --name $phpContainer --network "container:$mysqlContainer" --mount "type=bind,source=$projectPath,target=/workspace,readonly" -w /workspace php:8.3-cli sh -c $testCommand
} finally {
    $ErrorActionPreference = 'Continue'
    & docker rm -f $phpContainer $mysqlContainer 2>$null | Out-Null
}
