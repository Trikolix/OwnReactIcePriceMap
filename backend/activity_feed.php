<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/checkin.php';
require_once  __DIR__ . '/lib/review.php';
require_once  __DIR__ . '/lib/route_helpers.php';

function getActivityFeed(PDO $pdo, int $offsetDays = 0, int $days = 7): array {
    $activities = [];

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
    foreach ($eisdielen as $shop) {
        $activities[] = [
            'typ'  => 'eisdiele',
            'id'   => $shop['id'],
            'data' => $shop
        ];
    }

    // Awards
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
               up.avatar_path AS avatar_url
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
    $stmtAwards->execute([
        'offsetPlusDays' => $offsetDays + $days,
        'offset'         => $offsetDays
    ]);
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
        $dateA = $a['data']['erstellt_am'] ?? $a['data']['datum'] ?? null;
        $dateB = $b['data']['erstellt_am'] ?? $b['data']['datum'] ?? null;
        return strtotime($dateB) <=> strtotime($dateA);
    });

    return $activities;
}

/**
 * Flexible Wrapper
 */
function getActivityFeedFlexible(PDO $pdo, ?int $offsetDays = null, int $days = 7, int $minCount = 20): array {
    $activities = [];
    $offset = $offsetDays ?? 0; // Tage zurück vom heutigen Tag
    $earliestDate = '2025-04-01'; // manuell gesetzt, Datum der allerersten Aktivität

    while (count($activities) < $minCount) {
        $batch = getActivityFeed($pdo, $offset, $days);

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
    $meta['hasMore']    = (end($activities)['data']['erstellt_am'] ?? end($activities)['data']['datum'] ??  null) > $earliestDate;
    $meta['nextOffset'] = $offset;

    return [
        'meta'       => $meta,
        'activities' => $activities
    ];
}

// Parameter aus Request
$offsetParam = isset($_GET['offset']) ? (int)$_GET['offset'] : null;
$result = getActivityFeedFlexible($pdo, $offsetParam, 7, 20);

echo json_encode($result);
?>
