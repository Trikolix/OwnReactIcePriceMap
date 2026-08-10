<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/ice_dates.php';

ensureIceDateSchema($pdo);
$authData = requireAuth($pdo);
$userId = (int)$authData['user_id'];
$payload = json_decode(file_get_contents('php://input'), true);
$dateId = (int)($payload['ice_date_id'] ?? 0);
$status = iceDateNormalizeStatus((string)($payload['status'] ?? 'going'));

$stmt = $pdo->prepare("SELECT d.creator_user_id, d.status, creator.username AS creator_username FROM ice_dates d JOIN nutzer creator ON creator.id = d.creator_user_id JOIN ice_date_participants p ON p.date_id = d.id AND p.user_id = :user_id WHERE d.id = :date_id LIMIT 1");
$stmt->execute(['date_id' => $dateId, 'user_id' => $userId]);
$date = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$date || $date['status'] === 'cancelled') {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Eis-Date nicht gefunden.']);
    exit;
}

$update = $pdo->prepare("UPDATE ice_date_participants SET status = :status, updated_at = NOW() WHERE date_id = :date_id AND user_id = :user_id");
$update->execute(['status' => $status, 'date_id' => $dateId, 'user_id' => $userId]);
if ((int)$date['creator_user_id'] !== $userId) {
    $userStmt = $pdo->prepare('SELECT username FROM nutzer WHERE id = :id LIMIT 1');
    $userStmt->execute(['id' => $userId]);
    $username = (string)$userStmt->fetchColumn();
    $statusMessage = match ($status) {
        'going' => 'für dein Eis-Date zugesagt',
        'maybe' => 'angegeben, dass er vielleicht dabei ist',
        'declined' => 'für dein Eis-Date abgesagt',
        default => 'seine Teilnahme an deinem Eis-Date geändert',
    };
    iceDateNotify($pdo, (int)$date['creator_user_id'], $dateId, "{$username} hat {$statusMessage}.", 'rsvp', $username);
}

echo json_encode(['status' => 'success', 'ice_date' => iceDateFetchDetail($pdo, $dateId, null, $userId)]);
