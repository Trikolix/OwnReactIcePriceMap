$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$mysqlContainer = "ice-share-mysql-$suffix"
$phpContainer = "ice-share-php-$suffix"
$outputPath = Join-Path $projectPath 'build/checkin-share'
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
function RunDocker {
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "Docker failed: $($args[0])" }
}
try {
    RunDocker build --pull=false -f (Join-Path $PSScriptRoot 'fixtures/checkin-share.Dockerfile') -t ice-checkin-share-php-test:local (Join-Path $PSScriptRoot 'fixtures')
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
mkdir -p /tmp/ice-share-test/backend/lib /tmp/ice-share-test/backend/social_media /tmp/ice-share-test/backend/assets/fonts /tmp/ice-share-test/uploads
cp /workspace/backend/lib/auth.php /workspace/backend/lib/social_media_stories.php /workspace/backend/lib/social_report_stories.php /tmp/ice-share-test/backend/lib/
cp /workspace/backend/lib/checkin_share_design.php /tmp/ice-share-test/backend/lib/
cp /workspace/backend/assets/fonts/Nunito.ttf /workspace/backend/assets/fonts/Nunito-Regular.ttf /workspace/backend/assets/fonts/Nunito-Bold.ttf /tmp/ice-share-test/backend/assets/fonts/
cp /workspace/backend/social_media/helpers.php /workspace/backend/social_media/checkin_share.php /workspace/backend/social_media/header_wide.png /tmp/ice-share-test/backend/social_media/
cp /workspace/tests/php/fixtures/systemmeldung-db.php /tmp/ice-share-test/backend/db_connect.php
CHECKIN_SHARE_TEST_ROOT=/tmp/ice-share-test CHECKIN_SHARE_TEST_OUTPUT=/output php /workspace/tests/php/checkin_share_integration_test.php
for file in backend/social_media/checkin_share.php backend/social_media/helpers.php backend/lib/social_media_stories.php backend/lib/social_report_stories.php backend/lib/checkin_share_design.php tests/php/checkin_share_integration_test.php; do php -l "$file"; done
'@
    RunDocker run --pull never --name $phpContainer --network "container:$mysqlContainer" --mount "type=bind,source=$projectPath,target=/workspace,readonly" --mount "type=bind,source=$outputPath,target=/output" -w /workspace ice-checkin-share-php-test:local sh -c $testCommand
} finally {
    $ErrorActionPreference = 'Continue'
    & docker rm -f $phpContainer $mysqlContainer 2>$null | Out-Null
}
