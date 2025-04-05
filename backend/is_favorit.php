<?php

header("Access-Control-Allow-Origin: *"); // oder spezifischer: http://localhost:3000
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$dbname = "db_439770_2";
$username = "USER439770_wed";
$password = "K8RYTP23y8kWSdt";

// Verbindung zur Datenbank
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Datenbankverbindung fehlgeschlagen"]);
    exit();
}

$nutzerId = $_GET['nutzer_id'] ?? null;
$eisdieleId = $_GET['eisdiele_id'] ?? null;

if (!$nutzerId || !$eisdieleId) {
    echo json_encode(["favorit" => false]);
    exit;
}

$stmt = $pdo->prepare("SELECT 1 FROM favoriten WHERE nutzer_id = ? AND eisdiele_id = ?");
$stmt->execute([$nutzerId, $eisdieleId]);

echo json_encode(["favorit" => (bool) $stmt->fetch()]);

?>