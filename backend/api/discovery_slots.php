<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/external_shop_discovery.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

try {
    echo json_encode([
        'status' => 'success',
        'slots' => externalShopGetDiscoverySlotStatus($pdo, $currentUserId),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Discovery-Slots konnten nicht geladen werden.',
    ]);
}
