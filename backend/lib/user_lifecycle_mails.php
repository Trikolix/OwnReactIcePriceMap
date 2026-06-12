<?php

require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/welcome_mail.php';

function iceapp_ensure_user_lifecycle_mail_schema(PDO $pdo): void
{
    $columns = [
        'welcome_mail_sent_at' => 'ALTER TABLE nutzer ADD COLUMN welcome_mail_sent_at TIMESTAMP NULL DEFAULT NULL AFTER last_notification_email_at',
        'verification_reminder_1_sent_at' => 'ALTER TABLE nutzer ADD COLUMN verification_reminder_1_sent_at TIMESTAMP NULL DEFAULT NULL AFTER welcome_mail_sent_at',
        'verification_reminder_2_sent_at' => 'ALTER TABLE nutzer ADD COLUMN verification_reminder_2_sent_at TIMESTAMP NULL DEFAULT NULL AFTER verification_reminder_1_sent_at',
    ];

    foreach ($columns as $column => $alterSql) {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM nutzer LIKE ?");
        $stmt->execute([$column]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->exec($alterSql);
        }
    }
}

function iceapp_mark_welcome_mail_sent(PDO $pdo, int $userId): void
{
    iceapp_ensure_user_lifecycle_mail_schema($pdo);
    $stmt = $pdo->prepare("UPDATE nutzer SET welcome_mail_sent_at = COALESCE(welcome_mail_sent_at, NOW()) WHERE id = ?");
    $stmt->execute([$userId]);
}

function iceapp_send_welcome_mail_to_user(PDO $pdo, int $userId): bool
{
    iceapp_ensure_user_lifecycle_mail_schema($pdo);

    $stmt = $pdo->prepare("
        SELECT id, username, email, invite_code
        FROM nutzer
        WHERE id = ?
          AND is_verified = 1
          AND welcome_mail_sent_at IS NULL
          AND email IS NOT NULL
          AND email <> ''
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        return false;
    }

    $sent = iceapp_send_welcome_mail((string) $user['email'], $user);
    if ($sent) {
        iceapp_mark_welcome_mail_sent($pdo, (int) $user['id']);
    }

    return $sent;
}

function iceapp_send_verification_reminder_mail(array $user): bool
{
    $email = trim((string) ($user['email'] ?? ''));
    $username = trim((string) ($user['username'] ?? ''));
    $token = trim((string) ($user['verification_token'] ?? ''));

    if ($email === '' || $token === '') {
        return false;
    }

    $verifyUrl = "https://ice-app.de/verify?token=" . urlencode($token);

    return iceapp_send_branded_action_mail(
        $email,
        'Erinnerung: Bestätige deine Ice-App Registrierung',
        'Schließe deine Registrierung ab',
        'Hallo ' . ($username !== '' ? $username : 'Eis-Fan') . ',',
        [
            'dein Ice-App Konto ist angelegt, aber deine E-Mail-Adresse wurde noch nicht bestätigt.',
            'Bitte schließe die Bestätigung ab, damit du dich einloggen und alle Funktionen nutzen kannst.',
        ],
        'E-Mail jetzt bestätigen',
        $verifyUrl
    );
}
