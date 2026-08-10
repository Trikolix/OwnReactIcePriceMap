<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/ice_dates.php';

ensureIceDateSchema($pdo);
$authData = requireAuth($pdo);
$userId = (int)$authData['user_id'];
$payload = json_decode(file_get_contents('php://input'), true);
$dateId = (int)($payload['ice_date_id'] ?? 0);

$stmt = $pdo->prepare('SELECT creator_user_id FROM ice_dates WHERE id = :date_id AND status = \'planned\' LIMIT 1');
$stmt->execute(['date_id' => $dateId]);
if ((int)$stmt->fetchColumn() !== $userId) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Nur die erstellende Person kann das Eis-Date absagen.']);
    exit;
}

$pdo->prepare("UPDATE ice_dates SET status = 'cancelled', cancelled_at = NOW() WHERE id = :date_id")->execute(['date_id' => $dateId]);
$participants = $pdo->prepare("SELECT user_id FROM ice_date_participants WHERE date_id = :date_id AND user_id <> :user_id AND status <> 'declined'");
$participants->execute(['date_id' => $dateId, 'user_id' => $userId]);
foreach ($participants->fetchAll(PDO::FETCH_COLUMN) as $participantId) {
    iceDateNotify($pdo, (int)$participantId, $dateId, 'Ein Eis-Date wurde abgesagt.', 'cancelled');
}
echo json_encode(['status' => 'success']);
