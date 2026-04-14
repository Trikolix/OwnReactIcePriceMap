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

if ($method === 'GET') {
    $publicKey = pushEnv('ICEAPP_WEB_PUSH_VAPID_PUBLIC_KEY');
    if (!$publicKey) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'message' => 'Web Push ist nicht konfiguriert.',
            'unsupported' => true,
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'public_key' => $publicKey,
    ]);
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
        $result = upsertWebPushSubscription(
            $pdo,
            $userId,
            (array)($body['subscription'] ?? []),
            $_SERVER['HTTP_USER_AGENT'] ?? null
        );

        echo json_encode([
            'success' => true,
            'message' => 'Web-Push-Subscription gespeichert.',
            'subscription_token' => $result['subscription_token'],
        ]);
        exit;
    }

    if ($method === 'DELETE') {
        invalidateWebPushSubscription($pdo, $userId, $body['endpoint'] ?? null);
        echo json_encode([
            'success' => true,
            'message' => 'Web-Push-Subscription deaktiviert.',
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
