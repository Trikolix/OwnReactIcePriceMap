<?php
require_once __DIR__ . '/../../../db_connect.php';
require_once __DIR__ . '/../../../lib/auth.php';
require_once __DIR__ . '/../../../lib/notification_dispatcher.php';

ensurePushInfrastructureSchema($pdo);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$auth = requireAuth($pdo);
$body = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = isset($body['user_id']) ? (int)$body['user_id'] : 0;
if ($userId <= 0 || $userId !== (int)$auth['user_id']) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Nutzer stimmt nicht mit der Session ueberein.',
    ]);
    exit;
}

try {
    if ($method === 'POST') {
        upsertMobilePushDevice(
            $pdo,
            $userId,
            (string)($body['platform'] ?? 'android'),
            (string)($body['provider'] ?? 'fcm'),
            (string)($body['device_token'] ?? ''),
            isset($body['app_version']) ? (string)$body['app_version'] : null
        );

        echo json_encode([
            'success' => true,
            'message' => 'Mobile-Push-Device gespeichert.',
        ]);
        exit;
    }

    if ($method === 'DELETE') {
        invalidateMobilePushDevice($pdo, $userId, $body['device_token'] ?? null);
        echo json_encode([
            'success' => true,
            'message' => 'Mobile-Push-Device deaktiviert.',
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Methode nicht erlaubt.',
    ]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
