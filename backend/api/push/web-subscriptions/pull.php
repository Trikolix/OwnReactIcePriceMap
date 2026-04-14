<?php
require_once __DIR__ . '/../../../db_connect.php';
require_once __DIR__ . '/../../../lib/notification_dispatcher.php';

ensurePushInfrastructureSchema($pdo);

$token = trim((string)($_GET['subscription_token'] ?? ''));
if ($token === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'subscription_token fehlt.',
    ]);
    exit;
}

$payloads = fetchPendingWebPushPayloads($pdo, $token, 5);
echo json_encode([
    'success' => true,
    'deliveries' => $payloads,
]);
