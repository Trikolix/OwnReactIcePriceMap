<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$placeId = (int)($data['place_id'] ?? 0);

$stmt = $pdo->prepare("SELECT id, user_id FROM eisdielen WHERE id = ? AND place_type = 'temporary_stand'");
$stmt->execute([$placeId]);
$place = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$place) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Temporärer Stand nicht gefunden.']);
    exit;
}
if ($currentUserId !== 1 && $currentUserId !== (int)$place['user_id']) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Du darfst diesen Stand nicht schließen.']);
    exit;
}

$update = $pdo->prepare('UPDATE eisdielen SET closed_early_at = CURRENT_TIMESTAMP WHERE id = ?');
$update->execute([$placeId]);
echo json_encode(['status' => 'success', 'message' => 'Der Stand wurde von der Karte entfernt.']);
?>
