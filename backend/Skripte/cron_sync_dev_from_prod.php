<?php
declare(strict_types=1);

/**
 * Nightly sync: copies all data from production DB to develop DB.
 *
 * Effect:
 * - deletes rows in matching develop tables
 * - reimports rows from production tables
 *
 * Notes:
 * - schema changes are not applied automatically (data sync only)
 * - only tables existing in both databases are synced
 */

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run via CLI.\n");
    exit(1);
}

try {
    main($argv);
} catch (Throwable $e) {
    fwrite(STDERR, '[' . date('Y-m-d H:i:s') . '] DB sync failed: ' . $e->getMessage() . "\n");
    exit(1);
}

function main(array $argv): void
{
    $options = parseOptions($argv);

    $projectRoot = dirname(__DIR__, 2);
    $prodConfigPath = $projectRoot . '/backend/db_connect.php';
    $devConfigPath = $projectRoot . '/backend_dev/db_connect.php';

    $prodConfig = extractDbConfigFromPhpFile($prodConfigPath);
    $devConfig = extractDbConfigFromPhpFile($devConfigPath);

    ensureDifferentDatabases($prodConfig, $devConfig);

    $pdoProd = createPdo($prodConfig);
    $pdoDev = createPdo($devConfig);

    $prodTables = listBaseTables($pdoProd);
    $devTables = listBaseTables($pdoDev);

    $devTableLookup = array_fill_keys($devTables, true);
    $tablesToSync = [];
    foreach ($prodTables as $table) {
        if (isset($devTableLookup[$table])) {
            $tablesToSync[] = $table;
        }
    }

    $prodTableLookup = array_fill_keys($prodTables, true);
    $extraDevTables = [];
    foreach ($devTables as $table) {
        if (!isset($prodTableLookup[$table])) {
            $extraDevTables[] = $table;
        }
    }

    if ($tablesToSync === []) {
        throw new RuntimeException('No shared tables found between production and develop databases.');
    }

    echo '[' . date('Y-m-d H:i:s') . "] Starting prod -> dev DB sync\n";
    echo 'Production DB: ' . $prodConfig['dbname'] . "\n";
    echo 'Develop DB: ' . $devConfig['dbname'] . "\n";
    echo 'Shared tables to sync: ' . count($tablesToSync) . "\n";

    if ($extraDevTables !== []) {
        echo 'Warning: extra develop tables not present in prod (left untouched): ' . implode(', ', $extraDevTables) . "\n";
    }

    if ($options['dry_run']) {
        echo "Dry run enabled. No data was changed.\n";
        return;
    }

    $pdoDev->exec('SET FOREIGN_KEY_CHECKS = 0');

    try {
        foreach ($tablesToSync as $tableName) {
            syncSingleTable($pdoProd, $pdoDev, $tableName);
        }
    } finally {
        $pdoDev->exec('SET FOREIGN_KEY_CHECKS = 1');
    }

    echo '[' . date('Y-m-d H:i:s') . "] Prod -> dev DB sync finished successfully\n";
}

function parseOptions(array $argv): array
{
    $dryRun = false;

    foreach (array_slice($argv, 1) as $arg) {
        if ($arg === '--dry-run') {
            $dryRun = true;
            continue;
        }

        if ($arg === '--help' || $arg === '-h') {
            echo "Usage: php backend/Skripte/cron_sync_dev_from_prod.php [--dry-run]\n";
            exit(0);
        }

        throw new InvalidArgumentException('Unknown option: ' . $arg);
    }

    return ['dry_run' => $dryRun];
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

function ensureDifferentDatabases(array $prodConfig, array $devConfig): void
{
    $sameHost = $prodConfig['host'] === $devConfig['host'];
    $sameDb = $prodConfig['dbname'] === $devConfig['dbname'];

    if ($sameHost && $sameDb) {
        throw new RuntimeException('Safety abort: prod and dev DB point to the same database.');
    }
}

function createPdo(array $config): PDO
{
    if (!extension_loaded('pdo_mysql')) {
        throw new RuntimeException('PHP extension pdo_mysql is not installed/enabled for CLI.');
    }

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $config['host'],
        $config['dbname']
    );

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];

    if (defined('PDO::MYSQL_ATTR_USE_BUFFERED_QUERY')) {
        $options[PDO::MYSQL_ATTR_USE_BUFFERED_QUERY] = false;
    }

    return new PDO($dsn, $config['username'], $config['password'], $options);
}

function listBaseTables(PDO $pdo): array
{
    $stmt = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    $tables = [];

    while (($row = $stmt->fetch(PDO::FETCH_NUM)) !== false) {
        $tables[] = (string)$row[0];
    }

    return $tables;
}

function syncSingleTable(PDO $pdoProd, PDO $pdoDev, string $tableName): void
{
    $quotedTable = quoteIdentifier($tableName);
    $columnNames = getColumnNames($pdoProd, $tableName);

    if ($columnNames === []) {
        echo "Skipping empty-structure table {$tableName} (no columns found)\n";
        return;
    }

    $columnSql = implode(', ', array_map('quoteIdentifier', $columnNames));
    $placeholders = implode(', ', array_fill(0, count($columnNames), '?'));

    echo "Syncing {$tableName}... ";
    $startedAt = microtime(true);

    $pdoDev->exec("DELETE FROM {$quotedTable}");

    $selectStmt = $pdoProd->query("SELECT {$columnSql} FROM {$quotedTable}");
    $insertStmt = $pdoDev->prepare("INSERT INTO {$quotedTable} ({$columnSql}) VALUES ({$placeholders})");

    $rowCount = 0;
    while (($row = $selectStmt->fetch(PDO::FETCH_ASSOC)) !== false) {
        $values = [];
        foreach ($columnNames as $columnName) {
            $values[] = $row[$columnName] ?? null;
        }
        $insertStmt->execute($values);
        $rowCount++;
    }

    $duration = number_format(microtime(true) - $startedAt, 2, '.', '');
    echo $rowCount . " rows ({$duration}s)\n";
}

function getColumnNames(PDO $pdo, string $tableName): array
{
    $quotedTable = quoteIdentifier($tableName);
    $stmt = $pdo->query("SHOW COLUMNS FROM {$quotedTable}");
    $columns = [];

    while (($row = $stmt->fetch(PDO::FETCH_ASSOC)) !== false) {
        if (!isset($row['Field'])) {
            continue;
        }
        $columns[] = (string)$row['Field'];
    }

    return $columns;
}

function quoteIdentifier(string $identifier): string
{
    return '`' . str_replace('`', '``', $identifier) . '`';
}
