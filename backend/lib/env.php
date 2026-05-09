<?php

if (!function_exists('iceapp_parse_env_file')) {
    function iceapp_parse_env_file(string $path): array
    {
        if (!is_file($path)) {
            throw new RuntimeException('Env file not found: ' . $path);
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            throw new RuntimeException('Env file could not be read: ' . $path);
        }

        $values = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) {
                continue;
            }

            if (strpos($line, 'export ') === 0) {
                $line = trim(substr($line, 7));
            }

            $separatorPosition = strpos($line, '=');
            if ($separatorPosition === false) {
                continue;
            }

            $key = trim(substr($line, 0, $separatorPosition));
            $value = trim(substr($line, $separatorPosition + 1));
            if ($key === '') {
                continue;
            }

            if (
                strlen($value) >= 2
                && (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            $values[$key] = $value;
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
            putenv($key . '=' . $value);
        }

        return $values;
    }

    function iceapp_env_load_for_dir(string $baseDir): array
    {
        return iceapp_parse_env_file(rtrim($baseDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.env');
    }

    function iceapp_env_value(array $env, string $key, ?string $default = null): ?string
    {
        if (array_key_exists($key, $env)) {
            return $env[$key];
        }

        $value = getenv($key);
        if ($value !== false) {
            return $value;
        }

        return $default;
    }

    function iceapp_env_required(array $env, string $key): string
    {
        $value = iceapp_env_value($env, $key);
        if ($value === null || $value === '') {
            throw new RuntimeException('Required env value is missing: ' . $key);
        }

        return $value;
    }

    function iceapp_env_bool(array $env, string $key, bool $default = false): bool
    {
        $value = iceapp_env_value($env, $key);
        if ($value === null || $value === '') {
            return $default;
        }

        return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    function iceapp_env_csv(array $env, string $key, array $default = []): array
    {
        $value = iceapp_env_value($env, $key);
        if ($value === null || trim($value) === '') {
            return $default;
        }

        return array_values(array_filter(array_map('trim', explode(',', $value)), static fn (string $item): bool => $item !== ''));
    }

    function iceapp_db_config_from_env_dir(string $baseDir): array
    {
        $env = iceapp_env_load_for_dir($baseDir);
        $host = iceapp_env_required($env, 'DB_HOST');
        $port = iceapp_env_value($env, 'DB_PORT', '');
        if ($port === '' && preg_match('/^([^:]+):(\d+)$/', $host, $matches)) {
            $host = $matches[1];
            $port = $matches[2];
        }

        return [
            'host' => $host,
            'port' => $port,
            'dbname' => iceapp_env_required($env, 'DB_NAME'),
            'username' => iceapp_env_required($env, 'DB_USER'),
            'password' => iceapp_env_required($env, 'DB_PASSWORD'),
            'charset' => iceapp_env_value($env, 'DB_CHARSET', 'utf8mb4') ?: 'utf8mb4',
            'env' => $env,
        ];
    }
}
