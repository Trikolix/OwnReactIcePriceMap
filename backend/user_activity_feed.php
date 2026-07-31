<?php
if (!defined('USER_ACTIVITY_FEED_PDO_READY')) {
    require_once __DIR__ . '/db_connect.php';
}
require_once __DIR__ . '/lib/checkin.php';
require_once __DIR__ . '/lib/review.php';
require_once __DIR__ . '/lib/route_helpers.php';
require_once __DIR__ . '/lib/opening_hours.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/likes.php';

function getUserActivityLikeTarget(array $activity): ?array {
    $id = (int)($activity['id'] ?? 0);
    if ($id <= 0) return null;

    return match ($activity['typ'] ?? '') {
        'checkin' => ['entity_type' => 'checkin', 'entity_id' => $id],
        'bewertung' => ['entity_type' => 'bewertung', 'entity_id' => $id],
        'route' => ['entity_type' => 'route', 'entity_id' => $id],
        default => null,
    };
}

function enrichUserActivityLikeState(PDO $pdo, array $activities, ?int $viewerId): array {
    $entities = [];
    foreach ($activities as $activity) {
        $target = getUserActivityLikeTarget($activity);
        if ($target) $entities[] = $target;
    }
    $states = getLikeStatesForEntities($pdo, $entities, $viewerId);

    foreach ($activities as &$activity) {
        $target = getUserActivityLikeTarget($activity);
        if (!$target) continue;
        $key = buildLikeStateKey($target['entity_type'], $target['entity_id']);
        $state = $states[$key] ?? ['likes_count' => 0, 'has_liked' => false];
        $activity['data']['likes_count'] = $state['likes_count'];
        $activity['data']['has_liked'] = $state['has_liked'];
    }
    unset($activity);

    return $activities;
}

function getUserRouteActivity(PDO $pdo, int $routeId): ?array {
    $stmt = $pdo->prepare('SELECT r.*, n.username AS nutzer_name, up.avatar_path AS avatar_url
        FROM routen r
        JOIN nutzer n ON r.nutzer_id = n.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE r.id = ?');
    $stmt->execute([$routeId]);
    $route = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$route) return null;

    $shops = getRouteIceShops($pdo, [$routeId]);
    $route['eisdielen'] = $shops[$routeId] ?? [];
    if (!empty($route['eisdielen'])) {
        $route['eisdiele_id'] = $route['eisdielen'][0]['id'];
        $route['eisdiele_name'] = $route['eisdielen'][0]['name'];
    }
    $route['commentCount'] = getCommentCountForRoute($pdo, $routeId);
    return $route;
}

function getUserShopActivity(PDO $pdo, int $shopId): ?array {
    $stmt = $pdo->prepare('SELECT e.*, n.username AS nutzer_name, up.avatar_path AS avatar_url
        FROM eisdielen e
        JOIN nutzer n ON e.user_id = n.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE e.id = ?');
    $stmt->execute([$shopId]);
    $shop = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$shop) return null;

    $rows = fetch_opening_hours_map($pdo, [$shopId])[$shopId] ?? [];
    $note = $shop['opening_hours_note'] ?? null;
    if (empty($rows) && !empty($shop['openingHours'])) {
        $parsed = parse_legacy_opening_hours($shop['openingHours']);
        $rows = $parsed['rows'];
        $note = $note ?? $parsed['note'];
    }
    $shop['openingHoursStructured'] = build_structured_opening_hours($rows, $note);
    $shop['opening_hours_note'] = $note;
    $shop['is_open_now'] = is_shop_open($rows, null, $shop['status'] ?? null);
    return $shop;
}

$profileUserId = max(0, (int)($_GET['profile_user_id'] ?? 0));
$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
$offset = max(0, (int)($_GET['offset'] ?? 0));
if ($profileUserId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'profile_user_id ist erforderlich.']);
    exit;
}

$authUser = authenticateRequest($pdo);
$viewerId = $authUser ? (int)$authUser['user_id'] : null;
$isOwner = $viewerId !== null && $viewerId === $profileUserId;
$reviewTimestamp = hasReviewEditedAtColumn($pdo)
    ? "CASE WHEN b.zuletzt_bearbeitet_am IS NOT NULL AND b.erstellt_am < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY) THEN b.zuletzt_bearbeitet_am ELSE b.erstellt_am END"
    : 'b.erstellt_am';

$sql = "SELECT activity_type, activity_id, occurred_at FROM (
    SELECT 'checkin' AS activity_type, c.id AS activity_id, c.datum AS occurred_at
    FROM checkins c WHERE c.nutzer_id = ?
    UNION ALL
    SELECT 'bewertung' AS activity_type, b.id AS activity_id, {$reviewTimestamp} AS occurred_at
    FROM bewertungen b WHERE b.nutzer_id = ?
    UNION ALL
    SELECT 'route' AS activity_type, r.id AS activity_id, r.erstellt_am AS occurred_at
    FROM routen r WHERE r.nutzer_id = ? AND (r.ist_oeffentlich = TRUE OR ? = 1)
    UNION ALL
    SELECT 'eisdiele' AS activity_type, e.id AS activity_id, e.erstellt_am AS occurred_at
    FROM eisdielen e WHERE e.user_id = ?
) AS profile_activities
ORDER BY occurred_at DESC, activity_id DESC
LIMIT ? OFFSET ?";

$stmt = $pdo->prepare($sql);
$stmt->bindValue(1, $profileUserId, PDO::PARAM_INT);
$stmt->bindValue(2, $profileUserId, PDO::PARAM_INT);
$stmt->bindValue(3, $profileUserId, PDO::PARAM_INT);
$stmt->bindValue(4, $isOwner ? 1 : 0, PDO::PARAM_INT);
$stmt->bindValue(5, $profileUserId, PDO::PARAM_INT);
$stmt->bindValue(6, $limit + 1, PDO::PARAM_INT);
$stmt->bindValue(7, $offset, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$hasMore = count($rows) > $limit;
$rows = array_slice($rows, 0, $limit);

$activities = [];
foreach ($rows as $row) {
    $id = (int)$row['activity_id'];
    $data = match ($row['activity_type']) {
        'checkin' => getCheckinById($pdo, $id),
        'bewertung' => getReviewById($pdo, $id),
        'route' => getUserRouteActivity($pdo, $id),
        'eisdiele' => getUserShopActivity($pdo, $id),
        default => null,
    };
    if (!$data) continue;
    $data['aktivitaet_am'] = $row['occurred_at'];
    $activities[] = ['typ' => $row['activity_type'], 'id' => $id, 'data' => $data];
}

echo json_encode([
    'activities' => enrichUserActivityLikeState($pdo, $activities, $viewerId),
    'meta' => [
        'limit' => $limit,
        'offset' => $offset,
        'next_offset' => $offset + count($rows),
        'has_more' => $hasMore,
    ],
]);
