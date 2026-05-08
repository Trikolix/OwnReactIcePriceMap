<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/shop_maintenance.php';

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];

if ($userId !== 1) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nur Admins dürfen diese Metriken abrufen.',
    ]);
    exit;
}

$requiredParams = ['min_lat', 'max_lat', 'min_lon', 'max_lon'];
foreach ($requiredParams as $param) {
    if (!isset($_GET[$param]) || !is_numeric($_GET[$param])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => "{$param} ist erforderlich.",
        ]);
        exit;
    }
}

$minLat = (float)$_GET['min_lat'];
$maxLat = (float)$_GET['max_lat'];
$minLon = (float)$_GET['min_lon'];
$maxLon = (float)$_GET['max_lon'];

if ($minLat > $maxLat) {
    [$minLat, $maxLat] = [$maxLat, $minLat];
}
if ($minLon > $maxLon) {
    [$minLon, $maxLon] = [$maxLon, $minLon];
}

$latSpan = $maxLat - $minLat;
$lonSpan = $maxLon - $minLon;

if ($minLat < -90 || $maxLat > 90 || $minLon < -180 || $maxLon > 180) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Ungültiger Kartenausschnitt.',
    ]);
    exit;
}

if ($latSpan > 8 || $lonSpan > 8) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Bitte weiter in die Karte hineinzoomen.',
    ]);
    exit;
}

try {
    $shops = shopMaintenanceFetchMapMetrics($pdo, $minLat, $maxLat, $minLon, $maxLon);
    echo json_encode([
        'status' => 'success',
        'meta' => [
            'generated_at' => gmdate('c'),
            'total' => count($shops),
        ],
        'shops' => $shops,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
