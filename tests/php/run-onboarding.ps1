param([string]$PhpImage = 'php:8.3-cli')
$ErrorActionPreference = 'Stop'
if ($env:PATHEXT -notmatch '(?i)\.EXE') { $env:PATHEXT = '.COM;.EXE;.BAT;.CMD;' + $env:PATHEXT }
$project = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$db = "ice-onboarding-db-$suffix"
$php = "ice-onboarding-php-$suffix"
function RunDocker {
    & docker.exe @args
    if ($LASTEXITCODE -ne 0) { throw "Docker failed: $($args[0])" }
}
try {
    RunDocker run --name $db --network none -e MYSQL_ROOT_PASSWORD=isolated-onboarding-password -e MYSQL_DATABASE=ice_onboarding_test -d mysql:8.0
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        $ErrorActionPreference = 'Continue'
        & docker.exe exec -e MYSQL_PWD=isolated-onboarding-password $db mysqladmin ping -h 127.0.0.1 -u root --silent 2>$null
        $ErrorActionPreference = 'Stop'
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (!$ready) { throw 'Test MySQL did not become ready' }
    $command = @'
set -eu
if ! php -m | grep -qi '^pdo_mysql$'; then docker-php-ext-install pdo_mysql >/tmp/extensions.log 2>&1; fi
mkdir -p /tmp/ice-onboarding-test/backend
cp -r /workspace/backend/lib /workspace/backend/evaluators /workspace/backend/api /tmp/ice-onboarding-test/backend/
cp /workspace/tests/php/fixtures/onboarding-db.php /tmp/ice-onboarding-test/backend/db_connect.php
ICE_ONBOARDING_TEST_ROOT=/tmp/ice-onboarding-test/backend php /workspace/tests/php/onboarding_push_integration_test.php
'@
    RunDocker run --name $php --network "container:$db" --entrypoint sh --mount "type=bind,source=$project,target=/workspace,readonly" $PhpImage -c $command
} finally {
    $ErrorActionPreference = 'Continue'
    & docker.exe rm -f $php $db 2>$null | Out-Null
}
