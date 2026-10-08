$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$mysqlContainer = "ice-loyalty-mysql-$suffix"
$phpContainer = "ice-loyalty-php-$suffix"
function RunDocker {
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "Docker failed: $($args[0])" }
}
try {
    RunDocker run --name $mysqlContainer --network none -e MYSQL_ROOT_PASSWORD=isolated-test-password -e MYSQL_DATABASE=ice_system_test -d mysql:8.0
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
mkdir -p /tmp/ice-loyalty-test/backend/lib
cp /workspace/backend/lib/loyalty.php /workspace/backend/lib/shop_operators.php /workspace/backend/lib/shop_ice_offerings.php /workspace/backend/lib/opening_hours.php /workspace/backend/lib/auth.php /tmp/ice-loyalty-test/backend/lib/
cp /workspace/backend/loyalty.php /tmp/ice-loyalty-test/backend/
cp /workspace/tests/php/fixtures/systemmeldung-db.php /tmp/ice-loyalty-test/backend/db_connect.php
ICE_LOYALTY_TEST_BACKEND=/tmp/ice-loyalty-test/backend php /workspace/tests/php/loyalty_integration_test.php
'@
    RunDocker run --name $phpContainer --network "container:$mysqlContainer" --mount "type=bind,source=$projectPath,target=/workspace,readonly" -w /workspace php:8.3-cli sh -c $testCommand
} finally {
    $ErrorActionPreference = 'Continue'
    & docker rm -f $phpContainer $mysqlContainer 2>$null | Out-Null
}
