<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

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

if (!$nutzerId) {
    echo json_encode(["error" => "nutzer_id fehlt"]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT 
        e.*,
        f.hinzugefuegt_am AS favorit_seit
    FROM favoriten f
    JOIN eisdielen e ON f.eisdiele_id = e.id
    WHERE f.nutzer_id = ?
    ORDER by f.hinzugefuegt_am DESC
");
$stmt->execute([$nutzerId]);
$favoriten = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($favoriten);

?>