<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace_femme.php';
header('Content-Type: application/json');
try {
    $auth = requireAuth($pdo);
    $payload = json_decode(file_get_contents('php://input'), true) ?: [];
    echo json_encode(['status' => 'success', 'stage_tip' => submitTourDeGlaceFemmeStageTip($pdo, (int)$auth['user_id'], (int)($payload['stage_number'] ?? 0), (string)($payload['tip_stage_winner'] ?? ''))], JSON_UNESCAPED_UNICODE);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Etappentipp konnte nicht gespeichert werden.', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
