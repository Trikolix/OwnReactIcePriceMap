<?php
require_once  __DIR__ . '/../db_connect.php';

// 1. Rate-Limiting prüfen
$ipAddress = $_SERVER['REMOTE_ADDR'];
$limit = 5; // max. 5 Versuche innerhalb von 1 Minute

// Prüfen, wie viele Anfragen von dieser IP innerhalb der letzten Minute gemacht wurden
$stmt = $pdo->prepare("SELECT COUNT(*) FROM rate_limit WHERE ip_address = :ip_address AND timestamp > NOW() - INTERVAL 1 MINUTE");
$stmt->execute(['ip_address' => $ipAddress]);
$requestCount = $stmt->fetchColumn();

if ($requestCount >= $limit) {
    echo json_encode(['status' => 'error', 'message' => 'Zu viele Anfragen. Bitte versuche es später erneut.']);
    exit;
}

// Logge die Anfrage
$stmt = $pdo->prepare("INSERT INTO rate_limit (ip_address) VALUES (:ip_address)");
$stmt->execute(['ip_address' => $ipAddress]);

// 2. JSON-Daten holen
$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username']);
$email = trim($data['email']);
$password = $data['password'];
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
    echo json_encode(['status' => 'error', 'message' => 'Benutzername: 3-20 Zeichen, nur Buchstaben, Zahlen, _ und -, muss mit Buchstabe beginnen.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Ungültige E-Mail-Adresse.']);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Passwort zu kurz.']);
    exit;
}

// 4. Prüfen, ob Nutzer schon existiert
$stmt = $pdo->prepare("SELECT id FROM nutzer WHERE username = :username OR email = :email");
$stmt->execute(['username' => $username, 'email' => $email]);
if ($stmt->fetch()) {
    echo json_encode(['status' => 'error', 'message' => 'Benutzername oder E-Mail bereits vergeben.']);
    exit;
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
$stmt = $pdo->prepare("INSERT INTO user_notification_settings (user_id, notify_checkin_mention, notify_comment, notify_comment_participated, notify_news) VALUES (?, 1, 1, 1, ?)");
$stmt->execute([$userId, $newsletterOptIn]);

// 8. Bestätigungs-E-Mail senden (Multipart)
$verifyUrl = "https://ice-app.de/#/verify?token=" . urlencode($token);

// ---- E-Mail Aufbau ----
$boundary = "----=" . md5(uniqid(rand()));

// 1. Betreff (UTF-8 und Base64 kodiert)
$subject_text = "Bestätige deine Registrierung für die Ice-App";
$subject = "=?UTF-8?B?" . base64_encode($subject_text) . "?=";

// 2. Headers für Multipart
$headers_user = "MIME-Version: 1.0\r\n";
$headers_user .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
$headers_user .= "From: Ice-App <noreply@ice-app.de>\r\n";
$headers_user .= "Reply-To: noreply@ice-app.de\r\n";

// 3. Plain-Text Teil
$message_plain = "Hallo " . $username . ",\n\n";
$message_plain .= "fast geschafft! Bitte bestätige deine Registrierung für die Ice-App.\n\n";
$message_plain .= "Falls dein E-Mail-Programm keine HTML-Links unterstützt, kopiere bitte den folgenden Link in deinen Browser:\n";
$message_plain .= $verifyUrl . "\n\n";
$message_plain .= "Wir freuen uns auf dich!\nDein Ice-App Team";

// 4. HTML Teil
$message_html = "<html><body style='font-family:sans-serif;color:#222;'>";
$message_html .= "<h2>Willkommen bei der Ice-App!</h2>";
$message_html .= "<p>Hallo " . htmlspecialchars($username) . ",</p>";
$message_html .= "<p>fast geschafft! Bitte klicke auf den folgenden Link, um deine Registrierung abzuschließen:</p>";
$message_html .= "<p><a href='" . $verifyUrl . "' style='color:#0077b6; padding:10px 15px; background-color:#f0f0f0; border-radius:5px; text-decoration:none;'>Registrierung jetzt bestätigen</a></p>";
$message_html .= "<p>Sollte der Button nicht funktionieren, kopiere bitte diesen Link in deinen Browser:<br>" . $verifyUrl . "</p>";
$message_html .= "<p>Wir freuen uns auf dich!</p>";
$message_html .= "<hr style='margin:24px 0;'><p>Dein Ice-App Team</p>";
$message_html .= "</body></html>";

// 5. Gesamte Nachricht zusammenbauen
$message_user = "--" . $boundary . "\r\n";
$message_user .= "Content-Type: text/plain; charset=UTF-8\r\n";
$message_user .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$message_user .= $message_plain . "\r\n\r\n";
$message_user .= "--" . $boundary . "\r\n";
$message_user .= "Content-Type: text/html; charset=UTF-8\r\n";
$message_user .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$message_user .= $message_html . "\r\n\r\n";
$message_user .= "--" . $boundary . "--";

$mailSent = mail($email, $subject, $message_user, $headers_user);

// Info Mail an Admin senden
$subject = "Neue Registrierung";
$message = <<<EOD
Es hat sich ein neuer Nutzer bei ice-app.de registriert.

Benutzername: $username
E-Mail: $email
Link zum Profil: https://ice-app.de/#/user/$userId
EOD;

// Zusätzliche Zeile hinzufügen, falls invited_by gesetzt ist
if ($invitedById != null) {
    $message .= "\nEingeladen von: https://ice-app.de/#/user/$invitedById";
}

$message .= <<<EOD


Viele Grüße
dein Eis-Team
EOD;

$headers = "From: noreply@ice-app.de";

$mailSent2 = mail("admin@ice-app.de", $subject, $message, $headers);

if ($mailSent) {
    echo json_encode(['status' => 'success', 'message' => 'Registrierung erfolgreich. Schau in deine E-Mails um deine Registierung zu bestätigen.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Registrierung gespeichert, aber E-Mail konnte nicht gesendet werden.']);
}
