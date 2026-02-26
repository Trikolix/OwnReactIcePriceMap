<?php
declare(strict_types=1);

require_once __DIR__ . '/../awards/award_icon_variants.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run via CLI.\n");
    exit(1);
}

try {
    main($argv);
} catch (Throwable $e) {
    fwrite(STDERR, '[' . date('Y-m-d H:i:s') . '] Award icon migration failed: ' . $e->getMessage() . "\n");
    exit(1);
}

function main(array $argv): void
{
    $opts = parseOptions($argv);

    $projectRoot = dirname(__DIR__, 2);
    $configs = [];
    if ($opts['db'] === 'prod' || $opts['db'] === 'both') {
        $configs['prod'] = extractDbConfigFromPhpFile($projectRoot . '/backend/db_connect.php');
    }
    if ($opts['db'] === 'dev' || $opts['db'] === 'both') {
        $configs['dev'] = extractDbConfigFromPhpFile($projectRoot . '/backend_dev/db_connect.php');
    }

    if ($configs === []) {
        throw new RuntimeException('No DB selected.');
    }

    $iconRows = [];
    foreach ($configs as $label => $config) {
        $pdo = createPdo($config);
        $stmt = $pdo->query("SELECT id, icon_path FROM award_levels WHERE icon_path IS NOT NULL AND icon_path <> ''");
        while (($row = $stmt->fetch(PDO::FETCH_ASSOC)) !== false) {
            $path = trim((string)$row['icon_path']);
            if ($path === '') {
                continue;
            }
            if (!isset($iconRows[$path])) {
                $iconRows[$path] = [];
            }
            $iconRows[$path][] = $label . '#award_level_id=' . (int)$row['id'];
        }
    }

    $paths = array_keys($iconRows);
    sort($paths);

    if ($opts['limit'] !== null) {
        $paths = array_slice($paths, 0, $opts['limit']);
    }

    echo '[' . date('Y-m-d H:i:s') . "] Award icon variant migration start\n";
    echo 'DB selection: ' . $opts['db'] . "\n";
    echo 'Unique icon paths: ' . count($paths) . "\n";
    echo 'Target variant: <= ' . AWARD_ICON_VARIANT_MAX_DIM . 'px, webp q=' . AWARD_ICON_VARIANT_WEBP_QUALITY . "\n";
    if ($opts['dry_run']) {
        echo "Dry run enabled. No files will be written.\n";
    }

    $ok = 0;
    $skipped = 0;
    $missing = 0;
    $failed = 0;

    foreach ($paths as $index => $path) {
        $num = $index + 1;
        $variantPath = awardIconVariantRelativePath($path);

        if ($variantPath === null) {
            $skipped++;
            echo "[{$num}] skip (unsupported path): {$path}\n";
            continue;
        }

        $sourceAbs = awardIconAbsolutePathFromRelative($path);
        if ($sourceAbs === null || !is_file($sourceAbs)) {
            $missing++;
            echo "[{$num}] missing: {$path}\n";
            continue;
        }

        try {
            if ($opts['dry_run']) {
                echo "[{$num}] dry-run: {$path} -> {$variantPath}\n";
            } else {
                $createdVariant = awardIconCreateVariant($path, $opts['force']);
                echo "[{$num}] ok: {$path} -> " . ($createdVariant ?? '(none)') . "\n";
            }
            $ok++;
        } catch (Throwable $e) {
            $failed++;
            echo "[{$num}] error: {$path} ({$e->getMessage()})\n";
        }
    }

    echo "Summary: ok={$ok}, skipped={$skipped}, missing={$missing}, failed={$failed}\n";
    echo '[' . date('Y-m-d H:i:s') . "] Award icon variant migration end\n";
}

function parseOptions(array $argv): array
{
    $options = [
        'db' => 'both',
        'dry_run' => false,
        'force' => false,
        'limit' => null,
    ];

    foreach (array_slice($argv, 1) as $arg) {
        if ($arg === '--dry-run') {
            $options['dry_run'] = true;
            continue;
        }
        if ($arg === '--force') {
            $options['force'] = true;
            continue;
        }
        if ($arg === '--help' || $arg === '-h') {
            echo "Usage: php backend/Skripte/migrate_award_icon_variants.php [--db=prod|dev|both] [--dry-run] [--force] [--limit=N]\n";
            exit(0);
        }
        if (preg_match('/^--db=(prod|dev|both)$/', $arg, $m)) {
            $options['db'] = $m[1];
            continue;
        }
        if (preg_match('/^--limit=(\d+)$/', $arg, $m)) {
            $options['limit'] = (int)$m[1];
            continue;
        }

        throw new InvalidArgumentException('Unknown option: ' . $arg);
    }

    return $options;
}

function extractDbConfigFromPhpFile(string $filePath): array
{
    if (!is_file($filePath)) {
        throw new RuntimeException('Config file not found: ' . $filePath);
    }

    $content = file_get_contents($filePath);
    if ($content === false) {
        throw new RuntimeException('Failed to read config file: ' . $filePath);
    }

    $keys = ['host', 'dbname', 'username', 'password'];
    $config = [];
    foreach ($keys as $key) {
        $pattern = '/\\$' . preg_quote($key, '/') . '\\s*=\\s*([\'"])(.*?)\\1\\s*;/s';
        if (!preg_match($pattern, $content, $matches)) {
            throw new RuntimeException('Could not extract $' . $key . ' from ' . $filePath);
        }
        $config[$key] = $matches[2];
    }

    return $config;
}

function createPdo(array $config): PDO
{
    if (!extension_loaded('pdo_mysql')) {
        throw new RuntimeException('PHP extension pdo_mysql is not installed/enabled for CLI.');
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['host'], $config['dbname']);
    return new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

