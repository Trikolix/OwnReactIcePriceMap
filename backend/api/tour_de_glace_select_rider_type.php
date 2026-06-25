<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';
require_once __DIR__ . '/../lib/levelsystem.php';
require_once __DIR__ . '/../evaluators/TourDeGlaceAwardEvaluator.php';

header('Content-Type: application/json');

try {
    $auth = requireAuth($pdo);
    $payload = json_decode(file_get_contents('php://input'), true);
    $riderType = (string)($payload['rider_type'] ?? '');
    $profile = selectTourDeGlaceRiderType($pdo, (int)$auth['user_id'], $riderType);
    $progress = buildTourDeGlaceProgress($pdo, (int)$auth['user_id']);
    $newAwards = [];
    $levelChange = ['level_up' => false, 'new_level' => null, 'level_name' => null];

    try {
        $newAwards = (new TourDeGlaceAwardEvaluator())->evaluate((int)$auth['user_id']);
        $levelChange = updateUserLevelIfChanged($pdo, (int)$auth['user_id']);
    } catch (Throwable $e) {
        error_log("Fehler beim Evaluator: TourDeGlaceAwardEvaluator - " . $e->getMessage());
    }

    echo json_encode([
        'status' => 'success',
        'profile' => [
            'rider_type' => $profile['rider_type'],
            'selected_at' => $profile['selected_at'] ?? null,
        ],
        'new_awards' => $newAwards,
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => !empty($levelChange['level_up']) ? $levelChange['new_level'] : null,
        'current_level' => $levelChange['new_level'] ?? null,
        'level_name' => !empty($levelChange['level_up']) ? $levelChange['level_name'] : null,
        ...$progress,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fahrertyp konnte nicht gespeichert werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
?>
