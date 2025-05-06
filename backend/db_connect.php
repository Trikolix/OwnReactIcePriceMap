<?php
$DEBUG_MODE = false;
$allowed_origins = [
    'https://ice-app.de',
    'https://ice-app.lima-city.de',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';


if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else if ($DEBUG_MODE) {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
    header('Access-Control-Allow-Origin: *');  // Offen im Debug-Modus
} else {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized origin']);
    exit;
}

header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
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
