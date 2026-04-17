<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/shop_maintenance.php';

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];

if ($userId !== 1) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    die();
}
$lat = isset($_GET['lat']) ? (float)$_GET['lat'] : null;
$lon = isset($_GET['lon']) ? (float)$_GET['lon'] : null;
$radiusM = isset($_GET['radius_m']) ? (int)$_GET['radius_m'] : SHOP_MAINTENANCE_DEFAULT_RADIUS_M;

if ($lat === null || $lon === null) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'lat und lon sind erforderlich.',
    ]);
    exit;
}

try {
    $tasks = shopMaintenanceFetchNearbyTasks($pdo, $lat, $lon, $radiusM);
    echo json_encode([
        'status' => 'success',
        'user_id' => $userId,
        'tasks' => $tasks,
        'meta' => [
            'radius_m' => max(1000, min(100000, $radiusM)),
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
