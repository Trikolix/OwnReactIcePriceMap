<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace_femme.php';
header('Content-Type: application/json');
try {
    $auth = requireAuth($pdo);
    $payload = json_decode(file_get_contents('php://input'), true);
    echo json_encode(['status' => 'success', 'tips' => submitTourDeGlaceFemmeTips($pdo, (int)$auth['user_id'], is_array($payload) ? $payload : [])], JSON_UNESCAPED_UNICODE);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Vorabtipps konnten nicht gespeichert werden.', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
