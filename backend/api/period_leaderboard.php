<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/leaderboard_periods.php';

header('Content-Type: application/json; charset=utf-8');

$period = strtolower(trim((string)($_GET['period'] ?? 'overall')));
$periodKey = isset($_GET['period_key']) ? trim((string)$_GET['period_key']) : null;
$scope = strtolower(trim((string)($_GET['scope'] ?? 'global')));
$scopeId = isset($_GET['scope_id']) ? (int)$_GET['scope_id'] : null;
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : (isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : null);

try {
    $window = getPeriodWindow($period, $periodKey);
    $normalizedScope = normalizeLeaderboardScope($scope, $scopeId);
    $rows = calculatePeriodLeaderboard(
        $pdo,
        $window['start'],
        $window['end'],
        $normalizedScope['scope'],
        $normalizedScope['scope_id']
    );

    echo json_encode(
        buildLeaderboardResponse(
            $rows,
            $userId ?: null,
            $window['start'],
            $window['end'],
            $window['period'],
            $normalizedScope['scope'],
            $normalizedScope['scope_id']
        ),
        JSON_UNESCAPED_UNICODE
    );
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
