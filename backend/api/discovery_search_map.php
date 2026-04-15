<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/external_shop_discovery.php';
require_once __DIR__ . '/../lib/feature_access.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];
$accessDeniedMessage = 'Die Discovery-Funktion ist aktuell nur für freigeschaltete Admin-Nutzer verfügbar.';

if (!featureAccessCanUse('external_discovery', $currentUserId)) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => $accessDeniedMessage,
    ]);
    exit;
}
$payload = json_decode(file_get_contents('php://input'), true) ?: [];

$north = isset($payload['north']) ? (float)$payload['north'] : null;
$south = isset($payload['south']) ? (float)$payload['south'] : null;
$east = isset($payload['east']) ? (float)$payload['east'] : null;
$west = isset($payload['west']) ? (float)$payload['west'] : null;
$zoom = isset($payload['zoom']) ? (int)$payload['zoom'] : 0;
$query = trim((string)($payload['q'] ?? ''));

if (
    $north === null || $south === null || $east === null || $west === null
    || $north < -90 || $north > 90 || $south < -90 || $south > 90
    || $east < -180 || $east > 180 || $west < -180 || $west > 180
    || $south >= $north || $west >= $east
) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Ungültiger Kartenausschnitt.',
    ]);
    exit;
}

try {
    $search = externalShopSearchBounds(
        $pdo,
        $north,
        $south,
        $east,
        $west,
        $zoom,
        $currentUserId,
        $query
    );

    echo json_encode([
        'status' => 'success',
        'results' => $search['results'] ?? [],
        'meta' => $search['meta'] ?? null,
    ]);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'slots' => externalShopGetDiscoverySlotStatus($pdo, $currentUserId),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Discovery-Suche fehlgeschlagen.',
    ]);
}
