<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../lib/mail.php';
require_once __DIR__ . '/../lib/user_notification_settings.php';

function event2026_bulk_mail_safe_email(?string $email): ?string
{
    $normalized = trim((string) $email);
    if ($normalized === '' || !filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
        return null;
    }
    return $normalized;
}

function event2026_bulk_mail_buttons(array $rawButtons): array
{
    $buttons = [];
    foreach ($rawButtons as $rawButton) {
        if (!is_array($rawButton)) {
            continue;
        }
        $label = trim((string) ($rawButton['label'] ?? ''));
        $url = trim((string) ($rawButton['url'] ?? ''));
        if ($label === '' && $url === '') {
            continue;
        }
        if ($label === '' || $url === '') {
            throw new RuntimeException('Button-Label und URL müssen gemeinsam ausgefüllt sein.');
        }
        if (!filter_var($url, FILTER_VALIDATE_URL) || !in_array(parse_url($url, PHP_URL_SCHEME), ['http', 'https'], true)) {
            throw new RuntimeException('Bitte gib für Buttons gültige http(s)-URLs an.');
        }
        $buttons[] = [
            'label' => mb_substr($label, 0, 80),
            'url' => $url,
        ];
        if (count($buttons) >= 5) {
            break;
        }
    }
    return $buttons;
}

function event2026_bulk_mail_fetch_recipients(PDO $pdo, int $eventId, string $mode): array
{
    $newsletterFilter = $mode === 'newsletter';
    $sql = "SELECT
            s.full_name,
            s.email,
            s.user_id,
            COALESCE(settings.notify_news, 0) AS notify_news
        FROM event2026_participant_slots s
        LEFT JOIN user_notification_settings settings ON settings.user_id = s.user_id
        WHERE s.event_id = :event_id";
    if ($newsletterFilter) {
        $sql .= " AND s.user_id IS NOT NULL AND COALESCE(settings.notify_news, 0) = 1";
    }
    $sql .= " ORDER BY s.full_name ASC, s.id ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':event_id' => $eventId]);

    $recipientsByEmail = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $email = event2026_bulk_mail_safe_email($row['email'] ?? null);
        if (!$email) {
            continue;
        }
        $key = mb_strtolower($email);
        if (!isset($recipientsByEmail[$key])) {
            $recipientsByEmail[$key] = [
                'email' => $email,
                'name' => trim((string) ($row['full_name'] ?? '')),
            ];
        }
    }

    return array_values($recipientsByEmail);
}

try {
    event2026_ensure_schema($pdo);
    ensureUserNotificationSettingsSchema($pdo);
    $admin = event2026_require_admin($pdo);
    $event = event2026_current_event($pdo, true);
    $eventId = (int) $event['id'];

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        $newsletterRecipients = event2026_bulk_mail_fetch_recipients($pdo, $eventId, 'newsletter');
        $allRecipients = event2026_bulk_mail_fetch_recipients($pdo, $eventId, 'all');
        echo json_encode([
            'status' => 'success',
            'counts' => [
                'newsletter' => count($newsletterRecipients),
                'all' => count($allRecipients),
            ],
            'admin_email' => event2026_fetch_user_email($pdo, (int) $admin['user_id']),
        ]);
        exit;
    }

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        throw new RuntimeException('Ungültige Anfrage.');
    }

    $sendMode = (string) ($data['send_mode'] ?? 'test');
    if (!in_array($sendMode, ['test', 'newsletter', 'all'], true)) {
        throw new RuntimeException('Ungültiger Versandmodus.');
    }

    $subject = trim((string) ($data['subject'] ?? ''));
    $heading = trim((string) ($data['heading'] ?? ''));
    $body = trim((string) ($data['body'] ?? ''));
    if ($subject === '' || $heading === '' || $body === '') {
        throw new RuntimeException('Betreff, Überschrift und Inhalt sind Pflichtfelder.');
    }
    if (mb_strlen($subject) > 160 || mb_strlen($heading) > 160) {
        throw new RuntimeException('Betreff und Überschrift dürfen maximal 160 Zeichen lang sein.');
    }

    if (empty(iceapp_parse_admin_mail_markdown_blocks($body))) {
        throw new RuntimeException('Bitte gib mindestens einen Mail-Absatz ein.');
    }

    $buttons = event2026_bulk_mail_buttons(is_array($data['buttons'] ?? null) ? $data['buttons'] : []);
    $settingsUrl = 'https://ice-app.de/account/settings';
    $includeSettingsHint = $sendMode === 'newsletter';

    if ($sendMode === 'test') {
        $testEmail = event2026_bulk_mail_safe_email($data['test_email'] ?? null);
        if (!$testEmail) {
            throw new RuntimeException('Bitte gib eine gültige Test-E-Mail-Adresse an.');
        }
        $recipients = [[
            'email' => $testEmail,
            'name' => 'Testempfänger',
        ]];
        $includeSettingsHint = !empty($data['include_settings_hint_for_test']);
    } else {
        $recipients = event2026_bulk_mail_fetch_recipients($pdo, $eventId, $sendMode === 'newsletter' ? 'newsletter' : 'all');
    }

    if (empty($recipients)) {
        throw new RuntimeException('Keine Empfänger gefunden.');
    }

    $sent = 0;
    $failed = [];
    foreach ($recipients as $recipient) {
        $ok = iceapp_send_branded_admin_markdown_mail(
            $recipient['email'],
            $subject,
            $heading,
            $body,
            $buttons,
            $includeSettingsHint,
            $settingsUrl
        );
        if ($ok) {
            $sent++;
        } else {
            $failed[] = $recipient['email'];
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => $sendMode === 'test' ? 'Test-Mail wurde versendet.' : 'Mail-Versand abgeschlossen.',
        'recipient_count' => count($recipients),
        'sent_count' => $sent,
        'failed_count' => count($failed),
        'failed_recipients' => array_slice($failed, 0, 10),
    ]);
} catch (Throwable $e) {
    if (http_response_code() < 400) {
        http_response_code(400);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
