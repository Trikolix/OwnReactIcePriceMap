<?php
require_once  __DIR__ . '/../db_connect.php';
require_once  __DIR__ . '/../lib/mail.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';

if (empty($email)) {
    echo json_encode(['status' => 'error', 'message' => 'E-Mail-Adresse ist erforderlich.']);
    exit;
}

try {
    // Nutzer anhand der E-Mail-Adresse finden
    $stmt = $pdo->prepare("SELECT id FROM nutzer WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    $nutzer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$nutzer) {
        // Um Enumeration zu vermeiden, nicht verraten ob Nutzer existiert
        echo json_encode(['status' => 'success', 'message' => 'Wenn die E-Mail existiert, wurde ein Link gesendet.']);
        exit;
    }

    // Token generieren
    $token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', time() + 3600); // 1 Stunde gültig

    // Token speichern
    $stmt = $pdo->prepare("
        INSERT INTO passwort_reset_tokens (nutzer_id, token, expires_at)
        VALUES (:nutzer_id, :token, :expires_at)
    ");
    $stmt->execute([
        'nutzer_id' => $nutzer['id'],
        'token' => $token,
        'expires_at' => $expires_at
    ]);

    $resetLink = "https://ice-app.de/resetToken/$token";
    $mailSent = iceapp_send_branded_action_mail(
        $email,
        'Setze dein Passwort für die Ice-App zurück',
        'Passwort zurücksetzen',
        'Hallo,',
        [
            'klicke auf den folgenden Link, um dein Passwort für die Ice-App zurückzusetzen. Der Link ist eine Stunde lang gültig.',
            'Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.',
        ],
        'Passwort jetzt zurücksetzen',
        $resetLink
    );
    if (!$mailSent) {
        error_log("FATAL: mail() gab false zurück für Passwort-Reset an $email. Dies sollte nicht passieren.");
    }
    
    // Aus Sicherheitsgründen (Enumeration) immer eine Erfolgsmeldung geben.
    echo json_encode(['status' => 'success', 'message' => 'Wenn die E-Mail existiert, wurde eine Nachricht gesendet.']);

} catch (Exception $e) {
    error_log("Fehler beim Passwort-Reset: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Es ist ein Fehler aufgetreten.']);
}
?>
