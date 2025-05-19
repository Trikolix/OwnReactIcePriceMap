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

    // Passwort-Reset-Link
    $resetLink = "https://ice-app.de/#/resetToken/$token";

    // E-Mail-Versand (vereinfachtes Beispiel)
    $to = $email;
    $subject = "Passwort zurücksetzen";
    $message = "Hallo,\n\nklicke auf den folgenden Link, um dein Passwort zurückzusetzen:\n$resetLink\n\nDieser Link ist eine Stunde gültig.";
    $headers = "From: noreply@ice-app.de";

    mail($to, $subject, $message, $headers);

    echo json_encode(['status' => 'success', 'message' => 'Wenn die E-Mail existiert, wurde ein Link gesendet.']);

} catch (Exception $e) {
    error_log("Fehler beim Passwort-Reset: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Es ist ein Fehler aufgetreten.']);
}
?>