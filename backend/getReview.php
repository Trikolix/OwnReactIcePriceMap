<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
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

$userId = $_GET['userId'] ?? null;
$shopId = $_GET['shopId'] ?? null;

if (!$userId || !$shopId) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter"]);
    exit;
}

$sql = "SELECT id, geschmack, kugelgroesse, waffel, auswahl, beschreibung FROM bewertungen WHERE nutzer_id = :userId AND eisdiele_id = :shopId";
$stmt = $pdo->prepare($sql);
$stmt->execute([':userId' => $userId, ':shopId' => $shopId]);
$review = $stmt->fetch();

$stmtAllAttr = $pdo->prepare("SELECT name FROM attribute");
$stmtAllAttr->execute();
$allAttributes = $stmtAllAttr->fetchAll(PDO::FETCH_COLUMN);
if ($review) {
    // Attribute zur Bewertung abfragen
    $stmtAttr = $pdo->prepare("
        SELECT a.name 
        FROM bewertung_attribute ba 
        JOIN attribute a ON ba.attribut_id = a.id 
        WHERE ba.bewertung_id = :bewertungId
    ");
    $stmtAttr->execute(['bewertungId' => $review['id']]);
    $attributes = $stmtAttr->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'review' => $review,
        'attributes' => $attributes,
        'allAttributes' => $allAttributes
    ]);
} else {
    echo json_encode([
        'review' => null,
        'attributes' => null,
        'allAttributes' => $allAttributes
    ]);
}
?>