<?php
require_once __DIR__ . '/../../../db_connect.php';
require_once __DIR__ . '/../../../lib/auth.php';
require_once __DIR__ . '/../../../lib/notification_dispatcher.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { http_response_code(200); exit; }
ensurePushInfrastructureSchema($pdo);
if ($method === 'GET' && !isset($_GET['devices']) && !isset($_GET['check'])) {
    $key = pushEnv('ICEAPP_WEB_PUSH_VAPID_PUBLIC_KEY');
    if (!$key) http_response_code(503);
    echo json_encode($key ? ['success' => true, 'public_key' => $key]
        : ['success' => false, 'message' => 'Web Push ist nicht konfiguriert.', 'unsupported' => true]);
    exit;
}
try {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    // Subscription renewal in a background worker has no access to the page's auth token.
    // Its existing, active subscription token authorizes only replacement of that device.
    $renewing = $method === 'POST' && !empty($body['renewal']);
    $previous = null;
    if ($renewing) {
        $stmt = $pdo->prepare('SELECT id, user_id, endpoint FROM web_push_subscriptions WHERE subscription_token = ? AND invalidated_at IS NULL');
        $stmt->execute([(string)($body['previous_subscription_token'] ?? '')]);
        $previous = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$previous || (int)fetchUserNotificationSettings($pdo, (int)$previous['user_id'])['push_enabled_web'] !== 1) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Dieses Gerät ist nicht mehr für Push aktiviert.']);
            exit;
        }
        $userId = (int)$previous['user_id'];
    } else {
        $auth = requireAuth($pdo);
        $userId = (int)$auth['user_id'];
        if (isset($body['user_id']) && (int)$body['user_id'] !== $userId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Zugriff verweigert.']);
            exit;
        }
    }
    if ($method === 'GET') {
        $endpoint = trim((string)($_GET['endpoint'] ?? ''));
        if (isset($_GET['check'])) {
            $token = trim((string)($_GET['subscription_token'] ?? ''));
            $stmt = $pdo->prepare('SELECT invalidated_at FROM web_push_subscriptions WHERE user_id = ? AND (endpoint_hash = ? OR subscription_token = ?) ORDER BY updated_at DESC LIMIT 1');
            $stmt->execute([$userId, hash('sha256', $endpoint), $token]);
            $device = $stmt->fetch(PDO::FETCH_ASSOC);
            $enabled = (int)fetchUserNotificationSettings($pdo, $userId)['push_enabled_web'] === 1;
            echo json_encode(['success' => true, 'active' => $device && !$device['invalidated_at'] && $enabled,
                'revoked' => $device && !empty($device['invalidated_at'])]);
        } else {
            echo json_encode(['success' => true, 'devices' => fetchUserWebPushDevices($pdo, $userId, $endpoint)]);
        }
        exit;
    }
    if ($method === 'POST') {
        $pdo->beginTransaction();
        $lock = $pdo->prepare('SELECT id FROM nutzer WHERE id = ? FOR UPDATE');
        $lock->execute([$userId]);
        if ($renewing) {
            $stmt = $pdo->prepare('SELECT id, user_id, subscription_token FROM web_push_subscriptions
                WHERE subscription_token = ? AND user_id = ? AND invalidated_at IS NULL FOR UPDATE');
            $stmt->execute([(string)($body['previous_subscription_token'] ?? ''), $userId]);
            $previous = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$previous) {
                $pdo->rollBack();
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Dieses Gerät ist nicht mehr für Push aktiviert.']);
                exit;
            }
        }
        $settings = fetchUserNotificationSettings($pdo, $userId);
        $activate = !$renewing && !empty($body['activate']);
        if (!$activate && (int)$settings['push_enabled_web'] !== 1) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Browser-Push ist deaktiviert.']);
            exit;
        }
        $subscription = (array)($body['subscription'] ?? []);
        $agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        $result = $renewing ? renewWebPushSubscription($pdo, $previous, $subscription, $agent)
            : upsertWebPushSubscription($pdo, $userId, $subscription, $agent, $activate);
        if ($activate) {
            saveUserNotificationSettings($pdo, $userId, ['push_enabled_web' => 1]);
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'subscription_token' => $result['subscription_token']]);
        exit;
    }
    if ($method === 'DELETE') {
        $pdo->beginTransaction();
        $lock = $pdo->prepare('SELECT id FROM nutzer WHERE id = ? FOR UPDATE');
        $lock->execute([$userId]);
        if (!empty($body['device_id'])) {
            $pdo->prepare('UPDATE web_push_subscriptions SET invalidated_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?')
                ->execute([(int)$body['device_id'], $userId]);
        } else {
            invalidateWebPushSubscription($pdo, $userId, $body['endpoint'] ?? null, !empty($body['all_devices']));
        }
        $remaining = fetchUserWebPushDevices($pdo, $userId);
        if (!$remaining) {
            $pdo->prepare('UPDATE user_notification_settings SET push_enabled_web = 0, updated_at = NOW() WHERE user_id = ?')->execute([$userId]);
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'remaining_active_devices' => count($remaining)]);
        exit;
    }
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Methode nicht erlaubt.']);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Web push subscription: ' . $error->getMessage());
    http_response_code($error instanceof DomainException ? 409 : 400);
    echo json_encode(['success' => false, 'message' => 'Die Push-Einstellung konnte nicht gespeichert werden.']);
}
