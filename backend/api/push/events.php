<?php
require_once __DIR__ . '/../../db_connect.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/notification_dispatcher.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method Not Allowed',
    ]);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$deliveryId = isset($body['delivery_id']) ? (int)$body['delivery_id'] : 0;
$event = isset($body['event']) ? (string)$body['event'] : '';
$subscriptionToken = isset($body['subscription_token']) ? (string)$body['subscription_token'] : null;
$auth = authenticateRequest($pdo);
$userId = $auth ? (int)$auth['user_id'] : null;

if ($deliveryId <= 0 || !in_array($event, ['shown', 'clicked'], true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Ungültiges Push-Event.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$success = recordPushDeliveryEvent($pdo, $deliveryId, $event, $subscriptionToken, $userId);
if (!$success) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Push-Event konnte nicht validiert werden.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

echo json_encode([
    'success' => true,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
