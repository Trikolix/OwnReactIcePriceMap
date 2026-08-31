<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

$authData = requireAuth($pdo);
$reporterUserId = (int)$authData['user_id'];
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$placeId = (int)($data['place_id'] ?? 0);
$reason = (string)($data['reason'] ?? '');
$details = trim((string)($data['details'] ?? ''));
$allowedReasons = ['not_there', 'already_closed', 'wrong_details', 'other'];

if ($placeId <= 0 || !in_array($reason, $allowedReasons, true)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Meldung.']);
    exit;
}

$placeStmt = $pdo->prepare('SELECT id, place_type FROM eisdielen WHERE id = ?');
$placeStmt->execute([$placeId]);
$place = $placeStmt->fetch(PDO::FETCH_ASSOC);
if (!$place || $place['place_type'] === 'ice_shop') {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Der Eis-Ort wurde nicht gefunden.']);
    exit;
}

$duplicateStmt = $pdo->prepare("SELECT id FROM place_reports WHERE place_id = ? AND reporter_user_id = ? AND status = 'open' LIMIT 1");
$duplicateStmt->execute([$placeId, $reporterUserId]);
if ($duplicateStmt->fetchColumn()) {
    echo json_encode(['status' => 'success', 'message' => 'Deine Meldung liegt bereits vor.']);
    exit;
}

$insertStmt = $pdo->prepare('INSERT INTO place_reports (place_id, reporter_user_id, reason, details) VALUES (?, ?, ?, ?)');
$insertStmt->execute([$placeId, $reporterUserId, $reason, $details !== '' ? mb_substr($details, 0, 500) : null]);

echo json_encode(['status' => 'success', 'message' => 'Danke, deine Meldung wurde gespeichert.']);
?>
