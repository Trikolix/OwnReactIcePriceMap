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
    if (!is_array($payload)) {
        $payload = [];
    }

    $stageNumber = (int)($payload['stage_number'] ?? 0);
    $stageWinner = (string)($payload['stage_winner'] ?? '');
    $top10 = $payload['stage_top10'] ?? [];
    if (!is_array($top10)) {
        $top10 = [];
    }
    if (!isset($top10[0]) || trim((string)$top10[0]) === '') {
        $top10[0] = $stageWinner;
    }
    for ($place = 2; $place <= 10; $place++) {
        $index = $place - 1;
        if ((!isset($top10[$index]) || trim((string)$top10[$index]) === '') && isset($payload['stage_place_' . $place])) {
            $top10[$index] = (string)$payload['stage_place_' . $place];
        }
    }
    $result = saveTourDeGlaceStageResult($pdo, (int)$auth['user_id'], $stageNumber, $stageWinner, $top10);

    echo json_encode([
        'status' => 'success',
        'stage_result' => $result,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Etappenergebnis konnte nicht gespeichert werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
?>
