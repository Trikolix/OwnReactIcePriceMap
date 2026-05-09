<?php
require_once  __DIR__ . '/../db_connect.php';
require_once  __DIR__ . '/../lib/mail.php';
require_once  __DIR__ . '/../lib/user_notification_settings.php';

function register_fail(string $reason, string $message, int $statusCode = 200, array $context = []): void
{
    if ($statusCode >= 400) {
        http_response_code($statusCode);
    }

    iceapp_log_event('register_failed', array_merge(['reason' => $reason], $context));
    echo json_encode(['status' => 'error', 'message' => $message]);
    exit;
}

set_exception_handler(static function (Throwable $e): void {
    if (http_response_code() < 400) {
        http_response_code(500);
    }

    iceapp_log_event('register_failed', [
        'reason' => 'exception',
        'exception_message' => $e->getMessage(),
        'status_code' => http_response_code(),
    ]);

    echo json_encode([
        'status' => 'error',
        'message' => 'Registrierung konnte gerade nicht abgeschlossen werden.',
    ]);
});

// 1. Rate-Limiting prüfen
$ipAddress = iceapp_client_ip() ?? ($_SERVER['REMOTE_ADDR'] ?? '');
$limit = 5; // max. 5 Versuche innerhalb von 1 Minute

// Prüfen, wie viele Anfragen von dieser IP innerhalb der letzten Minute gemacht wurden
$stmt = $pdo->prepare("SELECT COUNT(*) FROM rate_limit WHERE ip_address = :ip_address AND timestamp > NOW() - INTERVAL 1 MINUTE");
$stmt->execute(['ip_address' => $ipAddress]);
$requestCount = $stmt->fetchColumn();

if ($requestCount >= $limit) {
    register_fail('rate_limited', 'Zu viele Anfragen. Bitte versuche es später erneut.', 429, [
        'request_count' => (int) $requestCount,
    ]);
}

// Logge die Anfrage
$stmt = $pdo->prepare("INSERT INTO rate_limit (ip_address) VALUES (:ip_address)");
$stmt->execute(['ip_address' => $ipAddress]);

// 2. JSON-Daten holen
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    register_fail('invalid_json', 'Ungültige JSON Daten.', 400);
}

$username = trim((string) ($data['username'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$password = (string) ($data['password'] ?? '');
$inviteCode = $data['inviteCode'] ?? null;
$newsletterOptIn = isset($data['newsletterOptIn']) ? (int)$data['newsletterOptIn'] : 0;

$invitedById = null;

if ($inviteCode) {
    $stmt = $pdo->prepare("SELECT id FROM nutzer WHERE invite_code = ?");
    $stmt->execute([$inviteCode]);
    $inviter = $stmt->fetch();
    if ($inviter) {
        $invitedById = $inviter['id'];
    }
}

// 3. Validierung
$usernameRegex = '/^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/';
if (!preg_match($usernameRegex, $username)) {
    register_fail('invalid_username', 'Benutzername: 3-20 Zeichen, nur Buchstaben, Zahlen, _ und -, muss mit Buchstabe beginnen.', 422, [
        'username_length' => strlen($username),
    ]);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    register_fail('invalid_email', 'Ungültige E-Mail-Adresse.', 422, [
        'email_hash' => iceapp_hash_for_log($email),
    ]);
}
if (strlen($password) < 6) {
    register_fail('password_too_short', 'Passwort zu kurz.', 422, [
        'email_hash' => iceapp_hash_for_log($email),
    ]);
}

// 4. Prüfen, ob Nutzer schon existiert
$stmt = $pdo->prepare("SELECT id FROM nutzer WHERE username = :username OR email = :email");
$stmt->execute(['username' => $username, 'email' => $email]);
if ($stmt->fetch()) {
    register_fail('user_exists', 'Benutzername oder E-Mail bereits vergeben.', 409, [
        'username_hash' => iceapp_hash_for_log($username),
        'email_hash' => iceapp_hash_for_log($email),
    ]);
}

// 5. Passwort hashen und Token generieren
$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$token = bin2hex(random_bytes(32));

function generateInviteCode($length = 10) {
    return bin2hex(random_bytes($length / 2)); // z. B. "a8f3bc91ed"
}
$invite_code = generateInviteCode();

// 6. In DB speichern
$stmt = $pdo->prepare("INSERT INTO nutzer (username, email, password_hash, verification_token, invited_by, invite_code) 
                       VALUES (:username, :email, :password_hash, :token, :invited_by, :invite_code)");
$stmt->execute([
    'username' => $username,
    'email' => $email,
    'password_hash' => $passwordHash,
    'token' => $token, 
    'invited_by' => $invitedById,
    'invite_code' => $invite_code
]);
// 7. Notification Settings anlegen
$userId = $pdo->lastInsertId();
ensureUserNotificationSettingsSchema($pdo);
$stmt = $pdo->prepare("INSERT INTO user_notification_settings 
    (user_id, notify_checkin_mention, notify_comment, notify_comment_participated, notify_news, notify_news_push, notify_team_challenge, notify_photo_challenge) 
    VALUES (?, 1, 1, 1, ?, 1, 1, 1)");
$stmt->execute([$userId, $newsletterOptIn]);

// 8. Bestätigungs-E-Mail senden
$verifyUrl = "https://ice-app.de/verify?token=" . urlencode($token);
$mailSent = iceapp_send_branded_action_mail(
    $email,
    'Bestätige deine Registrierung für die Ice-App',
    'Willkommen bei der Ice-App!',
    'Hallo ' . $username . ',',
    [
        'fast geschafft! Bitte bestätige deine Registrierung für die Ice-App.',
        'Danach kannst du dich einloggen und die Ice-App vollständig nutzen.',
    ],
    'Registrierung jetzt bestätigen',
    $verifyUrl
);

// Info Mail an Admin senden
$subject = "Neue Registrierung";
$message = <<<EOD
Es hat sich ein neuer Nutzer bei ice-app.de registriert.

Benutzername: $username
E-Mail: $email
Link zum Profil: https://ice-app.de/user/$userId
EOD;

// Zusätzliche Zeile hinzufügen, falls invited_by gesetzt ist
if ($invitedById != null) {
    $message .= "\nEingeladen von: https://ice-app.de/user/$invitedById";
}

$message .= <<<EOD


Viele Grüße
dein Eis-Team
EOD;

$mailSent2 = iceapp_send_utf8_text_mail("admin@ice-app.de", $subject, $message);

if ($mailSent) {
    iceapp_log_event('register_success', [
        'user_id' => (int) $userId,
        'username_hash' => iceapp_hash_for_log($username),
        'email_hash' => iceapp_hash_for_log($email),
        'verification_mail_sent' => true,
        'admin_mail_sent' => (bool) $mailSent2,
    ]);
    echo json_encode(['status' => 'success', 'message' => 'Registrierung erfolgreich. Schau in deine E-Mails um deine Registierung zu bestätigen.']);
} else {
    iceapp_log_event('register_mail_failed', [
        'user_id' => (int) $userId,
        'username_hash' => iceapp_hash_for_log($username),
        'email_hash' => iceapp_hash_for_log($email),
        'admin_mail_sent' => (bool) $mailSent2,
    ]);
    echo json_encode(['status' => 'error', 'message' => 'Registrierung gespeichert, aber E-Mail konnte nicht gesendet werden.']);
}
