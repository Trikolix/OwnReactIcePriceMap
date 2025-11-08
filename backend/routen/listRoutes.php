<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/route_helpers.php';

header('Content-Type: application/json');

try {
    $nutzerId = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : null;
    $searchTerm = isset($_GET['search']) ? trim($_GET['search']) : '';
    $minLength = isset($_GET['min_length']) ? (float)$_GET['min_length'] : null;
    $maxLength = isset($_GET['max_length']) ? (float)$_GET['max_length'] : null;
    $minElevation = isset($_GET['min_elevation']) ? (int)$_GET['min_elevation'] : null;
    $maxElevation = isset($_GET['max_elevation']) ? (int)$_GET['max_elevation'] : null;
    $minShops = isset($_GET['min_shops']) ? (int)$_GET['min_shops'] : null;
    $maxShops = isset($_GET['max_shops']) ? (int)$_GET['max_shops'] : null;

    $types = [];
    if (!empty($_GET['typ'])) {
        $types = array_values(array_filter(array_map('trim', explode(',', $_GET['typ']))));
    }

    $difficulties = [];
    if (!empty($_GET['schwierigkeit'])) {
        $difficulties = array_values(array_filter(array_map('trim', explode(',', $_GET['schwierigkeit']))));
    }

    $conditions = [];
    $params = [];

    if ($nutzerId) {
        $conditions[] = '(r.ist_oeffentlich = 1 OR r.nutzer_id = :nutzer_id)';
        $params['nutzer_id'] = $nutzerId;
    } else {
        $conditions[] = 'r.ist_oeffentlich = 1';
    }

    if ($searchTerm !== '') {
        $conditions[] = '(r.name LIKE :search OR r.beschreibung LIKE :search)';
        $params['search'] = '%' . $searchTerm . '%';
    }

    if (!empty($types)) {
        $typePlaceholders = [];
        foreach ($types as $idx => $type) {
            $key = ":typ_$idx";
            $typePlaceholders[] = $key;
            $params[$key] = $type;
        }
        $conditions[] = 'r.typ IN (' . implode(',', $typePlaceholders) . ')';
    }

    if (!empty($difficulties)) {
        $difficultyPlaceholders = [];
        foreach ($difficulties as $idx => $difficulty) {
            $key = ":difficulty_$idx";
            $difficultyPlaceholders[] = $key;
            $params[$key] = $difficulty;
        }
        $conditions[] = 'r.schwierigkeit IN (' . implode(',', $difficultyPlaceholders) . ')';
    }

    if ($minLength !== null) {
        $conditions[] = '(r.laenge_km IS NOT NULL AND r.laenge_km >= :min_length)';
        $params['min_length'] = $minLength;
    }

    if ($maxLength !== null) {
        $conditions[] = '(r.laenge_km IS NOT NULL AND r.laenge_km <= :max_length)';
        $params['max_length'] = $maxLength;
    }

    if ($minElevation !== null) {
        $conditions[] = '(r.hoehenmeter IS NOT NULL AND r.hoehenmeter >= :min_elevation)';
        $params['min_elevation'] = $minElevation;
    }

    if ($maxElevation !== null) {
        $conditions[] = '(r.hoehenmeter IS NOT NULL AND r.hoehenmeter <= :max_elevation)';
        $params['max_elevation'] = $maxElevation;
    }

    $whereSql = '';
    if (!empty($conditions)) {
        $whereSql = 'WHERE ' . implode(' AND ', $conditions);
    }

    $havingParts = [];
    if ($minShops !== null) {
        $havingParts[] = 'eisdielen_count >= :min_shops';
        $params['min_shops'] = $minShops;
    }

    if ($maxShops !== null) {
        $havingParts[] = 'eisdielen_count <= :max_shops';
        $params['max_shops'] = $maxShops;
    }

    $havingSql = '';
    if (!empty($havingParts)) {
        $havingSql = 'HAVING ' . implode(' AND ', $havingParts);
    }

    $sql = "
        SELECT r.id,
               r.name,
               r.beschreibung,
               r.typ,
               r.laenge_km,
               r.hoehenmeter,
               r.schwierigkeit,
               r.url,
               r.embed_code,
               r.ist_oeffentlich,
               r.erstellt_am,
               r.nutzer_id,
               n.username,
               up.avatar_path AS avatar_url,
               COUNT(DISTINCT re.eisdiele_id) AS eisdielen_count
        FROM routen r
        JOIN nutzer n ON n.id = r.nutzer_id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        LEFT JOIN route_eisdielen re ON re.route_id = r.id
        $whereSql
        GROUP BY r.id, n.username, up.avatar_path
        $havingSql
        ORDER BY r.erstellt_am DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $routeIds = array_column($routes, 'id');
    $shopMap = getRouteIceShops($pdo, $routeIds);

    foreach ($routes as &$route) {
        $rid = (int)$route['id'];
        $route['eisdielen'] = $shopMap[$rid] ?? [];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $routes,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Routen konnten nicht geladen werden.',
        'details' => $e->getMessage(),
    ]);
}
