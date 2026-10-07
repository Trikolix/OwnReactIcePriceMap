$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$mysqlContainer = "ice-challenge-mysql-$suffix"
$phpContainer = "ice-challenge-php-$suffix"
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
mkdir -p /tmp/ice-challenge-test/backend/lib /tmp/ice-challenge-test/backend/api
cp /workspace/backend/api/challenge_generate.php /tmp/ice-challenge-test/backend/api/
cp /workspace/backend/lib/opening_hours.php /tmp/ice-challenge-test/backend/lib/
cp /workspace/tests/php/fixtures/systemmeldung-db.php /tmp/ice-challenge-test/backend/
cp /workspace/tests/php/fixtures/challenge-generation-db.php /tmp/ice-challenge-test/backend/db_connect.php
CHALLENGE_TEST_BACKEND=/tmp/ice-challenge-test/backend php /workspace/tests/php/challenge_generation_integration_test.php
for file in backend/api/challenge_generate.php backend/checkin/checkin_upload.php tests/php/challenge_generation_integration_test.php tests/php/fixtures/challenge-generation-db.php tests/php/fixtures/challenge-generation-worker.php; do php -l "$file"; done
'@
    RunDocker run --pull never --name $phpContainer --network "container:$mysqlContainer" --mount "type=bind,source=$projectPath,target=/workspace,readonly" -w /workspace php:8.3-cli sh -c $testCommand
} finally {
    $ErrorActionPreference = 'Continue'
    & docker rm -f $phpContainer $mysqlContainer 2>$null | Out-Null
}
