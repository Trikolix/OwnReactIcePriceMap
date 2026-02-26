<?php
require_once  __DIR__ . '/../db_connect.php';

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

    // -- Finaler E-Mail-Versand als Multipart-Mail --

    $to = $email;
    $resetLink = "https://ice-app.de/#/resetToken/$token";
    $boundary = "----=" . md5(uniqid(rand()));

    // 1. Betreff (UTF-8 und Base64 kodiert)
    $subject_text = "Setze dein Passwort für die Ice-App zurück";
    $subject = "=?UTF-8?B?" . base64_encode($subject_text) . "?=";

    // 2. Headers für Multipart
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
    $headers .= "From: Ice-App <noreply@ice-app.de>\r\n";
    $headers .= "Reply-To: noreply@ice-app.de\r\n";

    // 3. Plain-Text Teil
    $message_plain = "Hallo,\n\n";
    $message_plain .= "klicke auf den folgenden Link, um dein Passwort für die Ice-App zurückzusetzen. Der Link ist eine Stunde lang gültig.\n\n";
    $message_plain .= "Falls dein E-Mail-Programm keine HTML-Links unterstützt, kopiere bitte den folgenden Link in deinen Browser:\n";
    $message_plain .= $resetLink . "\n\n";
    $message_plain .= "Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.\nDein Ice-App Team";

    // 4. HTML Teil
    $message_html = "<html><body style='font-family:sans-serif;color:#222;'>";
    $message_html .= "<h2>Passwort zurücksetzen</h2>";
    $message_html .= "<p>Hallo,</p>";
    $message_html .= "<p>klicke auf den folgenden Link, um dein Passwort für die Ice-App zurückzusetzen. Der Link ist eine Stunde lang gültig.</p>";
    $message_html .= "<p><a href='" . $resetLink . "' style='color:#0077b6; padding:10px 15px; background-color:#f0f0f0; border-radius:5px; text-decoration:none;'>Passwort jetzt zurücksetzen</a></p>";
    $message_html .= "<p>Sollte der Button nicht funktionieren, kopiere bitte diesen Link in deinen Browser:<br>" . $resetLink . "</p>";
    $message_html .= "<p>Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.</p>";
    $message_html .= "<hr style='margin:24px 0;'><p>Dein Ice-App Team</p>";
    $message_html .= "</body></html>";

    // 5. Gesamte Nachricht zusammenbauen
    $message = "--" . $boundary . "\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $message_plain . "\r\n\r\n";
    $message .= "--" . $boundary . "\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $message_html . "\r\n\r\n";
    $message .= "--" . $boundary . "--";

    // 6. Mail senden
    $mailSent = mail($to, $subject, $message, $headers);
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