<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';

header('Content-Type: application/json');

try {
    $auth = requireAuth($pdo);
    $payload = json_decode(file_get_contents('php://input'), true);
    $stageNumber = (int)($payload['stage_number'] ?? 0);
    $secretCode = (string)($payload['secret_code'] ?? '');
    if ($stageNumber <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Etappe fehlt.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $result = findTourDeGlaceEasterEgg($pdo, (int)$auth['user_id'], $stageNumber, $secretCode);
    echo json_encode([
        'status' => 'success',
        ...$result,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Easter-Egg konnte nicht gespeichert werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
?>
