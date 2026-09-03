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
    // Wenn Geräte abgefragt werden oder der Subscription-Status geprüft wird
    if (isset($_GET['devices']) || isset($_GET['check'])) {
        $auth = requireAuth($pdo);
        $userId = (int)$auth['user_id'];

        if (isset($_GET['check'])) {
            $token = trim((string)($_GET['subscription_token'] ?? ''));
            $endpoint = trim((string)($_GET['endpoint'] ?? ''));
            $isActive = false;

            if ($token !== '') {
                $stmt = $pdo->prepare("
                    SELECT id FROM web_push_subscriptions
                    WHERE user_id = :user_id AND subscription_token = :token AND invalidated_at IS NULL
                    LIMIT 1
                ");
                $stmt->execute(['user_id' => $userId, 'token' => $token]);
                $isActive = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
            } elseif ($endpoint !== '') {
                $stmt = $pdo->prepare("
                    SELECT id FROM web_push_subscriptions
                    WHERE user_id = :user_id AND endpoint_hash = :hash AND invalidated_at IS NULL
                    LIMIT 1
                ");
                $stmt->execute(['user_id' => $userId, 'hash' => hash('sha256', $endpoint)]);
                $isActive = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
            }

            echo json_encode([
                'success' => true,
                'active' => $isActive,
            ]);
            exit;
        }

        if (isset($_GET['devices'])) {
            $devices = fetchUserWebPushDevices($pdo, $userId);
            echo json_encode([
                'success' => true,
                'devices' => $devices,
            ]);
            exit;
        }
    }

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
        'message' => 'Nutzer stimmt nicht mit der Session überein.',
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

        // Sicherstellen, dass push_enabled_web für den Nutzer aktiv ist
        $pdo->prepare("
            UPDATE user_notification_settings
            SET push_enabled_web = 1, updated_at = NOW()
            WHERE user_id = :user_id
        ")->execute(['user_id' => $userId]);

        echo json_encode([
            'success' => true,
            'message' => 'Web-Push-Subscription gespeichert.',
            'subscription_token' => $result['subscription_token'],
        ]);
        exit;
    }

    if ($method === 'DELETE') {
        $allDevices = !empty($body['all_devices']);
        invalidateWebPushSubscription($pdo, $userId, $body['endpoint'] ?? null, $allDevices);

        // Prüfen, ob noch weitere aktive Subscriptions existieren
        $remaining = fetchActiveWebPushSubscriptions($pdo, $userId);
        if (empty($remaining) || $allDevices) {
            $pdo->prepare("
                UPDATE user_notification_settings
                SET push_enabled_web = 0, updated_at = NOW()
                WHERE user_id = :user_id
            ")->execute(['user_id' => $userId]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Web-Push-Subscription deaktiviert.',
            'remaining_active_devices' => count($remaining),
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
