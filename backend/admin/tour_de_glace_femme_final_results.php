<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/tour_de_glace_femme.php';
header('Content-Type: application/json');
try {
    $auth = requireAuth($pdo);
    if ((int)$auth['user_id'] !== 1) throw new RuntimeException('Kein Zugriff.');
    $payload = json_decode(file_get_contents('php://input'), true) ?: [];
    $result = saveTourDeGlaceFemmeFinalResults($pdo, (int)$auth['user_id'], $payload);
    echo json_encode(['status' => 'success'] + $result, JSON_UNESCAPED_UNICODE);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Endergebnisse konnten nicht gespeichert werden.', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
