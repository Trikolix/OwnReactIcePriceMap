<?php
require_once  __DIR__ . '/db_connect.php';

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