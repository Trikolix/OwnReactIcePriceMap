<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';

header('Content-Type: application/json');

try {
    $auth = authenticateRequest($pdo);
    $userId = $auth ? (int)$auth['user_id'] : null;
    $jersey = (string)($_GET['jersey'] ?? 'yellow');
    $limit = (int)($_GET['limit'] ?? 50);
    $isStageTipLeaderboard = $jersey === 'stage_tips';
    echo json_encode([
        'status' => 'success',
        'jersey' => $jersey,
        'leaderboard' => $isStageTipLeaderboard ? getTourDeGlaceStageTipLeaderboard($pdo, $limit) : getTourDeGlaceLeaderboard($pdo, $jersey, $limit),
        'current_user_rank' => $userId ? ($isStageTipLeaderboard ? getTourDeGlaceStageTipUserRank($pdo, $userId) : getTourDeGlaceUserRank($pdo, $jersey, $userId)) : null,
        'leaders' => getTourDeGlaceOfficialLeaders($pdo),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Tour de Glace Rangliste konnte nicht geladen werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
?>
