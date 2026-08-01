<?php
if (!defined('ACTIVITY_FEED_PDO_READY')) {
    require_once __DIR__ . '/db_connect.php';
}
require_once  __DIR__ . '/lib/checkin.php';
require_once  __DIR__ . '/lib/review.php';
require_once  __DIR__ . '/lib/route_helpers.php';
require_once  __DIR__ . '/lib/comment_registration.php';
require_once  __DIR__ . '/lib/comment_award.php';
require_once  __DIR__ . '/lib/opening_hours.php';
require_once  __DIR__ . '/lib/auth.php';
require_once  __DIR__ . '/lib/likes.php';

function getActivityLikeTarget(array $activity): ?array {
    $id = (int)($activity['id'] ?? 0);
    if ($id <= 0) {
        return null;
    }

    switch ($activity['typ'] ?? '') {
        case 'checkin':
            return ['entity_type' => 'checkin', 'entity_id' => $id];
        case 'bewertung':
            return ['entity_type' => 'bewertung', 'entity_id' => $id];
        case 'route':
            return ['entity_type' => 'route', 'entity_id' => $id];
        case 'new_user':
            return ['entity_type' => 'user_registration', 'entity_id' => $id];
        case 'award':
            return ['entity_type' => 'user_award', 'entity_id' => $id];
        default:
            return null;
    }
}

function enrichActivityFeedLikeState(PDO $pdo, array $activities, ?int $userId = null): array {
    $entities = [];
    foreach ($activities as $activity) {
        $target = getActivityLikeTarget($activity);
        if ($target) {
            $entities[] = $target;
        }
    }

    $likeStates = getLikeStatesForEntities($pdo, $entities, $userId);

    foreach ($activities as &$activity) {
        $target = getActivityLikeTarget($activity);
        if (!$target) {
            continue;
        }
        $key = buildLikeStateKey($target['entity_type'], $target['entity_id']);
        $state = $likeStates[$key] ?? ['likes_count' => 0, 'has_liked' => false];
        $activity['data']['likes_count'] = $state['likes_count'];
        $activity['data']['has_liked'] = $state['has_liked'];
    }
    unset($activity);

    return $activities;
}

