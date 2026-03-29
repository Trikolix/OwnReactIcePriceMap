<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/external_shop_discovery.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

$lat = isset($_GET['lat']) ? (float)$_GET['lat'] : null;
$lon = isset($_GET['lon']) ? (float)$_GET['lon'] : null;
$radiusMeters = isset($_GET['radius_m']) ? (int)$_GET['radius_m'] : 5000;
$query = trim((string)($_GET['q'] ?? ''));

if ($lat === null || $lon === null || $lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Gueltige Koordinaten werden fuer die Umkreissuche benoetigt.',
    ]);
    exit;
}

$radiusMeters = max(500, min(50000, $radiusMeters));

try {
    $search = externalShopSearchNearby($pdo, $lat, $lon, $radiusMeters, $query, $currentUserId);
    echo json_encode([
        'status' => 'success',
        'results' => $search['results'] ?? [],
        'hidden_counts' => [
            'existing' => (int)($search['meta']['hidden_existing'] ?? 0),
            'probable_duplicate' => (int)($search['meta']['hidden_duplicate'] ?? 0),
        ],
        'slots' => $search['meta']['slots'] ?? externalShopGetDiscoverySlotStatus($pdo, $currentUserId),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
