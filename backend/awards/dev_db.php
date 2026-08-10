<?php

function getAwardsDevPdo(): PDO
{
    static $pdoDev = null;
    if ($pdoDev instanceof PDO) {
        return $pdoDev;
    }

    $envHelperFile = __DIR__ . '/../lib/env.php';
    require_once $envHelperFile;

    $devDir = __DIR__ . '/../../backend_dev';
    $dbConfig = iceapp_db_config_from_env_dir($devDir);
    $dsn = sprintf(
        'mysql:host=%s%s;dbname=%s;charset=%s',
        $dbConfig['host'],
        $dbConfig['port'] !== '' ? ';port=' . $dbConfig['port'] : '',
        $dbConfig['dbname'],
        $dbConfig['charset']
    );

    $pdoDev = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdoDev;
}
