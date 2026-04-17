<?php
require_once __DIR__ . '/email_notification.php';
require_once __DIR__ . '/user_notification_settings.php';

function ensurePushInfrastructureSchema(PDO $pdo): void
{
    if (isset($GLOBALS['__push_infrastructure_schema_initialized'])) {
        return;
    }
    $GLOBALS['__push_infrastructure_schema_initialized'] = true;

    ensureUserNotificationSettingsSchema($pdo);

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS web_push_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            endpoint TEXT NOT NULL,
            endpoint_hash CHAR(64) NOT NULL,
            p256dh VARCHAR(255) NOT NULL,
            auth VARCHAR(255) NOT NULL,
            subscription_token VARCHAR(64) NOT NULL,
            user_agent VARCHAR(255) NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_success_at DATETIME NULL DEFAULT NULL,
            last_failure_at DATETIME NULL DEFAULT NULL,
            invalidated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_web_push_endpoint_hash (endpoint_hash),
            UNIQUE KEY uniq_web_push_subscription_token (subscription_token),
            KEY idx_web_push_user (user_id, invalidated_at),
            CONSTRAINT fk_web_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS mobile_push_devices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            platform VARCHAR(32) NOT NULL,
            provider VARCHAR(32) NOT NULL,
            device_token VARCHAR(255) NOT NULL,
            token_hash CHAR(64) NOT NULL,
            app_version VARCHAR(64) NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_success_at DATETIME NULL DEFAULT NULL,
            last_failure_at DATETIME NULL DEFAULT NULL,
            invalidated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_mobile_push_token_hash (token_hash),
            KEY idx_mobile_push_user (user_id, invalidated_at),
            CONSTRAINT fk_mobile_push_devices_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS push_notification_deliveries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            notification_id INT NOT NULL,
            user_id INT NOT NULL,
            channel VARCHAR(16) NOT NULL,
            target_id INT NULL DEFAULT NULL,
            subscription_token VARCHAR(64) NULL DEFAULT NULL,
            payload_json LONGTEXT NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'pending',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            delivered_at DATETIME NULL DEFAULT NULL,
            last_error TEXT NULL DEFAULT NULL,
            KEY idx_push_deliveries_pending (channel, subscription_token, status, created_at),
            KEY idx_push_deliveries_notification (notification_id),
            CONSTRAINT fk_push_deliveries_notification FOREIGN KEY (notification_id) REFERENCES benachrichtigungen(id) ON DELETE CASCADE,
            CONSTRAINT fk_push_deliveries_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $initialized = true;
}

function pushBase64UrlEncode(string $input): string
{
    return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
}

function pushJsonEncode($value): string
{
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function pushNormalizeJsonData($value): array
{
    if (is_array($value)) {
        return $value;
    }

    if (is_string($value) && $value !== '') {
        $decoded = json_decode($value, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }

    return [];
}

function pushEnv(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }

    return str_replace('
', "
", $value);
}

function pushHttpRequest(string $url, string $method = 'POST', array $headers = [], ?string $body = null): array
{
    $headerLines = [];
    foreach ($headers as $name => $value) {
        $headerLines[] = $name . ': ' . $value;
    }

    $context = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => implode("
", $headerLines),
            'content' => $body ?? '',
            'ignore_errors' => true,
            'timeout' => 15,
        ],
    ]);

    $responseBody = @file_get_contents($url, false, $context);
    $rawHeaders = $http_response_header ?? [];
    $statusCode = 0;
    foreach ($rawHeaders as $line) {
        if (preg_match('~^HTTP/\S+\s+(\d{3})~', $line, $matches)) {
            $statusCode = (int)$matches[1];
            break;
        }
    }

    return [
        'status' => $statusCode,
        'body' => $responseBody === false ? '' : $responseBody,
        'headers' => $rawHeaders,
    ];
}

function notificationTypeToSettingField(string $type): string
{
    switch ($type) {
        case 'checkin_mention':
            return 'notify_checkin_mention';
        case 'team_challenge':
            return 'notify_team_challenge';
        case 'systemmeldung':
        case 'engagement':
            return 'notify_news';
        case 'photo_challenge':
            return 'notify_photo_challenge';
        case 'kommentar':
        case 'kommentar_bewertung':
        case 'kommentar_route':
        case 'kommentar_new_user':
        case 'new_user':
        default:
            return 'notify_comment';
    }
}

