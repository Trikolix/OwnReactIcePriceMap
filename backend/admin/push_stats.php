<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/notification_dispatcher.php';

header('Content-Type: application/json; charset=utf-8');

$auth = requireAuth($pdo);
$allowedUserIds = [1, 2];
if (!in_array((int)$auth['user_id'], $allowedUserIds, true)) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Forbidden',
    ]);
    exit;
}

ensurePushInfrastructureSchema($pdo);

$startDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($_GET['start'] ?? ''))
    ? (string)$_GET['start']
    : date('Y-m-d', strtotime('-30 days'));
$endDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($_GET['end'] ?? ''))
    ? (string)$_GET['end']
    : date('Y-m-d');
$channel = (string)($_GET['channel'] ?? 'all');
$type = (string)($_GET['type'] ?? 'all');

if (!in_array($channel, ['all', 'web', 'android'], true)) {
    $channel = 'all';
}

$where = [
    'd.created_at >= :start_date',
    'd.created_at < DATE_ADD(:end_date, INTERVAL 1 DAY)',
];
$params = [
    'start_date' => $startDate,
    'end_date' => $endDate,
];

if ($channel !== 'all') {
    $where[] = 'd.channel = :channel';
    $params['channel'] = $channel;
}

if ($type !== 'all') {
    $where[] = 'b.typ = :type';
    $params['type'] = $type;
}

$whereSql = implode(' AND ', $where);
$confirmedSql = "((d.channel = 'web' AND d.shown_at IS NOT NULL) OR (d.channel = 'android' AND d.provider_status_code BETWEEN 200 AND 299))";
$failedSql = "(d.status = 'failed' OR d.failure_at IS NOT NULL)";

function pushStatsFetchOne(PDO $pdo, string $sql, array $params): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
}

function pushStatsFetchAll(PDO $pdo, string $sql, array $params): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

$summary = pushStatsFetchOne($pdo, "
    SELECT
        COUNT(*) AS expected,
        COALESCE(SUM(CASE WHEN d.provider_status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END), 0) AS provider_accepted,
        COALESCE(SUM(CASE WHEN $confirmedSql THEN 1 ELSE 0 END), 0) AS confirmed,
        COALESCE(SUM(CASE WHEN d.clicked_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS clicked,
        COALESCE(SUM(CASE WHEN $failedSql THEN 1 ELSE 0 END), 0) AS failed,
        COALESCE(SUM(CASE WHEN d.status = 'pending' AND d.failure_at IS NULL AND NOT $confirmedSql THEN 1 ELSE 0 END), 0) AS pending
    FROM push_notification_deliveries d
    JOIN benachrichtigungen b ON b.id = d.notification_id
    WHERE $whereSql
", $params);

$byDay = pushStatsFetchAll($pdo, "
    SELECT
        DATE(d.created_at) AS day,
        COUNT(*) AS expected,
        COALESCE(SUM(CASE WHEN d.provider_status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END), 0) AS provider_accepted,
        COALESCE(SUM(CASE WHEN $confirmedSql THEN 1 ELSE 0 END), 0) AS confirmed,
        COALESCE(SUM(CASE WHEN d.clicked_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS clicked,
        COALESCE(SUM(CASE WHEN $failedSql THEN 1 ELSE 0 END), 0) AS failed,
        COALESCE(SUM(CASE WHEN d.status = 'pending' AND d.failure_at IS NULL AND NOT $confirmedSql THEN 1 ELSE 0 END), 0) AS pending
    FROM push_notification_deliveries d
    JOIN benachrichtigungen b ON b.id = d.notification_id
    WHERE $whereSql
    GROUP BY DATE(d.created_at)
    ORDER BY day ASC
", $params);

$byChannel = pushStatsFetchAll($pdo, "
    SELECT
        d.channel,
        COUNT(*) AS expected,
        COALESCE(SUM(CASE WHEN d.provider_status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END), 0) AS provider_accepted,
        COALESCE(SUM(CASE WHEN $confirmedSql THEN 1 ELSE 0 END), 0) AS confirmed,
        COALESCE(SUM(CASE WHEN d.clicked_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS clicked,
        COALESCE(SUM(CASE WHEN $failedSql THEN 1 ELSE 0 END), 0) AS failed,
        COALESCE(SUM(CASE WHEN d.status = 'pending' AND d.failure_at IS NULL AND NOT $confirmedSql THEN 1 ELSE 0 END), 0) AS pending
    FROM push_notification_deliveries d
    JOIN benachrichtigungen b ON b.id = d.notification_id
    WHERE $whereSql
    GROUP BY d.channel
    ORDER BY d.channel ASC
", $params);

$byType = pushStatsFetchAll($pdo, "
    SELECT
        b.typ AS type,
        COUNT(*) AS expected,
        COALESCE(SUM(CASE WHEN d.provider_status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END), 0) AS provider_accepted,
        COALESCE(SUM(CASE WHEN $confirmedSql THEN 1 ELSE 0 END), 0) AS confirmed,
        COALESCE(SUM(CASE WHEN d.clicked_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS clicked,
        COALESCE(SUM(CASE WHEN $failedSql THEN 1 ELSE 0 END), 0) AS failed,
        COALESCE(SUM(CASE WHEN d.status = 'pending' AND d.failure_at IS NULL AND NOT $confirmedSql THEN 1 ELSE 0 END), 0) AS pending
    FROM push_notification_deliveries d
    JOIN benachrichtigungen b ON b.id = d.notification_id
    WHERE $whereSql
    GROUP BY b.typ
    ORDER BY expected DESC, b.typ ASC
", $params);

$recentFailures = pushStatsFetchAll($pdo, "
    SELECT
        d.id,
        d.created_at,
        d.channel,
        d.provider_status_code,
        d.last_error,
        LEFT(COALESCE(d.provider_response, ''), 500) AS provider_response,
        b.typ AS type,
        b.text,
        n.username
    FROM push_notification_deliveries d
    JOIN benachrichtigungen b ON b.id = d.notification_id
    LEFT JOIN nutzer n ON n.id = d.user_id
    WHERE $whereSql
      AND $failedSql
    ORDER BY COALESCE(d.failure_at, d.created_at) DESC
    LIMIT 25
", $params);

$types = pushStatsFetchAll($pdo, "
    SELECT DISTINCT b.typ AS type
    FROM push_notification_deliveries d
    JOIN benachrichtigungen b ON b.id = d.notification_id
    WHERE d.created_at >= :start_date
      AND d.created_at < DATE_ADD(:end_date, INTERVAL 1 DAY)
    ORDER BY b.typ ASC
", [
    'start_date' => $startDate,
    'end_date' => $endDate,
]);

echo json_encode([
    'success' => true,
    'filters' => [
        'start' => $startDate,
        'end' => $endDate,
        'channel' => $channel,
        'type' => $type,
    ],
    'summary' => array_map('intval', $summary),
    'by_day' => $byDay,
    'by_channel' => $byChannel,
    'by_type' => $byType,
    'recent_failures' => $recentFailures,
    'types' => array_map(static fn(array $row): string => (string)$row['type'], $types),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
