<?php
require_once __DIR__ . '/config.php';

$envHelperFile = __DIR__ . '/lib/env.php';
if (!is_readable($envHelperFile)) {
    $envHelperFile = __DIR__ . '/../backend/lib/env.php';
}
require_once $envHelperFile;

$requestLoggingFiles = [
    __DIR__ . '/lib/request_logging.php',
    __DIR__ . '/../backend/lib/request_logging.php',
];
foreach ($requestLoggingFiles as $requestLoggingFile) {
    if (is_readable($requestLoggingFile)) {
        require_once $requestLoggingFile;
        break;
    }
}

if (!function_exists('iceapp_log_event')) {
    function iceapp_client_ip(): ?string
    {
        foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $header) {
            if (empty($_SERVER[$header])) {
                continue;
            }

            $value = (string) $_SERVER[$header];
            if ($header === 'HTTP_X_FORWARDED_FOR') {
                $parts = explode(',', $value);
                return trim($parts[0]);
            }

            return trim($value);
        }

        return null;
    }

    function iceapp_hash_for_log(?string $value): ?string
    {
        $value = trim((string) $value);
        return $value === '' ? null : substr(hash('sha256', $value), 0, 16);
    }

    function iceapp_log_event(string $event, array $context = []): void
    {
        $payload = array_merge([
            'method' => $_SERVER['REQUEST_METHOD'] ?? null,
            'uri' => $_SERVER['REQUEST_URI'] ?? ($_SERVER['SCRIPT_NAME'] ?? null),
            'origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
            'host' => $_SERVER['HTTP_HOST'] ?? null,
            'ip_hash' => iceapp_hash_for_log(iceapp_client_ip()),
            'user_agent_hash' => iceapp_hash_for_log($_SERVER['HTTP_USER_AGENT'] ?? null),
        ], $context);
        error_log('[iceapp] ' . $event . ' ' . json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }
}

function iceapp_normalize_origin(?string $origin): ?string
{
    $origin = trim((string) $origin);
    if ($origin === '') {
        return null;
    }

    return rtrim($origin, '/');
}

function iceapp_emit_database_error(): void
{
    if (PHP_SAPI !== 'cli' && !headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode(['error' => 'Datenbankverbindung fehlgeschlagen']);
    exit;
}

try {
    $dbConfig = iceapp_db_config_from_env_dir(__DIR__);
    $env = $dbConfig['env'];
} catch (Throwable $e) {
    iceapp_log_event('env_load_failed', ['reason' => $e->getMessage()]);
    iceapp_emit_database_error();
}

$DEBUG_MODE = iceapp_env_bool($env, 'DEBUG_MODE', false);
$allowed_origins = array_map('iceapp_normalize_origin', iceapp_env_csv($env, 'CORS_ALLOWED_ORIGINS', [
    'https://ice-app.de',
    'https://www.ice-app.de',
    'https://ice-app.4lima.de',
    'http://www.ice-app.de',
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
    'http://localhost:5173',
]));
$allowed_origins = array_values(array_unique(array_filter($allowed_origins)));
$allowedMethods = iceapp_env_csv($env, 'CORS_ALLOWED_METHODS', ['POST', 'GET', 'OPTIONS']);
$trustedNoOriginPaths = iceapp_env_csv($env, 'TRUSTED_NO_ORIGIN_PATHS', [
    '~/Skripte/~i',
    '~/userManagement/cleanup_expired_tokens\.php$~i',
    '~/event2026/reminder_run\.php$~i',
]);

$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$normalizedOrigin = iceapp_normalize_origin($origin);
$httpHost = $_SERVER['HTTP_HOST'] ?? '';
$forwardedProto = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || $forwardedProto === 'https'
    || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';
$isCli = PHP_SAPI === 'cli';
$requestPath = $_SERVER['SCRIPT_NAME'] ?? ($_SERVER['REQUEST_URI'] ?? '');
$isTrustedNoOriginRequest = false;
foreach ($trustedNoOriginPaths as $trustedNoOriginPathPattern) {
    if (@preg_match($trustedNoOriginPathPattern, $requestPath)) {
        $isTrustedNoOriginRequest = true;
        break;
    }
}
$isScriptRequest = !$isCli
    && !$normalizedOrigin
    && $https
    && in_array("https://$httpHost", $allowed_origins, true)
    && $isTrustedNoOriginRequest;

if (!$isCli) {
    header('Vary: Origin');
}

if ($isCli) {
    // Cron/CLI jobs do not need browser CORS headers.
} elseif ($normalizedOrigin && in_array($normalizedOrigin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $normalizedOrigin");
    header('Access-Control-Allow-Credentials: true');
} elseif (!$normalizedOrigin && in_array("https://$httpHost", $allowed_origins, true) && $https) {
    header("Access-Control-Allow-Origin: https://$httpHost");
    header('Access-Control-Allow-Credentials: true');
} elseif ($isScriptRequest) {
    header("Access-Control-Allow-Origin: https://$httpHost");
    header('Access-Control-Allow-Credentials: true');
} elseif ($DEBUG_MODE) {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
    header('Access-Control-Allow-Origin: *');
} else {
    iceapp_log_event('cors_denied', [
        'allowed_origin_match' => $normalizedOrigin ? in_array($normalizedOrigin, $allowed_origins, true) : false,
        'https_detected' => $https,
        'forwarded_proto' => $forwardedProto ?: null,
    ]);
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized request']);
    exit;
}

if (!$isCli) {
    header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods));
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
}

if (!$isCli && ($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dsn = sprintf(
    'mysql:host=%s%s;dbname=%s;charset=%s',
    $dbConfig['host'],
    $dbConfig['port'] !== '' ? ';port=' . $dbConfig['port'] : '',
    $dbConfig['dbname'],
    $dbConfig['charset']
);

try {
    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo_dev = $pdo;
} catch (PDOException $e) {
    iceapp_log_event('database_connection_failed', [
        'db_host' => $dbConfig['host'],
        'db_name' => $dbConfig['dbname'],
        'reason' => $e->getMessage(),
    ]);
    iceapp_emit_database_error();
}