function fetchUserNotificationSettings(PDO $pdo, int $userId): array
{
    ensureUserNotificationSettingsSchema($pdo);

    $stmt = $pdo->prepare("
        SELECT
            notify_checkin_mention,
            notify_comment,
            notify_comment_participated,
            notify_news,
            notify_team_challenge,
            notify_checkin_mention_push,
            notify_comment_push,
            notify_comment_participated_push,
            notify_news_push,
            notify_team_challenge_push,
            notify_photo_challenge,
            notify_photo_challenge_push,
            push_enabled_web,
            push_enabled_android
        FROM user_notification_settings
        WHERE user_id = :user_id
        LIMIT 1
    ");
    $stmt->execute(['user_id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        return array_map('intval', $row);
    }

    return [
        'notify_checkin_mention' => 1,
        'notify_comment' => 1,
        'notify_comment_participated' => 1,
        'notify_news' => 0,
        'notify_team_challenge' => 1,
        'notify_checkin_mention_push' => 1,
        'notify_comment_push' => 1,
        'notify_comment_participated_push' => 1,
        'notify_news_push' => 0,
        'notify_team_challenge_push' => 1,
        'notify_photo_challenge' => 1,
        'notify_photo_challenge_push' => 1,
        'push_enabled_web' => 0,
        'push_enabled_android' => 0,
    ];
}

function isNotificationAllowedForUser(PDO $pdo, int $userId, string $notificationType, string $channel = 'push'): bool
{
    $settings = fetchUserNotificationSettings($pdo, $userId);
    $field = notificationTypeToSettingField($notificationType);
    if ($channel === 'push') {
        $field .= '_push';
    }
    return (int)($settings[$field] ?? 1) === 1;
}

function createNotification(PDO $pdo, int $recipientId, string $type, int $referenceId, string $text, array $extraData = [], array $context = []): array
{
    ensurePushInfrastructureSchema($pdo);

    $stmt = $pdo->prepare("
        INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, ist_gelesen, zusatzdaten)
        VALUES (:recipient_id, :type, :reference_id, :text, 0, :extra_data)
    ");
    $stmt->execute([
        'recipient_id' => $recipientId,
        'type' => $type,
        'reference_id' => $referenceId,
        'text' => $text,
        'extra_data' => pushJsonEncode($extraData),
    ]);

    $notificationId = (int)$pdo->lastInsertId();
    $notification = fetchNotificationById($pdo, $notificationId);
    if (!$notification) {
        throw new RuntimeException('Benachrichtigung konnte nicht geladen werden.');
    }

    dispatchNotification($pdo, $notification, $context);

    return $notification;
}

function fetchNotificationById(PDO $pdo, int $notificationId): ?array
{
    $stmt = $pdo->prepare("
        SELECT id, empfaenger_id, typ, referenz_id, text, ist_gelesen, erstellt_am, zusatzdaten
        FROM benachrichtigungen
        WHERE id = :id
        LIMIT 1
    ");
    $stmt->execute(['id' => $notificationId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    $row['id'] = (int)$row['id'];
    $row['empfaenger_id'] = (int)$row['empfaenger_id'];
    $row['referenz_id'] = (int)$row['referenz_id'];
    $row['ist_gelesen'] = (int)$row['ist_gelesen'];

    return $row;
}

function buildNotificationDeeplink(array $notification): ?string
{
    $data = pushNormalizeJsonData($notification['zusatzdaten'] ?? null);
    $recipientId = (int)($notification['empfaenger_id'] ?? 0);

    switch ($notification['typ']) {
        case 'kommentar':
            if (!empty($data['checkin_id']) && !empty($data['eisdiele_id'])) {
                return '/map/activeShop/' . (int)$data['eisdiele_id'] . '?tab=checkins&focusCheckin=' . (int)$data['checkin_id'];
            }
            return null;
        case 'kommentar_bewertung':
            if (!empty($data['bewertung_id']) && !empty($data['eisdiele_id'])) {
                return '/map/activeShop/' . (int)$data['eisdiele_id'] . '?tab=reviews&focusReview=' . (int)$data['bewertung_id'];
            }
            return null;
        case 'kommentar_route':
            if (!empty($data['route_id']) && !empty($data['route_autor_id'])) {
                return '/user/' . (int)$data['route_autor_id'] . '?tab=routes&focusRoute=' . (int)$data['route_id'];
            }
            return null;
        case 'kommentar_new_user':
            $targetUserId = (int)($data['user_registration_id'] ?? $notification['referenz_id']);
            return $targetUserId > 0 ? '/user/' . $targetUserId : null;
        case 'new_user':
            return '/user/' . (int)$notification['referenz_id'];
        case 'team_challenge':
            $challengeId = (int)($data['team_challenge_id'] ?? $notification['referenz_id']);
            return $challengeId > 0 ? '/challenge?tab=team&teamChallengeId=' . $challengeId : '/challenge?tab=team';
        case 'systemmeldung':
            return $recipientId > 0
                ? '/user/' . $recipientId . '?systemmeldungId=' . (int)$notification['referenz_id'] . '&notificationId=' . (int)$notification['id']
                : null;
        case 'engagement':
            return '/challenge';
        case 'photo_challenge':
            return '/photo-challenge/' . (int)$notification['referenz_id'];
        case 'checkin_mention':
            return $recipientId > 0
                ? '/user/' . $recipientId . '?mentionNotificationId=' . (int)$notification['id']
                : null;
        default:
            return null;
    }
}

function buildPushPayload(array $notification): array
{
    $data = pushNormalizeJsonData($notification['zusatzdaten'] ?? null);
    $deeplink = buildNotificationDeeplink($notification);

    return [
        'notification_id' => (int)$notification['id'],
        'type' => (string)$notification['typ'],
        'title' => 'Ice App',
        'body' => (string)$notification['text'],
        'deeplink' => $deeplink,
        'reference_id' => (int)$notification['referenz_id'],
        'tag' => 'notification-' . (int)$notification['id'],
        'meta' => $data,
    ];
}

function dispatchNotification(PDO $pdo, array $notificationRecord, array $context = []): void
{
    ensurePushInfrastructureSchema($pdo);

    $recipientId = (int)$notificationRecord['empfaenger_id'];
    if ($recipientId <= 0) {
        return;
    }

    if (!empty($context['email']) && is_array($context['email'])) {
        $email = $context['email'];
        sendNotificationEmailIfAllowed(
            $pdo,
            $recipientId,
            (string)($email['type'] ?? 'comment'),
            (string)($email['senderName'] ?? 'Ice App'),
            (array)($email['extra'] ?? [])
        );
    }

    if (!isNotificationAllowedForUser($pdo, $recipientId, (string)$notificationRecord['typ'], 'push')) {
        return;
    }

    $settings = fetchUserNotificationSettings($pdo, $recipientId);
    $payload = buildPushPayload($notificationRecord);

    if ((int)$settings['push_enabled_web'] === 1) {
        queueAndSendWebPush($pdo, $recipientId, $notificationRecord, $payload);
    }

    if ((int)$settings['push_enabled_android'] === 1) {
        sendAndroidPush($pdo, $recipientId, $payload);
    }
}

function queueAndSendWebPush(PDO $pdo, int $userId, array $notificationRecord, array $payload): void
{
    $subscriptions = fetchActiveWebPushSubscriptions($pdo, $userId);
    foreach ($subscriptions as $subscription) {
        queueWebPushDelivery($pdo, $notificationRecord, $subscription, $payload);
        sendWebPushSignal($pdo, $subscription);
    }
}

function fetchActiveWebPushSubscriptions(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare("
        SELECT id, endpoint, p256dh, auth, subscription_token, user_agent
        FROM web_push_subscriptions
        WHERE user_id = :user_id
          AND invalidated_at IS NULL
    ");
    $stmt->execute(['user_id' => $userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function queueWebPushDelivery(PDO $pdo, array $notificationRecord, array $subscription, array $payload): void
{
    $stmt = $pdo->prepare("
        INSERT INTO push_notification_deliveries (
            notification_id,
            user_id,
            channel,
            target_id,
            subscription_token,
            payload_json,
            status
        ) VALUES (
            :notification_id,
            :user_id,
            'web',
            :target_id,
            :subscription_token,
            :payload_json,
            'pending'
        )
    ");
    $stmt->execute([
        'notification_id' => (int)$notificationRecord['id'],
        'user_id' => (int)$notificationRecord['empfaenger_id'],
        'target_id' => (int)$subscription['id'],
        'subscription_token' => (string)$subscription['subscription_token'],
        'payload_json' => pushJsonEncode($payload),
    ]);
}

function fetchPendingWebPushPayloads(PDO $pdo, string $subscriptionToken, int $limit = 5): array
{
    ensurePushInfrastructureSchema($pdo);

    $stmt = $pdo->prepare("
        SELECT id, payload_json
        FROM push_notification_deliveries
        WHERE channel = 'web'
          AND subscription_token = :subscription_token
          AND status = 'pending'
        ORDER BY created_at ASC
        LIMIT " . max(1, (int)$limit)
    );
    $stmt->execute(['subscription_token' => $subscriptionToken]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    if (!$rows) {
        return [];
    }

    $ids = array_map(static fn(array $row): int => (int)$row['id'], $rows);
    $pdo->prepare("
        UPDATE push_notification_deliveries
        SET status = 'delivered', delivered_at = NOW()
        WHERE id IN (" . implode(',', $ids) . ")
    ")->execute();

    $payloads = [];
    foreach ($rows as $row) {
        $decoded = json_decode((string)$row['payload_json'], true);
        if (is_array($decoded)) {
            $payloads[] = $decoded;
        }
    }

    return $payloads;
}

function generateWebPushSubscriptionToken(): string
{
    return bin2hex(random_bytes(16));
}

function upsertWebPushSubscription(PDO $pdo, int $userId, array $subscription, ?string $userAgent = null): array
{
    ensurePushInfrastructureSchema($pdo);

    $endpoint = trim((string)($subscription['endpoint'] ?? ''));
    $keys = (array)($subscription['keys'] ?? []);
    $p256dh = trim((string)($keys['p256dh'] ?? ''));
    $auth = trim((string)($keys['auth'] ?? ''));

    if ($endpoint === '' || $p256dh === '' || $auth === '') {
        throw new InvalidArgumentException('Ungueltige Web-Push-Subscription.');
    }

    $endpointHash = hash('sha256', $endpoint);
    $stmt = $pdo->prepare("
        SELECT id, subscription_token
        FROM web_push_subscriptions
        WHERE endpoint_hash = :endpoint_hash
        LIMIT 1
    ");
    $stmt->execute(['endpoint_hash' => $endpointHash]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $subscriptionToken = (string)$existing['subscription_token'];
        $update = $pdo->prepare("
            UPDATE web_push_subscriptions
            SET user_id = :user_id,
                endpoint = :endpoint,
                p256dh = :p256dh,
                auth = :auth,
                user_agent = :user_agent,
                invalidated_at = NULL,
                updated_at = NOW()
            WHERE id = :id
        ");
        $update->execute([
            'user_id' => $userId,
            'endpoint' => $endpoint,
            'p256dh' => $p256dh,
            'auth' => $auth,
            'user_agent' => $userAgent,
            'id' => (int)$existing['id'],
        ]);
    } else {
        $subscriptionToken = generateWebPushSubscriptionToken();
        $insert = $pdo->prepare("
            INSERT INTO web_push_subscriptions (
                user_id,
                endpoint,
                endpoint_hash,
                p256dh,
                auth,
                subscription_token,
                user_agent
            ) VALUES (
                :user_id,
                :endpoint,
                :endpoint_hash,
                :p256dh,
                :auth,
                :subscription_token,
                :user_agent
            )
        ");
        $insert->execute([
            'user_id' => $userId,
            'endpoint' => $endpoint,
            'endpoint_hash' => $endpointHash,
            'p256dh' => $p256dh,
            'auth' => $auth,
            'subscription_token' => $subscriptionToken,
            'user_agent' => $userAgent,
        ]);
    }

    return [
        'subscription_token' => $subscriptionToken,
        'endpoint' => $endpoint,
    ];
}

function invalidateWebPushSubscription(PDO $pdo, int $userId, ?string $endpoint = null): void
{
    ensurePushInfrastructureSchema($pdo);

    if ($endpoint) {
        $stmt = $pdo->prepare("
            UPDATE web_push_subscriptions
            SET invalidated_at = NOW(), updated_at = NOW()
            WHERE user_id = :user_id
              AND endpoint_hash = :endpoint_hash
              AND invalidated_at IS NULL
        ");
        $stmt->execute([
            'user_id' => $userId,
            'endpoint_hash' => hash('sha256', $endpoint),
        ]);
        return;
    }

    $stmt = $pdo->prepare("
        UPDATE web_push_subscriptions
        SET invalidated_at = NOW(), updated_at = NOW()
        WHERE user_id = :user_id
          AND invalidated_at IS NULL
    ");
    $stmt->execute(['user_id' => $userId]);
}

function upsertMobilePushDevice(PDO $pdo, int $userId, string $platform, string $provider, string $deviceToken, ?string $appVersion = null): void
{
    ensurePushInfrastructureSchema($pdo);

    $deviceToken = trim($deviceToken);
    if ($deviceToken === '') {
        throw new InvalidArgumentException('Ungueltiges Device-Token.');
    }

    $tokenHash = hash('sha256', $deviceToken);
    $stmt = $pdo->prepare("
        SELECT id
        FROM mobile_push_devices
        WHERE token_hash = :token_hash
        LIMIT 1
    ");
    $stmt->execute(['token_hash' => $tokenHash]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $update = $pdo->prepare("
            UPDATE mobile_push_devices
            SET user_id = :user_id,
                platform = :platform,
                provider = :provider,
                device_token = :device_token,
                app_version = :app_version,
                invalidated_at = NULL,
                updated_at = NOW()
            WHERE id = :id
        ");
        $update->execute([
            'user_id' => $userId,
            'platform' => $platform,
            'provider' => $provider,
            'device_token' => $deviceToken,
            'app_version' => $appVersion,
            'id' => (int)$existing['id'],
        ]);
        return;
    }

    $insert = $pdo->prepare("
        INSERT INTO mobile_push_devices (
            user_id,
            platform,
            provider,
            device_token,
            token_hash,
            app_version
        ) VALUES (
            :user_id,
            :platform,
            :provider,
            :device_token,
            :token_hash,
            :app_version
        )
    ");
    $insert->execute([
        'user_id' => $userId,
        'platform' => $platform,
        'provider' => $provider,
        'device_token' => $deviceToken,
        'token_hash' => $tokenHash,
        'app_version' => $appVersion,
    ]);
}

function invalidateMobilePushDevice(PDO $pdo, int $userId, ?string $deviceToken = null): void
{
    ensurePushInfrastructureSchema($pdo);

    if ($deviceToken) {
        $stmt = $pdo->prepare("
            UPDATE mobile_push_devices
            SET invalidated_at = NOW(), updated_at = NOW()
            WHERE user_id = :user_id
              AND token_hash = :token_hash
              AND invalidated_at IS NULL
        ");
        $stmt->execute([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $deviceToken),
        ]);
        return;
    }

    $stmt = $pdo->prepare("
        UPDATE mobile_push_devices
        SET invalidated_at = NOW(), updated_at = NOW()
        WHERE user_id = :user_id
          AND invalidated_at IS NULL
    ");
    $stmt->execute(['user_id' => $userId]);
}

function sendWebPushSignal(PDO $pdo, array $subscription): void
{
    $publicKey = pushEnv('ICEAPP_WEB_PUSH_VAPID_PUBLIC_KEY');
    $privateKeyPem = pushEnv('ICEAPP_WEB_PUSH_VAPID_PRIVATE_KEY_PEM');
    $subject = pushEnv('ICEAPP_WEB_PUSH_VAPID_SUBJECT', 'mailto:noreply@ice-app.de');

    if (!$publicKey || !$privateKeyPem) {
        return;
    }

    $audience = buildWebPushAudience((string)$subscription['endpoint']);
    if (!$audience) {
        return;
    }

    $jwt = buildVapidJwt($audience, $subject, $publicKey, $privateKeyPem);
    if (!$jwt) {
        return;
    }

    $response = pushHttpRequest(
        (string)$subscription['endpoint'],
        'POST',
        [
            'Authorization' => 'vapid t=' . $jwt . ', k=' . $publicKey,
            'TTL' => '60',
            'Urgency' => 'high',
            'Content-Length' => '0',
        ],
        ''
    );

    $status = (int)$response['status'];
    if ($status >= 200 && $status < 300) {
        $stmt = $pdo->prepare("UPDATE web_push_subscriptions SET last_success_at = NOW() WHERE id = :id");
        $stmt->execute(['id' => (int)$subscription['id']]);
        return;
    }

    $invalidate = in_array($status, [404, 410], true);
    $stmt = $pdo->prepare("
        UPDATE web_push_subscriptions
        SET last_failure_at = NOW(),
            invalidated_at = CASE WHEN :invalidate = 1 THEN NOW() ELSE invalidated_at END
        WHERE id = :id
    ");
    $stmt->execute([
        'invalidate' => $invalidate ? 1 : 0,
        'id' => (int)$subscription['id'],
    ]);
}

function buildWebPushAudience(string $endpoint): ?string
{
    $parts = parse_url($endpoint);
    if (empty($parts['scheme']) || empty($parts['host'])) {
        return null;
    }

    $audience = $parts['scheme'] . '://' . $parts['host'];
    if (!empty($parts['port'])) {
        $audience .= ':' . (int)$parts['port'];
    }

    return $audience;
}

function buildVapidJwt(string $audience, string $subject, string $publicKey, string $privateKeyPem): ?string
{
    $header = ['typ' => 'JWT', 'alg' => 'ES256'];
    $claims = [
        'aud' => $audience,
        'exp' => time() + 12 * 60 * 60,
        'sub' => $subject,
    ];

    $segments = [
        pushBase64UrlEncode(pushJsonEncode($header)),
        pushBase64UrlEncode(pushJsonEncode($claims)),
    ];
    $signingInput = implode('.', $segments);

    $privateKey = openssl_pkey_get_private($privateKeyPem);
    if (!$privateKey) {
        return null;
    }

    $signatureDer = '';
    $success = openssl_sign($signingInput, $signatureDer, $privateKey, OPENSSL_ALGO_SHA256);
    // openssl_free_key($privateKey); // Deprecated in PHP 8.0+
    if (!$success) {
        return null;
    }

    $joseSignature = ecdsaDerToJose($signatureDer, 64);
    if ($joseSignature === null) {
        return null;
    }

    $segments[] = pushBase64UrlEncode($joseSignature);

    return implode('.', $segments);
}

function ecdsaDerToJose(string $der, int $partLength): ?string
{
    $offset = 0;
    if (ord($der[$offset++]) !== 0x30) {
        return null;
    }

    $sequenceLength = ord($der[$offset++]);
    if ($sequenceLength & 0x80) {
        $numOctets = $sequenceLength & 0x7f;
        $sequenceLength = 0;
        for ($i = 0; $i < $numOctets; $i++) {
            $sequenceLength = ($sequenceLength << 8) | ord($der[$offset++]);
        }
    }

    if (ord($der[$offset++]) !== 0x02) {
        return null;
    }
    $rLength = ord($der[$offset++]);
    $r = substr($der, $offset, $rLength);
    $offset += $rLength;

    if (ord($der[$offset++]) !== 0x02) {
        return null;
    }
    $sLength = ord($der[$offset++]);
    $s = substr($der, $offset, $sLength);

    $r = ltrim($r, "\x00");
    $s = ltrim($s, "\x00");
    $r = str_pad($r, $partLength / 2, "\x00", STR_PAD_LEFT);
    $s = str_pad($s, $partLength / 2, "\x00", STR_PAD_LEFT);

    return $r . $s;
}

function sendAndroidPush(PDO $pdo, int $userId, array $payload): void
{
    $projectId = pushEnv('ICEAPP_FCM_PROJECT_ID');
    $clientEmail = pushEnv('ICEAPP_FCM_SERVICE_ACCOUNT_EMAIL');
    $privateKeyPem = pushEnv('ICEAPP_FCM_PRIVATE_KEY_PEM');

    if (!$projectId || !$clientEmail || !$privateKeyPem) {
        return;
    }

    $accessToken = fetchGoogleAccessToken($clientEmail, $privateKeyPem);
    if (!$accessToken) {
        return;
    }

    $stmt = $pdo->prepare("
        SELECT id, device_token
        FROM mobile_push_devices
        WHERE user_id = :user_id
          AND platform = 'android'
          AND provider = 'fcm'
          AND invalidated_at IS NULL
    ");
    $stmt->execute(['user_id' => $userId]);
    $devices = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    foreach ($devices as $device) {
        $body = [
            'message' => [
                'token' => (string)$device['device_token'],
                'notification' => [
                    'title' => (string)($payload['title'] ?? 'Ice App'),
                    'body' => (string)($payload['body'] ?? ''),
                ],
                'data' => flattenPushPayloadForFcm($payload),
                'android' => [
                    'priority' => 'HIGH',
                    'notification' => [
                        'channel_id' => 'ice_app_notifications',
                        'click_action' => 'FCM_PLUGIN_ACTIVITY',
                    ],
                ],
            ],
        ];

        $response = pushHttpRequest(
            'https://fcm.googleapis.com/v1/projects/' . rawurlencode($projectId) . '/messages:send',
            'POST',
            [
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json; charset=utf-8',
            ],
            pushJsonEncode($body)
        );

        $status = (int)$response['status'];
        if ($status >= 200 && $status < 300) {
            $pdo->prepare("UPDATE mobile_push_devices SET last_success_at = NOW() WHERE id = :id")
                ->execute(['id' => (int)$device['id']]);
            continue;
        }

        $responseBody = json_decode((string)$response['body'], true);
        $errorCode = $responseBody['error']['status'] ?? '';
        $invalidate = in_array($errorCode, ['UNREGISTERED', 'INVALID_ARGUMENT'], true);

        $pdo->prepare("
            UPDATE mobile_push_devices
            SET last_failure_at = NOW(),
                invalidated_at = CASE WHEN :invalidate = 1 THEN NOW() ELSE invalidated_at END
            WHERE id = :id
        ")->execute([
            'invalidate' => $invalidate ? 1 : 0,
            'id' => (int)$device['id'],
        ]);
    }
}

function flattenPushPayloadForFcm(array $payload): array
{
    $result = [];
    foreach ($payload as $key => $value) {
        if (is_array($value)) {
            $result[$key] = pushJsonEncode($value);
        } elseif ($value === null) {
            $result[$key] = '';
        } else {
            $result[$key] = (string)$value;
        }
    }

    return $result;
}

function fetchGoogleAccessToken(string $clientEmail, string $privateKeyPem): ?string
{
    $now = time();
    $header = ['alg' => 'RS256', 'typ' => 'JWT'];
    $claims = [
        'iss' => $clientEmail,
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
    ];

    $segments = [
        pushBase64UrlEncode(pushJsonEncode($header)),
        pushBase64UrlEncode(pushJsonEncode($claims)),
    ];
    $signingInput = implode('.', $segments);

    $privateKey = openssl_pkey_get_private($privateKeyPem);
    if (!$privateKey) {
        return null;
    }

    $signature = '';
    $success = openssl_sign($signingInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);
    // openssl_free_key($privateKey); // Deprecated in PHP 8.0+
    if (!$success) {
        return null;
    }

    $jwt = $signingInput . '.' . pushBase64UrlEncode($signature);
    $response = pushHttpRequest(
        'https://oauth2.googleapis.com/token',
        'POST',
        [
            'Content-Type' => 'application/x-www-form-urlencoded',
        ],
        http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ])
    );

    if ((int)$response['status'] < 200 || (int)$response['status'] >= 300) {
        return null;
    }

    $decoded = json_decode((string)$response['body'], true);
    return is_array($decoded) ? ($decoded['access_token'] ?? null) : null;
}
