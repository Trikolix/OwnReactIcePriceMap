<?php
require_once __DIR__ . '/config.php';
$DEBUG_MODE = false;

$allowed_origins = [
    'https://ice-app.de',
    'https://ice-app.4lima.de',
    'http://www.ice-app.de/',
    'https://www.ice-app.de/',
    'www.ice-app.de',
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
    'http://localhost:5173'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$host   = $_SERVER['HTTP_HOST'] ?? '';
$https  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
$isCli = PHP_SAPI === 'cli';
$requestPath = $_SERVER['SCRIPT_NAME'] ?? ($_SERVER['REQUEST_URI'] ?? '');
$trustedNoOriginPaths = [
    '~/Skripte/~i',
    '~/userManagement/cleanup_expired_tokens\.php$~i',
    '~/event2026/reminder_run\.php$~i',
];
$isTrustedNoOriginRequest = false;
foreach ($trustedNoOriginPaths as $trustedNoOriginPathPattern) {
    if (preg_match($trustedNoOriginPathPattern, $requestPath)) {
        $isTrustedNoOriginRequest = true;
        break;
    }
}
$isScriptRequest = !$isCli
    && !$origin
    && $https
    && in_array("https://$host", $allowed_origins)
    && $isTrustedNoOriginRequest;

// 1. Origin ist gesetzt → klassische CORS-Anfrage
if ($isCli) {
    // Cron/CLI jobs do not send browser CORS headers.
}
elseif ($origin && in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

// 2. Kein Origin – aber erlaubt, wenn von echtem Host über HTTPS und von Browser (Referer vorhanden)
elseif (!$origin && in_array("https://$host", $allowed_origins) && $https && isset($_SERVER['HTTP_REFERER'])) {
    header("Access-Control-Allow-Origin: https://$host");
    header('Access-Control-Allow-Credentials: true');
}
elseif ($isScriptRequest) {
    header("Access-Control-Allow-Origin: https://$host");
    header('Access-Control-Allow-Credentials: true');
}

// 3. Debug-Modus erlaubt alles
elseif ($DEBUG_MODE) {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
    header('Access-Control-Allow-Origin: *');
}

// 4. Alles andere wird blockiert
else {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized request']);
    exit;
}

if (!$isCli) {
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
}

if (!$isCli && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = "10.35.233.205:3306";
$dbname = "k320202_iceapp";
$username = "k320202_iceapp";
$password = "@i5w647cU";

// Verbindung zur Datenbank
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Datenbankverbindung fehlgeschlagen"]);
    exit();
}
?>