function getActivityTarget(PDO $pdo, string $type, int $id, ?int $userId = null): ?array {
    if ($id <= 0 || !in_array($type, ['award', 'new_user'], true)) {
        return null;
    }

    if ($type === 'award') {
        $hasUserAwardCommentSupport = ensureKommentarUserAwardSupport($pdo);
        $commentCountSql = $hasUserAwardCommentSupport
            ? "(SELECT COUNT(*) FROM kommentare k WHERE k.user_award_id = ua.id) AS commentCount"
            : "0 AS commentCount";
        $stmt = $pdo->prepare(""
            . "SELECT ua.id, ua.user_id, n.username AS user_name, ua.award_id, ua.level,"
            . " ua.awarded_at AS datum, al.ep, al.title_de, al.description_de, al.icon_path,"
            . " up.avatar_path AS avatar_url, {$commentCountSql}"
            . " FROM user_awards ua"
            . " JOIN award_levels al ON ua.award_id = al.award_id AND ua.level = al.level"
            . " JOIN nutzer n ON ua.user_id = n.id"
            . " LEFT JOIN user_profile_images up ON up.user_id = n.id"
            . " WHERE ua.id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $hasUserRegistrationCommentSupport = ensureKommentarUserRegistrationSupport($pdo);
        $commentCountSql = $hasUserRegistrationCommentSupport
            ? "(SELECT COUNT(*) FROM kommentare k WHERE k.user_registration_id = n.id) AS commentCount"
            : "0 AS commentCount";
        $stmt = $pdo->prepare(""
            . "SELECT n.id, n.username, n.erstellt_am, n.current_level,"
            . " up.avatar_path AS avatar_url, {$commentCountSql}"
            . " FROM nutzer n"
            . " LEFT JOIN user_profile_images up ON up.user_id = n.id"
            . " WHERE n.id = :id AND n.is_verified = 1 LIMIT 1");
        $stmt->execute(['id' => $id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$data) {
        return null;
    }

    $data['id'] = (int)$data['id'];
    $data['aktivitaet_am'] = $type === 'award' ? $data['datum'] : $data['erstellt_am'];
    $activity = [[
        'typ' => $type,
        'id' => $data['id'],
        'data' => $data,
    ]];
    $enriched = enrichActivityFeedLikeState($pdo, $activity, $userId)[0];

    return [
        'typ' => $enriched['typ'],
        'id' => (int)$enriched['id'],
        'data' => $enriched['data'],
        'activityAt' => $enriched['data']['aktivitaet_am'] ?? null,
    ];
}

function isHistoricalActivityTarget(?string $activityAt, int $thresholdDays = 30): bool {
    if (!$activityAt) {
        return true;
    }

    try {
        $activityDate = new DateTimeImmutable($activityAt);
        $thresholdDate = new DateTimeImmutable('now');
        return $activityDate < $thresholdDate->modify('-' . $thresholdDays . ' days');
    } catch (Throwable $e) {
        return true;
    }
}

function getActivityFeed(PDO $pdo, int $offsetDays = 0, int $days = 7, ?int $userId = null): array {
    $activities = [];
    $hasUserRegistrationCommentSupport = ensureKommentarUserRegistrationSupport($pdo);
    $hasUserAwardCommentSupport = ensureKommentarUserAwardSupport($pdo);

    // 🟢 CHECKINS
    $stmtCheckins = $pdo->prepare("
        SELECT id, datum AS erstellt_am
        FROM checkins
        WHERE datum >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offsetPlusDays DAY)
          AND datum < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offset DAY)
        ORDER BY erstellt_am DESC
    ");
    $stmtCheckins->execute([
        'offsetPlusDays' => $offsetDays + $days,
        'offset'         => $offsetDays
    ]);
    $checkinIds = $stmtCheckins->fetchAll(PDO::FETCH_COLUMN);
    foreach ($checkinIds as $id) {
        $checkin = getCheckinById($pdo, $id);
        if ($checkin) {
            $activities[] = [
                'typ' => 'checkin',
                'id'  => $checkin['id'],
                'data'=> $checkin
            ];
        }
    }

    // 🟡 BEWERTUNGEN
    $reviews = getLatestReviews($pdo, $offsetDays, $days);
    foreach ($reviews as $review) {
        $activities[] = [
            'typ'  => 'bewertung',
            'id'   => $review['id'],
            'data' => $review
        ];
    }

    // 🔵 ROUTEN
    $stmtRouten = $pdo->prepare("
        SELECT r.*, n.username AS nutzer_name, up.avatar_path AS avatar_url
        FROM routen r
        JOIN nutzer n ON r.nutzer_id = n.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE r.ist_oeffentlich = TRUE
          AND r.erstellt_am >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offsetPlusDays DAY)
          AND r.erstellt_am < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offset DAY)
        ORDER BY r.erstellt_am DESC
    ");
    $stmtRouten->execute([
        'offsetPlusDays' => $offsetDays + $days,
        'offset'         => $offsetDays
    ]);
    $routen = $stmtRouten->fetchAll(PDO::FETCH_ASSOC);
    $routeShopMap = getRouteIceShops($pdo, array_column($routen, 'id'));
    foreach ($routen as $route) {
        $routeId = (int)$route['id'];
        $route['eisdielen'] = $routeShopMap[$routeId] ?? [];
        if (!empty($route['eisdielen'])) {
            $route['eisdiele_id'] = $route['eisdielen'][0]['id'];
            $route['eisdiele_name'] = $route['eisdielen'][0]['name'];
        }
        $route['commentCount'] = getCommentCountForRoute($pdo, $routeId);
        $activities[] = [
            'typ'  => 'route',
            'id'   => $route['id'],
            'data' => $route
        ];
    }

    // 🔷 Eisdielen
    $stmtEisdielen = $pdo->prepare("
        SELECT e.*, n.username AS nutzer_name, up.avatar_path AS avatar_url
        FROM eisdielen e
        JOIN nutzer n ON e.user_id = n.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE e.erstellt_am >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offsetPlusDays DAY)
          AND e.erstellt_am < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offset DAY)
        ORDER BY e.erstellt_am DESC
    ");
    $stmtEisdielen->execute([
        'offsetPlusDays' => $offsetDays + $days,
        'offset'         => $offsetDays
    ]);
    $eisdielen = $stmtEisdielen->fetchAll(PDO::FETCH_ASSOC);
    $openingHoursMap = fetch_opening_hours_map($pdo, array_column($eisdielen, 'id'));
    foreach ($eisdielen as $shop) {
        $shopId = (int)$shop['id'];
        $rows = $openingHoursMap[$shopId] ?? [];
        $note = $shop['opening_hours_note'] ?? null;
        if (empty($rows) && !empty($shop['openingHours'])) {
            $parsed = parse_legacy_opening_hours($shop['openingHours']);
            $rows = $parsed['rows'];
            if ($note === null && $parsed['note']) {
                $note = $parsed['note'];
            }
        }
        $shop['openingHoursStructured'] = build_structured_opening_hours($rows, $note);
        $shop['opening_hours_note'] = $note;
        $shop['is_open_now'] = is_shop_open($rows, null, $shop['status'] ?? null);
        $activities[] = [
            'typ'  => 'eisdiele',
            'id'   => $shop['id'],
            'data' => $shop
        ];
    }

    // 🆕 Neu registrierte (verifizierte) Benutzer
    $newUserSql = $hasUserRegistrationCommentSupport
        ? "
            SELECT n.id,
                   n.username,
                   n.erstellt_am,
                   n.current_level,
                   up.avatar_path AS avatar_url,
                   COALESCE(kc.comment_count, 0) AS commentCount
            FROM nutzer n
            LEFT JOIN user_profile_images up ON up.user_id = n.id
            LEFT JOIN (
                SELECT user_registration_id, COUNT(*) AS comment_count
                FROM kommentare
                WHERE user_registration_id IS NOT NULL
                GROUP BY user_registration_id
            ) kc ON kc.user_registration_id = n.id
            WHERE n.is_verified = 1
              AND n.erstellt_am >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offsetPlusDays DAY)
              AND n.erstellt_am < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offset DAY)
            ORDER BY n.erstellt_am DESC
        "
        : "
            SELECT n.id,
                   n.username,
                   n.erstellt_am,
                   n.current_level,
                   up.avatar_path AS avatar_url,
                   0 AS commentCount
            FROM nutzer n
            LEFT JOIN user_profile_images up ON up.user_id = n.id
            WHERE n.is_verified = 1
              AND n.erstellt_am >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offsetPlusDays DAY)
              AND n.erstellt_am < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offset DAY)
            ORDER BY n.erstellt_am DESC
        ";
    $stmtNewUsers = $pdo->prepare($newUserSql);
    $stmtNewUsers->execute([
        'offsetPlusDays' => $offsetDays + $days,
        'offset'         => $offsetDays
    ]);
    $newUsers = $stmtNewUsers->fetchAll(PDO::FETCH_ASSOC);
    foreach ($newUsers as $newUser) {
        $activities[] = [
            'typ'  => 'new_user',
            'id'   => $newUser['id'],
            'data' => $newUser
        ];
    }

    // Awards
    $awardCommentCountSql = $hasUserAwardCommentSupport
        ? "(SELECT COUNT(*) FROM kommentare k WHERE k.user_award_id = ua.id) AS commentCount"
        : "0 AS commentCount";

    $stmtAwards = $pdo->prepare("
        SELECT ua.id,
               ua.user_id,
               n.username AS user_name,
               ua.award_id,
               ua.level,
               ua.awarded_at AS datum,
               al.ep,
               al.title_de,
               al.description_de,
               al.icon_path,
               up.avatar_path AS avatar_url,
               {$awardCommentCountSql}
        FROM user_awards ua
        JOIN award_levels al 
          ON ua.award_id = al.award_id 
         AND ua.level = al.level
        JOIN nutzer n
          ON ua.user_id = n.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE (al.ep >= 50
          OR al.award_id = 19)
          AND ua.awarded_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offsetPlusDays DAY)
          AND ua.awarded_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offset DAY)
        ORDER BY ua.awarded_at DESC;");
    $awardParams = [
        'offsetPlusDays' => $offsetDays + $days,
        'offset'         => $offsetDays
    ];
    $stmtAwards->execute($awardParams);
    $awards = $stmtAwards->fetchAll(PDO::FETCH_ASSOC);
    foreach ($awards as $award) {
        $activities[] = [
            'typ'  => 'award',
            'id'   => $award['id'],
            'data' => $award
        ];
    }


    // 🔄 Nach Datum sortieren
    usort($activities, function ($a, $b) {
        $dateA = $a['data']['aktivitaet_am'] ?? $a['data']['erstellt_am'] ?? $a['data']['datum'] ?? null;
        $dateB = $b['data']['aktivitaet_am'] ?? $b['data']['erstellt_am'] ?? $b['data']['datum'] ?? null;
        return strtotime($dateB) <=> strtotime($dateA);
    });

    return enrichActivityFeedLikeState($pdo, $activities, $userId);
}

