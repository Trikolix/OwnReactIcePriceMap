<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';

header('Content-Type: application/json; charset=UTF-8');

function requireTourDeGlaceAdmin(PDO $pdo): array
{
    $auth = requireAuth($pdo);
    if ((int)($auth['user_id'] ?? 0) !== 1) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Kein Zugriff.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $auth;
}

function fetchTourDeGlaceAdminTips(PDO $pdo): array
{
    $stmt = $pdo->prepare("
        SELECT t.user_id,
               n.username,
               t.tip_gc_winner,
               t.tip_gc_second,
               t.tip_gc_third,
               t.tip_green_winner,
               t.tip_mountain_winner,
               t.tip_white_winner,
               t.submitted_at,
               t.updated_at
        FROM tour_de_glace_tips t
        JOIN nutzer n ON n.id = t.user_id
        WHERE t.campaign_id = ?
        ORDER BY t.updated_at DESC, t.submitted_at DESC, n.username ASC
    ");
    $stmt->execute([TOUR_DE_GLACE_ID]);
    return array_map(static fn(array $row): array => [
        'user_id' => (int)$row['user_id'],
        'username' => $row['username'],
        'tip_gc_winner' => $row['tip_gc_winner'],
        'tip_gc_second' => $row['tip_gc_second'],
        'tip_gc_third' => $row['tip_gc_third'],
        'tip_green_winner' => $row['tip_green_winner'],
        'tip_mountain_winner' => $row['tip_mountain_winner'],
        'tip_white_winner' => $row['tip_white_winner'],
        'submitted_at' => $row['submitted_at'],
        'updated_at' => $row['updated_at'],
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function fetchTourDeGlaceAdminStageTips(PDO $pdo): array
{
    $stmt = $pdo->prepare("
        SELECT t.user_id,
               n.username,
               t.stage_number,
               t.tip_stage_winner,
               t.submitted_at,
               t.updated_at
        FROM tour_de_glace_stage_tips t
        JOIN nutzer n ON n.id = t.user_id
        WHERE t.campaign_id = ?
        ORDER BY t.stage_number ASC, t.updated_at DESC, n.username ASC
    ");
    $stmt->execute([TOUR_DE_GLACE_ID]);
    $results = getTourDeGlaceStageResults($pdo);

    return array_map(static fn(array $row): array => formatTourDeGlaceStageTipRow($row, $results, null, $pdo), $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function fetchTourDeGlaceAdminStageResults(PDO $pdo): array
{
    $results = getTourDeGlaceStageResults($pdo);
    $rows = [];
    foreach (tourDeGlaceConfig()['stages'] as $stageNumber => $stage) {
        $result = $results[(int)$stageNumber] ?? [];
        $rows[] = [
            'stage_number' => (int)$stageNumber,
            'stage_date' => $stage['date'],
            'start_at' => getTourDeGlaceStageStart(['stage_number' => (int)$stageNumber] + $stage)->format('Y-m-d H:i:s'),
            'start_location' => $stage['start'],
            'finish_location' => $stage['finish'],
            'stage_winner' => $result['stage_winner'] ?? '',
            'stage_top10' => $result['top10'] ?? [],
            'updated_by_user_id' => $result['updated_by_user_id'] ?? null,
            'updated_at' => $result['updated_at'] ?? null,
        ];
    }
    return $rows;
}

function fetchTourDeGlaceAdminRiders(PDO $pdo, array $config): array
{
    $stmt = $pdo->prepare("
        SELECT p.user_id,
               n.username,
               p.rider_type,
               p.rider_type_changes,
               p.selected_at,
               p.created_at,
               p.updated_at
        FROM tour_de_glace_user_profiles p
        JOIN nutzer n ON n.id = p.user_id
        WHERE p.campaign_id = ?
        ORDER BY p.updated_at DESC, p.selected_at DESC, n.username ASC
    ");
    $stmt->execute([TOUR_DE_GLACE_ID]);
    $riderTypes = $config['rider_types'] ?? [];
    return array_map(static fn(array $row): array => [
        'user_id' => (int)$row['user_id'],
        'username' => $row['username'],
        'rider_type' => $row['rider_type'],
        'rider_type_label' => $riderTypes[$row['rider_type']]['name'] ?? $row['rider_type'],
        'rider_type_changes' => (int)$row['rider_type_changes'],
        'selected_at' => $row['selected_at'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function fetchTourDeGlaceAdminRiderDistribution(PDO $pdo, array $config): array
{
    $stmt = $pdo->prepare("
        SELECT rider_type, COUNT(*) AS count
        FROM tour_de_glace_user_profiles
        WHERE campaign_id = ?
        GROUP BY rider_type
        ORDER BY count DESC, rider_type ASC
    ");
    $stmt->execute([TOUR_DE_GLACE_ID]);
    $riderTypes = $config['rider_types'] ?? [];
    return array_map(static fn(array $row): array => [
        'rider_type' => $row['rider_type'],
        'label' => $riderTypes[$row['rider_type']]['name'] ?? $row['rider_type'],
        'count' => (int)$row['count'],
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function fetchTourDeGlaceAdminRecentEvents(PDO $pdo, int $scopeValue): array
{
    $stmt = $pdo->prepare("
        SELECT p.id,
               p.user_id,
               n.username,
               p.action_type,
               p.action_category,
               p.source_type,
               p.source_id,
               p.points_yellow,
               p.points_green,
               p.points_mountain,
               p.points_ice,
               p.points_white,
               p.created_at
        FROM tour_de_glace_point_events p
        JOIN nutzer n ON n.id = p.user_id
        WHERE p.campaign_id = ?
          AND p.is_shadow_test = ?
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT 40
    ");
    $stmt->execute([TOUR_DE_GLACE_ID, $scopeValue]);
    return array_map(static function (array $row): array {
        $total = (int)$row['points_yellow'] + (int)$row['points_green'] + (int)$row['points_mountain'] + (int)$row['points_ice'] + (int)$row['points_white'];
        return [
            'id' => (int)$row['id'],
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'action_type' => $row['action_type'],
            'action_category' => $row['action_category'],
            'source_type' => $row['source_type'],
            'source_id' => (int)$row['source_id'],
            'points_total' => $total,
            'points' => [
                'yellow' => (int)$row['points_yellow'],
                'green' => (int)$row['points_green'],
                'mountain' => (int)$row['points_mountain'],
                'ice' => (int)$row['points_ice'],
                'white' => (int)$row['points_white'],
            ],
            'created_at' => $row['created_at'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function fetchTourDeGlaceAdminSummary(PDO $pdo, int $scopeValue): array
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS events,
               COUNT(DISTINCT user_id) AS active_users,
               COALESCE(SUM(points_yellow), 0) AS yellow,
               COALESCE(SUM(points_green), 0) AS green,
               COALESCE(SUM(points_mountain), 0) AS mountain,
               COALESCE(SUM(points_ice), 0) AS ice,
               COALESCE(SUM(points_white), 0) AS white
        FROM tour_de_glace_point_events
        WHERE campaign_id = ?
          AND is_shadow_test = ?
    ");
    $stmt->execute([TOUR_DE_GLACE_ID, $scopeValue]);
    $points = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $tipsCount = (int)$pdo->query("SELECT COUNT(*) FROM tour_de_glace_tips WHERE campaign_id = " . $pdo->quote(TOUR_DE_GLACE_ID))->fetchColumn();
    $riderCount = (int)$pdo->query("SELECT COUNT(*) FROM tour_de_glace_user_profiles WHERE campaign_id = " . $pdo->quote(TOUR_DE_GLACE_ID))->fetchColumn();

    $eggStmt = $pdo->prepare("
        SELECT COUNT(*) AS sightings,
               COUNT(DISTINCT user_id) AS sighting_users
        FROM tour_de_glace_user_easter_eggs
        WHERE campaign_id = ?
          AND is_shadow_test = ?
    ");
    $eggStmt->execute([TOUR_DE_GLACE_ID, $scopeValue]);
    $eggs = $eggStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    return [
        'events' => (int)($points['events'] ?? 0),
        'active_users' => (int)($points['active_users'] ?? 0),
        'tips_count' => $tipsCount,
        'rider_count' => $riderCount,
        'stage_sightings' => (int)($eggs['sightings'] ?? 0),
        'stage_sighting_users' => (int)($eggs['sighting_users'] ?? 0),
        'points' => [
            'yellow' => (int)($points['yellow'] ?? 0),
            'green' => (int)($points['green'] ?? 0),
            'mountain' => (int)($points['mountain'] ?? 0),
            'ice' => (int)($points['ice'] ?? 0),
            'white' => (int)($points['white'] ?? 0),
        ],
    ];
}

try {
    $auth = requireTourDeGlaceAdmin($pdo);
    ensureTourDeGlaceTables($pdo);
    $config = tourDeGlaceConfig();
    $scopeValue = getTourDeGlacePointScopeValue((int)$auth['user_id']);

    echo json_encode([
        'status' => 'success',
        'campaign' => [
            'id' => $config['id'],
            'title' => $config['title'],
            'phase' => getTourDeGlacePhaseForUser((int)$auth['user_id']),
            'start' => $config['start'],
            'end' => $config['end'],
            'tip_deadline' => $config['tip_deadline'],
            'stage' => getCurrentTourDeGlaceStage(),
        ],
        'jerseys' => $config['jerseys'],
        'rider_types' => $config['rider_types'],
        'summary' => fetchTourDeGlaceAdminSummary($pdo, $scopeValue),
        'tips' => fetchTourDeGlaceAdminTips($pdo),
        'stage_tips' => fetchTourDeGlaceAdminStageTips($pdo),
        'stage_results' => fetchTourDeGlaceAdminStageResults($pdo),
        'riders' => fetchTourDeGlaceAdminRiders($pdo, $config),
        'rider_distribution' => fetchTourDeGlaceAdminRiderDistribution($pdo, $config),
        'recent_events' => fetchTourDeGlaceAdminRecentEvents($pdo, $scopeValue),
        'leaderboards' => getTourDeGlaceCompactLeaderboards($pdo, 5),
        'leaders' => getTourDeGlaceOfficialLeaders($pdo),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Tour-de-Glace Admin-Daten konnten nicht geladen werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
