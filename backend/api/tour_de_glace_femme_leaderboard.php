<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace_femme.php';
header('Content-Type: application/json');
try {
    $auth = authenticateRequest($pdo);
    $combined = ($_GET['mode'] ?? 'stage') === 'combined';
    $limit = (int)($_GET['limit'] ?? 50);
    $canShowCombined = $combined && hasTourDeGlaceFemmeCompleteResults($pdo);
    $entries = $canShowCombined
        ? getTourDeGlaceFemmeCombinedLeaderboard($pdo, $limit, true)
        : getTourDeGlaceFemmeStageLeaderboard($pdo, $limit, false);
    $userId = $auth ? (int)$auth['user_id'] : null;
    echo json_encode([
        'status' => 'success',
        'mode' => $canShowCombined ? 'combined' : 'stage',
        'leaderboard' => $entries,
        'current_user_rank' => $userId ? getTourDeGlaceFemmeUserRank($pdo, $userId, $canShowCombined) : null,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Rangliste konnte nicht geladen werden.', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