/**
 * Flexible Wrapper
 */
function getActivityFeedFlexible(PDO $pdo, ?int $offsetDays = null, int $days = 7, int $minCount = 20, ?int $userId = null): array {
    $activities = [];
    $offset = $offsetDays ?? 0; // Tage zurück vom heutigen Tag
    $earliestDate = '2025-04-01'; // manuell gesetzt, Datum der allerersten Aktivität

    while (count($activities) < $minCount) {
        $batch = getActivityFeed($pdo, $offset, $days, $userId);

        if (!empty($batch)) {
            $activities = array_merge($activities, $batch);
        }

        // Berechne das Datum des nächsten Batches
        $nextBatchDate = date('Y-m-d', strtotime("-" . ($offset + $days) . " days"));

        // Abbruch, wenn wir das früheste Datum erreicht haben
        if ($nextBatchDate < $earliestDate) {
            break;
        }

        // Offset für nächsten Batch erhöhen
        $offset += $days;
    }

    // Meta-Daten vorbereiten
    $meta['count']      = count($activities);
    $lastActivity = !empty($activities) ? end($activities) : null;
    $oldestActivityAt = $lastActivity
        ? ($lastActivity['data']['aktivitaet_am'] ?? $lastActivity['data']['erstellt_am'] ?? $lastActivity['data']['datum'] ?? null)
        : null;
    $meta['hasMore'] = $oldestActivityAt ? $oldestActivityAt > $earliestDate : false;
    $meta['nextOffset'] = $offset;
    $meta['oldestAt'] = $oldestActivityAt;

    return [
        'meta'       => $meta,
        'activities' => $activities
    ];
}

// Parameter aus Request
$mode = $_GET['mode'] ?? 'feed';
$offsetParam = isset($_GET['offset']) ? (int)$_GET['offset'] : null;
$authUser = authenticateRequest($pdo);
$userId = $authUser ? (int)$authUser['user_id'] : null;

if ($mode === 'target') {
    $targetType = (string)($_GET['type'] ?? '');
    $targetId = max(0, (int)($_GET['id'] ?? 0));
    $target = getActivityTarget($pdo, $targetType, $targetId, $userId);

    if (!$target) {
        http_response_code(404);
        echo json_encode([
            'target' => null,
            'meta' => ['found' => false],
        ]);
        exit;
    }

    $thresholdDays = 30;
    echo json_encode([
        'target' => $target,
        'meta' => [
            'found' => true,
            'historical' => isHistoricalActivityTarget($target['activityAt'] ?? null, $thresholdDays),
            'thresholdDays' => $thresholdDays,
        ],
    ]);
    exit;
}

$result = getActivityFeedFlexible($pdo, $offsetParam, 7, 20, $userId);

echo json_encode($result);
?>
