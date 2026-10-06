<?php
require_once __DIR__ . '/systemmeldung_service.php';

function systemmeldungRetrySeconds(array $headers, int $attempt): int
{
    $delay = 60 * (2 ** max(0, $attempt - 1));
    foreach ($headers as $header) {
        if (stripos($header, 'Retry-After:') === 0) {
            $value = trim(substr($header, 12));
            $retry = ctype_digit($value) ? (int)$value : max(0, (int)strtotime($value) - time());
            $delay = max($delay, $retry);
        }
    }
    return $delay;
}

function systemmeldungClaim(PDO $pdo, string $table, int $maxAttempts): ?array
{
    if (!in_array($table, ['systemmeldung_mail_queue', 'systemmeldung_push_queue'], true)) throw new InvalidArgumentException('Invalid queue');
    $pdo->prepare("UPDATE {$table} SET status='uncertain',lease_token=NULL,last_error='Worker stopped: delivery outcome unknown'
        WHERE status='sending' AND (lease_until < NOW() OR (lease_until IS NULL AND updated_at < DATE_SUB(NOW(),INTERVAL 15 MINUTE)))")->execute();
    $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE status IN ('pending','retry') AND attempts < ?
        AND (next_attempt_at IS NULL OR next_attempt_at <= NOW()) ORDER BY id LIMIT 10");
    $stmt->execute([$maxAttempts]);
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $id) {
        $token = bin2hex(random_bytes(16));
        $claim = $pdo->prepare("UPDATE {$table} SET status='sending',attempts=attempts+1,lease_token=?,lease_until=DATE_ADD(NOW(),INTERVAL 15 MINUTE),last_error=NULL
            WHERE id=? AND status IN ('pending','retry') AND attempts < ? AND (next_attempt_at IS NULL OR next_attempt_at<=NOW())");
        $claim->execute([$token, $id, $maxAttempts]);
        if ($claim->rowCount() !== 1) continue;
        $row = $pdo->prepare("SELECT * FROM {$table} WHERE id=? AND lease_token=?");
        $row->execute([$id, $token]);
        return $row->fetch(PDO::FETCH_ASSOC);
    }
    return null;
}

function systemmeldungJobAllowed(PDO $pdo, array $job, bool $push): ?array
{
    $stmt = $pdo->prepare("SELECT n.id,n.email,s.notify_news,s.notify_news_push,s.push_enabled_web,s.push_enabled_android
        FROM systemmeldungen m JOIN nutzer n ON n.id=? LEFT JOIN user_notification_settings s ON s.user_id=n.id
        WHERE m.id=? AND m.state='published'");
    $stmt->execute([(int)$job['user_id'], (int)$job['systemmeldung_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) return null;
    if (!$push) {
        if (trim((string)$user['email']) !== $job['email'] || !filter_var($job['email'], FILTER_VALIDATE_EMAIL)) return null;
        return ($job['mail_mode'] === 'all' || (int)$user['notify_news'] === 1) ? $user : null;
    }
    if ((int)$user['notify_news_push'] !== 1 || (int)$user['push_enabled_' . $job['channel']] !== 1) return null;
    $table = $job['channel'] === 'web' ? 'web_push_subscriptions' : 'mobile_push_devices';
    $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id=? AND user_id=? AND invalidated_at IS NULL");
    $stmt->execute([(int)$job['target_id'], (int)$job['user_id']]);
    $target = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$target || ($job['channel'] === 'android' && ($target['platform'] !== 'android' || $target['provider'] !== 'fcm'))) return null;
    if ($job['channel'] === 'web') {
        $delivery = $pdo->prepare('SELECT subscription_token FROM push_notification_deliveries WHERE id=?');
        $delivery->execute([(int)$job['delivery_id']]);
        if ($delivery->fetchColumn() !== $target['subscription_token']) return null;
    }
    return $target;
}

function systemmeldungTransport(PDO $pdo, array $job, bool $push, array $target): array
{
    if (!$push) {
        $ok = iceapp_send_branded_admin_markdown_mail($job['email'], $job['subject'], $job['heading'], $job['body'],
            json_decode($job['buttons_json'] ?? '', true) ?: [], (bool)$job['include_settings_hint'],
            'https://ice-app.de/account/settings', 'Ice-App <noreply@ice-app.de>', 'Ice-App');
        return ['status' => $ok ? 200 : 503, 'body' => $ok ? '' : 'Mail transport rejected message', 'headers' => []];
    }
    $stmt = $pdo->prepare('SELECT payload_json,status FROM push_notification_deliveries WHERE id=?');
    $stmt->execute([(int)$job['delivery_id']]);
    $delivery = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$delivery || $delivery['status'] === 'cancelled') return ['status' => -1, 'body' => 'Delivery cancelled', 'headers' => []];
    $pdo->prepare("UPDATE push_notification_deliveries SET status='pending' WHERE id=? AND status IN ('queued','failed')")->execute([(int)$job['delivery_id']]);
    return $job['channel'] === 'web'
        ? sendWebPushSignal($pdo, $target, (int)$job['delivery_id'])
        : sendAndroidPushDelivery($pdo, $target, json_decode($delivery['payload_json'], true), (int)$job['delivery_id']);
}

function processSystemDeliveryQueue(PDO $pdo, int $limit = 20, int $maxAttempts = 3, ?callable $transport = null): array
{
    $result = ['processed' => 0, 'accepted' => 0, 'retry' => 0, 'failed' => 0, 'uncertain' => 0, 'skipped' => 0];
    $limit = max(1, min(100, $limit));
    $maxAttempts = max(1, min(10, $maxAttempts));
    $transport = $transport ?? 'systemmeldungTransport';
    // Alternate channels so a large mail batch cannot starve push jobs.
    for ($i = 0; $i < $limit; $i++) {
        $push = ($i % 2) === 1;
        $table = $push ? 'systemmeldung_push_queue' : 'systemmeldung_mail_queue';
        $job = systemmeldungClaim($pdo, $table, $maxAttempts);
        if (!$job) {
            $push = !$push;
            $table = $push ? 'systemmeldung_push_queue' : 'systemmeldung_mail_queue';
            $job = systemmeldungClaim($pdo, $table, $maxAttempts);
        }
        if (!$job) break;
        $target = systemmeldungJobAllowed($pdo, $job, $push);
        $status = 'skipped';
        $error = 'Recipient, settings, device or message no longer active';
        $delay = 0;
        if ($target) {
            try {
                $response = $transport($pdo, $job, $push, $target);
                $code = (int)$response['status'];
                $error = substr((string)($response['body'] ?? ''), 0, 1000);
                if ($code >= 200 && $code < 300) { $status = 'accepted'; $error = null; }
                elseif ($code === 0) { $status = 'uncertain'; }
                elseif (($code === 429 || $code >= 500) && (int)$job['attempts'] < $maxAttempts) {
                    $status = 'retry';
                    $delay = systemmeldungRetrySeconds($response['headers'] ?? [], (int)$job['attempts']);
                } else { $status = 'failed'; }
            } catch (Throwable $e) { $status = 'uncertain'; $error = substr($e->getMessage(), 0, 1000); }
        }
        $attempts = (int)$job['attempts'];
        $finish = $pdo->prepare("UPDATE {$table} SET status=?,last_error=?,attempts=?,next_attempt_at=DATE_ADD(NOW(),INTERVAL ? SECOND),
            sent_at=CASE WHEN ?='accepted' THEN NOW() ELSE sent_at END,lease_token=NULL,lease_until=NULL
            WHERE id=? AND status='sending' AND lease_token=?");
        $finish->execute([$status, $error, $attempts, $delay, $status, (int)$job['id'], $job['lease_token']]);
        if ($finish->rowCount() !== 1) continue;
        if ($push && in_array($status, ['skipped','uncertain'], true)) {
            $pdo->prepare("UPDATE push_notification_deliveries SET status=? WHERE id=? AND shown_at IS NULL")
                ->execute([$status === 'skipped' ? 'cancelled' : 'uncertain', (int)$job['delivery_id']]);
        }
        $result[$status]++;
        $result['processed']++;
    }
    return $result;
}
