<?php
require_once  __DIR__ . '/../db_connect.php';

// JSON Body auslesen
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['mention_id']) || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'mention_id und action erforderlich']);
    exit;
}

$mention_id = (int)$input['mention_id'];
$action = $input['action'];

if (!in_array($action, ['accept', 'decline'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Aktion']);
    exit;
}

// Status bestimmen
$status = $action === 'accept' ? 'accepted' : 'declined';

// Update Query
try {
    $stmt = $pdo->prepare("UPDATE checkin_mentions SET status = :status, updated_at = NOW() WHERE id = :id");
    $stmt->execute([
        ':status' => $status,
        ':id' => $mention_id
    ]);

    echo json_encode([
        'status' => 'success',
        'mention_id' => $mention_id,
        'new_status' => $status
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

?>