<?php
require_once __DIR__ . '/../db_connect.php';

$checkinId = $_GET['checkin_id'] ?? null;

if (!$checkinId) {
    http_response_code(400);
    echo json_encode(['error' => 'Checkin-ID fehlt']);
    exit;
}

// Daten aus der Tabelle `checkins` abrufen
$stmt = $pdo->prepare("SELECT * FROM checkins WHERE id = ?");
$stmt->execute([$checkinId]);
$checkin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$checkin) {
    http_response_code(404);
    echo json_encode(['error' => 'Checkin nicht gefunden']);
    exit;
}

// Daten aus der Tabelle `checkin_sorten` abrufen
$sortenStmt = $pdo->prepare("SELECT * FROM checkin_sorten WHERE checkin_id = ?");
$sortenStmt->execute([$checkinId]);
$sorten = $sortenStmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'checkin' => $checkin,
    'sorten' => $sorten
]);
?>
