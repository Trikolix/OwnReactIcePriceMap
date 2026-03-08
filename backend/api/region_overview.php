<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/leaderboard_periods.php';
require_once __DIR__ . '/../lib/regions.php';

header('Content-Type: application/json; charset=utf-8');

$level = strtolower(trim((string)($_GET['level'] ?? '')));
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!in_array($level, ['bundesland', 'landkreis'], true) || $id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültige Region'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $regionMeta = getRegionMeta($pdo, $level, $id);
    if ($regionMeta === null) {
        http_response_code(404);
        echo json_encode(['error' => 'Region nicht gefunden'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $lifetimeStart = new DateTimeImmutable('2000-01-01 00:00:00', new DateTimeZone('Europe/Berlin'));
    $now = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
    $activeUsers = calculatePeriodLeaderboard($pdo, $lifetimeStart, $now, $level, $id);

    echo json_encode([
        'region_meta' => $regionMeta,
        'top_shops' => getRegionTopShops($pdo, $level, $id),
        'active_users' => array_slice($activeUsers, 0, 20),
        'price_summary' => getRegionPriceSummary($pdo, $level, $id),
        'price_trend' => getRegionPriceTrend($pdo, $level, $id),
        'related_regions' => [],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
