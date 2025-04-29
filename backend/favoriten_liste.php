<?php
require_once  __DIR__ . '/db_connect.php';

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