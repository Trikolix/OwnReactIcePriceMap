<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/award_grants.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $auth = requireAuth($pdo);
    $payload = json_decode(file_get_contents('php://input'), true);
    $ids = is_array($payload) && is_array($payload['user_award_ids'] ?? null) ? $payload['user_award_ids'] : [];
    $updated = markAwardPopupsShown($pdo, (int)$auth['user_id'], $ids);
    echo json_encode(['success' => true, 'updated' => $updated], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Award-Anzeige konnte nicht bestätigt werden.'], JSON_UNESCAPED_UNICODE);
}
?>
