<?php
require_once  __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

// Daten aus der Anfrage holen
$data = json_decode(file_get_contents('php://input'), true);
$route_id = $data['id'] ?? null;

if (!$route_id || !$currentUserId) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Fehlende erforderliche Daten'
]);
    exit;
}

// SQL-Abfrage vorbereiten
$sql = "DELETE FROM routen WHERE id = :id AND nutzer_id = :nutzer_id";
$stmt = $pdo->prepare($sql);
$stmt->execute(['id' => $route_id, 'nutzer_id' => $currentUserId]);

echo json_encode([
    'status' => 'success',
    'message' => 'Route erfolgreich gelöscht'
]);
?>