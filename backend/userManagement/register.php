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
$userId = $pdo->lastInsertId();

// 7. Bestätigungs-E-Mail senden
$verifyUrl = "https://ice-app.de/#/verify?token=" . urlencode($token);
$subject = "Bitte bestätige deine Registrierung";
$message = "Hallo $username,\n\nBitte bestätige deine Registrierung, indem du auf folgenden Link klickst:\n\n$verifyUrl\n\nViele Grüße\ndein Eis-Team";
$headers = "From: noreply@ice-app.de";

$mailSent = mail($email, $subject, $message, $headers);

// Info Mail an Admini senden
$subject = "Neue Registrierung";
$message = <<<EOD
Es hat sich ein neuer Nutzer bei ice-app.de registriert.

Benutzername: $username
E-Mail: $email
Link zum Profil: https://ice-app.de/#/user/$userId
EOD;

// Zusätzliche Zeile hinzufügen, falls invited_by gesetzt ist
if ($invited_by != null) {
    $message .= "\nEingeladen von: $invited_by";
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
