<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $auth = requireAuth($pdo);
    if ((int)($auth['user_id'] ?? 0) !== 1) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Kein Zugriff.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $payload = json_decode(file_get_contents('php://input'), true);
    $result = saveTourDeGlaceFinalResults($pdo, (int)$auth['user_id'], is_array($payload) ? $payload : []);
    echo json_encode(['status' => 'success', 'final_results' => $result], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gesamtergebnisse konnten nicht gespeichert werden.', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
