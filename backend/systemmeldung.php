<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/mail.php';
require_once __DIR__ . '/lib/user_notification_settings.php';

function ensureSystemmeldungSchema(PDO $pdo): void
{
    $stmt = $pdo->prepare("SHOW COLUMNS FROM systemmeldungen LIKE 'link_url'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE systemmeldungen ADD COLUMN link_url VARCHAR(255) NULL DEFAULT NULL");
    }

    $stmt = $pdo->prepare("SHOW COLUMNS FROM systemmeldungen LIKE 'link_label'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE systemmeldungen ADD COLUMN link_label VARCHAR(100) NULL DEFAULT NULL");
    }

    $columns = [
        'email_subject' => "VARCHAR(180) NULL DEFAULT NULL",
        'email_heading' => "VARCHAR(180) NULL DEFAULT NULL",
        'email_body' => "MEDIUMTEXT NULL DEFAULT NULL",
        'email_buttons' => "TEXT NULL DEFAULT NULL",
    ];

    foreach ($columns as $column => $definition) {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM systemmeldungen LIKE ?");
        $stmt->execute([$column]);
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE systemmeldungen ADD COLUMN {$column} {$definition}");
        }
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS systemmeldung_mail_queue (
            id INT NOT NULL AUTO_INCREMENT,
            systemmeldung_id INT NOT NULL,
            user_id INT NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(180) NOT NULL,
            heading VARCHAR(180) NOT NULL,
            body MEDIUMTEXT NOT NULL,
            buttons_json TEXT NULL DEFAULT NULL,
            include_settings_hint TINYINT(1) NOT NULL DEFAULT 1,
            status ENUM('pending','sending','sent','failed') NOT NULL DEFAULT 'pending',
            attempts INT NOT NULL DEFAULT 0,
            last_error TEXT NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            sent_at DATETIME NULL DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_system_mail_recipient (systemmeldung_id, user_id, email),
            KEY idx_system_mail_queue_status (status, attempts, created_at),
            KEY idx_system_mail_queue_systemmeldung (systemmeldung_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
}

ensureSystemmeldungSchema($pdo);
ensureUserNotificationSettingsSchema($pdo);

function respondJson(array $data): void
{
    echo json_encode($data);
    exit;
}

function absoluteIceAppUrl(?string $url): string
{
    $url = trim((string)$url);
    if ($url === '') return '';
    if (preg_match('/^https?:\/\//i', $url)) return $url;
    if ($url[0] !== '/') $url = '/' . $url;
    return 'https://ice-app.de' . $url;
}

function normalizeMailButtons(array $buttons, string $linkUrl = '', string $linkLabel = ''): array
{
    $normalized = [];
    foreach ($buttons as $button) {
        if (!is_array($button)) continue;
        $label = trim((string)($button['label'] ?? ''));
        $url = absoluteIceAppUrl((string)($button['url'] ?? ''));
        if ($label !== '' && iceapp_mail_is_safe_http_url($url)) {
            $normalized[] = ['label' => $label, 'url' => $url];
        }
        if (count($normalized) >= 5) break;
    }

    if (empty($normalized) && trim($linkUrl) !== '') {
        $url = absoluteIceAppUrl($linkUrl);
        if (iceapp_mail_is_safe_http_url($url)) {
            $normalized[] = [
                'label' => trim($linkLabel) !== '' ? trim($linkLabel) : 'In der Ice-App ansehen',
                'url' => $url,
            ];
        }
    }

    return $normalized;
}

function fetchSystemMailRecipients(PDO $pdo, string $mode): array
{
    if ($mode === 'all') {
        $stmt = $pdo->query("
            SELECT id, email
            FROM nutzer
            WHERE email IS NOT NULL AND email <> ''
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $stmt = $pdo->query("
        SELECT n.id, n.email
        FROM nutzer n
        JOIN user_notification_settings s ON s.user_id = n.id
        WHERE n.email IS NOT NULL
          AND n.email <> ''
          AND s.notify_news = 1
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function sendSystemMailBatch(array $recipients, string $subject, string $heading, string $body, array $buttons, bool $includeSettingsHint): array
{
    $sent = 0;
    $failed = 0;
    foreach ($recipients as $recipient) {
        $email = trim((string)($recipient['email'] ?? ''));
        if ($email === '') continue;
        $ok = iceapp_send_branded_admin_markdown_mail(
            $email,
            $subject,
            $heading,
            $body,
            $buttons,
            $includeSettingsHint
        );
        if ($ok) $sent++;
        else $failed++;
    }
    return ['sent' => $sent, 'failed' => $failed, 'total' => count($recipients)];
}

function enqueueSystemMailBatch(PDO $pdo, int $systemmeldungId, array $recipients, string $subject, string $heading, string $body, array $buttons, bool $includeSettingsHint): array
{
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO systemmeldung_mail_queue
            (systemmeldung_id, user_id, email, subject, heading, body, buttons_json, include_settings_hint)
        VALUES
            (:systemmeldung_id, :user_id, :email, :subject, :heading, :body, :buttons_json, :include_settings_hint)
    ");

    $queued = 0;
    $skipped = 0;
    $buttonsJson = !empty($buttons) ? json_encode($buttons) : null;

    foreach ($recipients as $recipient) {
        $email = trim((string)($recipient['email'] ?? ''));
        $userId = (int)($recipient['id'] ?? 0);
        if ($email === '' || $userId <= 0) {
            $skipped++;
            continue;
        }

        $stmt->execute([
            'systemmeldung_id' => $systemmeldungId,
            'user_id' => $userId,
            'email' => $email,
            'subject' => $subject,
            'heading' => $heading,
            'body' => $body,
            'buttons_json' => $buttonsJson,
            'include_settings_hint' => $includeSettingsHint ? 1 : 0,
        ]);

        if ($stmt->rowCount() > 0) {
            $queued++;
        } else {
            $skipped++;
        }
    }

    return ['queued' => $queued, 'skipped' => $skipped, 'total' => count($recipients), 'sent' => 0, 'failed' => 0];
}

function processSystemMailQueue(PDO $pdo, int $limit = 20, int $maxAttempts = 3): array
{
    $limit = max(1, min(100, $limit));
    $maxAttempts = max(1, $maxAttempts);

    $stmt = $pdo->prepare("
        SELECT *
        FROM systemmeldung_mail_queue
        WHERE attempts < :max_attempts
          AND (
              status = 'pending'
              OR status = 'failed'
              OR (status = 'sending' AND updated_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE))
          )
        ORDER BY created_at ASC, id ASC
        LIMIT :limit
    ");
    $stmt->bindValue(':max_attempts', $maxAttempts, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $sent = 0;
    $failed = 0;

    $markSending = $pdo->prepare("
        UPDATE systemmeldung_mail_queue
        SET status = 'sending', attempts = attempts + 1, last_error = NULL
        WHERE id = :id
          AND attempts < :max_attempts
          AND (
              status IN ('pending', 'failed')
              OR (status = 'sending' AND updated_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE))
          )
    ");
    $markSent = $pdo->prepare("
        UPDATE systemmeldung_mail_queue
        SET status = 'sent', sent_at = NOW(), last_error = NULL
        WHERE id = :id
    ");
    $markFailed = $pdo->prepare("
        UPDATE systemmeldung_mail_queue
        SET status = 'failed', last_error = :last_error
        WHERE id = :id
    ");

    foreach ($jobs as $job) {
        $markSending->execute([
            'id' => (int)$job['id'],
            'max_attempts' => $maxAttempts,
        ]);
        if ($markSending->rowCount() === 0) {
            continue;
        }

        $buttons = [];
        if (!empty($job['buttons_json'])) {
            $decoded = json_decode((string)$job['buttons_json'], true);
            if (is_array($decoded)) {
                $buttons = $decoded;
            }
        }

        try {
            $ok = iceapp_send_branded_admin_markdown_mail(
                (string)$job['email'],
                (string)$job['subject'],
                (string)$job['heading'],
                (string)$job['body'],
                $buttons,
                !empty($job['include_settings_hint'])
            );
        } catch (Throwable $e) {
            $ok = false;
            $lastError = $e->getMessage();
        }

        if ($ok) {
            $markSent->execute(['id' => (int)$job['id']]);
            $sent++;
        } else {
            $markFailed->execute([
                'id' => (int)$job['id'],
                'last_error' => isset($lastError) ? substr($lastError, 0, 1000) : 'mail() returned false',
            ]);
            $failed++;
        }
        unset($lastError);
    }

    return [
        'processed' => $sent + $failed,
        'sent' => $sent,
        'failed' => $failed,
        'remaining' => countPendingSystemMails($pdo, $maxAttempts),
    ];
}

function countPendingSystemMails(PDO $pdo, int $maxAttempts = 3): int
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM systemmeldung_mail_queue
        WHERE attempts < ?
          AND status IN ('pending', 'failed', 'sending')
    ");
    $stmt->execute([max(1, $maxAttempts)]);
    return (int)$stmt->fetchColumn();
}

function createSystemmeldungNotifications(PDO $pdo, int $systemmeldungId, string $title, array $extraData): int
{
    $nutzer = $pdo->query("SELECT id FROM nutzer")->fetchAll(PDO::FETCH_COLUMN);
    if (empty($nutzer)) {
        return 0;
    }

    $stmt = $pdo->prepare("
        INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, ist_gelesen, zusatzdaten)
        VALUES (:recipient_id, 'systemmeldung', :reference_id, :text, 0, :extra_data)
    ");
    $extraJson = json_encode($extraData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $created = 0;

    foreach ($nutzer as $userId) {
        $stmt->execute([
            'recipient_id' => (int)$userId,
            'reference_id' => $systemmeldungId,
            'text' => $title,
            'extra_data' => $extraJson,
        ]);
        $created += $stmt->rowCount();
    }

    return $created;
}

function fetchSystemmeldungMeta(PDO $pdo): array
{
    $allUsers = (int)$pdo->query("SELECT COUNT(*) FROM nutzer")->fetchColumn();
    $mailAll = (int)$pdo->query("SELECT COUNT(*) FROM nutzer WHERE email IS NOT NULL AND email <> ''")->fetchColumn();
    $mailSubscribers = (int)$pdo->query("
        SELECT COUNT(*)
        FROM nutzer n
        JOIN user_notification_settings s ON s.user_id = n.id
        WHERE n.email IS NOT NULL
          AND n.email <> ''
          AND s.notify_news = 1
    ")->fetchColumn();

    $stmt = $pdo->prepare("SELECT email FROM nutzer WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $adminEmail = (string)($stmt->fetchColumn() ?: '');

    return [
        'all_users' => $allUsers,
        'email_all' => $mailAll,
        'email_subscribers' => $mailSubscribers,
        'admin_email' => $adminEmail,
        'mail_queue_pending' => countPendingSystemMails($pdo),
    ];
}

$action = $_GET['action'] ?? '';

if ($action === 'meta') {
    respondJson(["status" => "success", "meta" => fetchSystemmeldungMeta($pdo)]);
}

if ($action === 'test_email') {
    $input = json_decode(file_get_contents("php://input"), true) ?: [];
    $title = trim((string)($input['title'] ?? 'Neue Systemmeldung'));
    $subject = trim((string)($input['email_subject'] ?? ''));
    $heading = trim((string)($input['email_heading'] ?? ''));
    $body = trim((string)($input['email_body'] ?? ''));
    $buttons = normalizeMailButtons((array)($input['email_buttons'] ?? []), (string)($input['link_url'] ?? ''), (string)($input['link_label'] ?? ''));

    if ($subject === '') $subject = 'Ice-App: ' . $title;
    if ($heading === '') $heading = $title;
    if ($body === '') {
        respondJson(["status" => "error", "message" => "Mailtext ist erforderlich"]);
    }

    $stmt = $pdo->prepare("SELECT email FROM nutzer WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $adminEmail = trim((string)($stmt->fetchColumn() ?: ''));
    if ($adminEmail === '') {
        respondJson(["status" => "error", "message" => "Admin-E-Mail nicht gefunden"]);
    }

    $ok = iceapp_send_branded_admin_markdown_mail($adminEmail, '[Test] ' . $subject, $heading, $body, $buttons, true);
    respondJson([
        "status" => $ok ? "success" : "error",
        "message" => $ok ? "Testmail wurde versendet" : "Testmail konnte nicht versendet werden",
        "recipient" => $adminEmail,
    ]);
}

if ($action === 'create') {
    $input = json_decode(file_get_contents("php://input"), true) ?: [];
    $title = trim((string)($input['title'] ?? ''));
    $message = trim((string)($input['message'] ?? ''));
    $linkUrl = trim((string)($input['link_url'] ?? ''));
    $linkLabel = trim((string)($input['link_label'] ?? ''));
    $emailSubject = trim((string)($input['email_subject'] ?? ''));
    $emailHeading = trim((string)($input['email_heading'] ?? ''));
    $emailBody = trim((string)($input['email_body'] ?? ''));
    $emailButtons = normalizeMailButtons((array)($input['email_buttons'] ?? []), $linkUrl, $linkLabel);
    $mailMode = (string)($input['mail_send_mode'] ?? 'subscribers');
    if (!in_array($mailMode, ['none', 'subscribers', 'all'], true)) $mailMode = 'subscribers';

    if ($title === '' || $message === '') {
        respondJson(["status" => "error", "message" => "Titel und Nachricht sind erforderlich"]);
    }

    if ($mailMode !== 'none' && $emailBody === '') {
        respondJson(["status" => "error", "message" => "Mailtext ist erforderlich"]);
    }

    if ($mailMode === 'all') {
        $confirmed = !empty($input['force_mail_all_confirmed']);
        $confirmText = trim((string)($input['force_mail_all_confirm_text'] ?? ''));
        if (!$confirmed || $confirmText !== 'EMAIL AN ALLE') {
            respondJson(["status" => "error", "message" => "E-Mail an alle muss doppelt bestätigt werden"]);
        }
    }

    if ($emailSubject === '') $emailSubject = 'Ice-App: ' . $title;
    if ($emailHeading === '') $emailHeading = $title;

    $stmt = $pdo->prepare("
        INSERT INTO systemmeldungen (titel, nachricht, link_url, link_label, email_subject, email_heading, email_body, email_buttons)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $title,
        $message,
        $linkUrl !== '' ? $linkUrl : null,
        $linkLabel !== '' ? $linkLabel : null,
        $emailSubject,
        $emailHeading,
        $emailBody !== '' ? $emailBody : null,
        !empty($emailButtons) ? json_encode($emailButtons) : null,
    ]);
    $systemmeldungId = (int)$pdo->lastInsertId();

    $notificationExtra = [
        'message' => $message,
        'link_url' => $linkUrl !== '' ? $linkUrl : null,
        'link_label' => $linkLabel !== '' ? $linkLabel : null
    ];

    $mailResult = ['sent' => 0, 'failed' => 0, 'queued' => 0, 'skipped' => 0, 'total' => 0];
    if ($mailMode !== 'none') {
        $recipients = fetchSystemMailRecipients($pdo, $mailMode);
        $mailResult = enqueueSystemMailBatch($pdo, $systemmeldungId, $recipients, $emailSubject, $emailHeading, $emailBody, $emailButtons, $mailMode === 'subscribers');
    }

    $notificationCount = createSystemmeldungNotifications($pdo, $systemmeldungId, $title, $notificationExtra);

    respondJson([
        "status" => "success",
        "systemmeldung_id" => $systemmeldungId,
        "notification_count" => $notificationCount,
        "mail" => $mailResult,
    ]);
}

if ($action === 'list') {
    $stmt = $pdo->query("SELECT * FROM systemmeldungen ORDER BY erstellt_am DESC");
    $systemmeldungen = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($systemmeldungen as &$meldung) {
        $id = (int)$meldung['id'];

        $stmtCount = $pdo->prepare("
            SELECT COUNT(*) as total, SUM(ist_gelesen) as gelesen
            FROM benachrichtigungen
            WHERE typ = 'systemmeldung' AND referenz_id = ?
        ");
        $stmtCount->execute([$id]);
        $countData = $stmtCount->fetch(PDO::FETCH_ASSOC);

        $meldung['benachrichtigungen_total'] = (int)($countData['total'] ?? 0);
        $meldung['benachrichtigungen_gelesen'] = (int)($countData['gelesen'] ?? 0);
    }

    echo json_encode(["status" => "success", "systemmeldungen" => $systemmeldungen, "meta" => fetchSystemmeldungMeta($pdo)]);
    exit;
}

if ($action === 'delete') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id > 0) {
        $pdo->prepare("DELETE FROM systemmeldungen WHERE id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM benachrichtigungen WHERE referenz_id = ? AND typ = 'systemmeldung'")->execute([$id]);
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Ungültige ID"]);
    }
    exit;
}

if ($action === 'update') {
    $input = json_decode(file_get_contents("php://input"), true) ?: [];
    $id = (int)($input['id'] ?? 0);
    $titel = trim((string)($input['title'] ?? ''));
    $nachricht = trim((string)($input['message'] ?? ''));
    $linkUrl = trim((string)($input['link_url'] ?? ''));
    $linkLabel = trim((string)($input['link_label'] ?? ''));
    $emailSubject = trim((string)($input['email_subject'] ?? ''));
    $emailHeading = trim((string)($input['email_heading'] ?? ''));
    $emailBody = trim((string)($input['email_body'] ?? ''));
    $emailButtons = normalizeMailButtons((array)($input['email_buttons'] ?? []), $linkUrl, $linkLabel);

    if ($id <= 0 || $titel === '' || $nachricht === '') {
        echo json_encode(["status" => "error", "message" => "Ungültige Daten"]);
        exit;
    }

    if ($emailSubject === '') $emailSubject = 'Ice-App: ' . $titel;
    if ($emailHeading === '') $emailHeading = $titel;

    $stmt = $pdo->prepare("
        UPDATE systemmeldungen
        SET titel = ?, nachricht = ?, link_url = ?, link_label = ?, email_subject = ?, email_heading = ?, email_body = ?, email_buttons = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $titel,
        $nachricht,
        $linkUrl !== '' ? $linkUrl : null,
        $linkLabel !== '' ? $linkLabel : null,
        $emailSubject,
        $emailHeading,
        $emailBody !== '' ? $emailBody : null,
        !empty($emailButtons) ? json_encode($emailButtons) : null,
        $id,
    ]);

    $stmt2 = $pdo->prepare("UPDATE benachrichtigungen SET text = ?, zusatzdaten = ? WHERE referenz_id = ? AND typ = 'systemmeldung'");
    $stmt2->execute([
        $titel,
        json_encode([
            "message" => $nachricht,
            "link_url" => $linkUrl !== '' ? $linkUrl : null,
            "link_label" => $linkLabel !== '' ? $linkLabel : null
        ]),
        $id
    ]);

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === 'get' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT id, titel, nachricht, link_url, link_label, email_subject, email_heading, email_body, email_buttons, erstellt_am FROM systemmeldungen WHERE id = ?");
    $stmt->execute([$id]);
    $meldung = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($meldung) {
        echo json_encode(["status" => "success", "systemmeldung" => $meldung]);
    } else {
        echo json_encode(["status" => "error", "message" => "Systemmeldung nicht gefunden"]);
    }
    exit;
}
?>
