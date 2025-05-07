<?php
require_once  __DIR__ . '/../db_connect.php';

// Daten aus der Anfrage holen
$data = json_decode(file_get_contents('php://input'), true);
$route_id = $data['id'] ?? null;
$nutzer_id = $data['nutzer_id'] ?? null;

if (!$route_id || !$nutzer_id) {
    echo json_encode(['error' => 'Fehlende erforderliche Daten']);
    exit;
}

// SQL-Abfrage vorbereiten
$sql = "DELETE FROM routen WHERE id = :id AND nutzer_id = :nutzer_id";
$stmt = $pdo->prepare($sql);
$stmt->execute(['id' => $route_id, 'nutzer_id' => $nutzer_id]);

echo json_encode(['message' => 'Route erfolgreich gelöscht']);
?>
