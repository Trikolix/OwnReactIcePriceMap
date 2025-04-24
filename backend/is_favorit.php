<?php
require_once  __DIR__ . '/db_connect.php';

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