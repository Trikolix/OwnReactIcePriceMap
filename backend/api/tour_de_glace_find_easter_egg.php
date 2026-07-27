<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';
require_once __DIR__ . '/../lib/levelsystem.php';
require_once __DIR__ . '/../evaluators/TourDeGlaceAwardEvaluator.php';

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
    $newAwards = (new TourDeGlaceAwardEvaluator())->evaluate((int)$auth['user_id']);
    $levelChange = updateUserLevelIfChanged($pdo, (int)$auth['user_id']);
    echo json_encode([
        'status' => 'success',
        'new_awards' => $newAwards,
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => !empty($levelChange['level_up']) ? $levelChange['new_level'] : null,
        'current_level' => $levelChange['new_level'] ?? null,
        'level_name' => !empty($levelChange['level_up']) ? $levelChange['level_name'] : null,
        ...$result,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Etappensichtung konnte nicht gespeichert werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
?>
