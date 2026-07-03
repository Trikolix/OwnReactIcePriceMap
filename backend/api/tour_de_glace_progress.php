<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';
require_once __DIR__ . '/../lib/levelsystem.php';
require_once __DIR__ . '/../evaluators/TourDeGlaceAwardEvaluator.php';
require_once __DIR__ . '/../evaluators/TourDeGlaceStageTipAwardEvaluator.php';

header('Content-Type: application/json');

try {
    $auth = authenticateRequest($pdo);
    $userId = $auth ? (int)$auth['user_id'] : null;
    $progress = buildTourDeGlaceProgress($pdo, $userId);
    $newAwards = [];
    $levelChange = ['level_up' => false, 'new_level' => null, 'level_name' => null];

    if ($userId !== null) {
        try {
            $newAwards = array_merge(
                (new TourDeGlaceAwardEvaluator())->evaluate($userId),
                (new TourDeGlaceStageTipAwardEvaluator())->evaluate($userId)
            );
            $levelChange = updateUserLevelIfChanged($pdo, $userId);
        } catch (Throwable $e) {
            error_log("Fehler beim Evaluator: TourDeGlaceAwardEvaluator - " . $e->getMessage());
        }
    }

    echo json_encode([
        'status' => 'success',
        'authenticated' => $userId !== null,
        'new_awards' => $newAwards,
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => !empty($levelChange['level_up']) ? $levelChange['new_level'] : null,
        'current_level' => $levelChange['new_level'] ?? null,
        'level_name' => !empty($levelChange['level_up']) ? $levelChange['level_name'] : null,
        ...$progress,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Tour de Glace konnte nicht geladen werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
?>
