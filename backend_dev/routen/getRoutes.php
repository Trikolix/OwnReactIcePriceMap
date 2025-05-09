<?php
require_once  __DIR__ . '/../db_connect.php';

// Eisdiele-ID aus der Anfrage holen
$eisdiele_id = $_GET['eisdiele_id'] ?? null;
$nutzer_id = $_GET['nutzer_id'] ?? null; // Optional: ID des eingeloggten Nutzers

if (!$eisdiele_id) {
    echo json_encode(['error' => 'Eisdiele-ID ist erforderlich']);
    exit;
}

// SQL-Abfrage vorbereiten
$sql = "SELECT r.*, n.username
        FROM routen r
        JOIN nutzer n ON r.nutzer_id = n.id
        WHERE r.eisdiele_id = :eisdiele_id AND (r.ist_oeffentlich = TRUE OR r.nutzer_id = :nutzer_id)";
$stmt = $pdo->prepare($sql);
$stmt->execute(['eisdiele_id' => $eisdiele_id, 'nutzer_id' => $nutzer_id]);

$routen = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($routen);
?>