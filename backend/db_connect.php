<?php
$DEBUG_MODE = false;

$allowed_origins = [
    'https://ice-app.de',
    'https://ice-app.4lima.de',
    'http://www.ice-app.de/',
    'https://www.ice-app.de/',
    'www.ice-app.de'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$host   = $_SERVER['HTTP_HOST'] ?? '';
$https  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

// 1. Origin ist gesetzt → klassische CORS-Anfrage
if ($origin && in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

// 2. Kein Origin – aber erlaubt, wenn von echtem Host über HTTPS und von Browser (Referer vorhanden)
elseif (!$origin && in_array("https://$host", $allowed_origins) && $https && isset($_SERVER['HTTP_REFERER'])) {
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

header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = "localhost";
$dbname = "db_439770_2";
$username = "USER439770_wed";
$password = "K8RYTP23y8kWSdt";

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
