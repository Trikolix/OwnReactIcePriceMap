<?php
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = intval($input['user_id'] ?? $input['nutzer_id'] ?? 0);

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'user_id fehlt oder ungültig']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "INSERT INTO birthday_event_page_visits (user_id, first_visited_at)
         VALUES (:user_id, NOW())
         ON DUPLICATE KEY UPDATE user_id = user_id"
    );
    $stmt->execute(['user_id' => $userId]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
