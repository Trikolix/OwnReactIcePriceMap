<?php
require_once  __DIR__ . '/../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$token = $data['token'] ?? '';
$newPassword = $data['password'] ?? '';

if (empty($token) || empty($newPassword)) {
    echo json_encode(['status' => 'error', 'message' => 'Token und Passwort sind erforderlich.']);
    exit;
}

try {
    // Token prüfen
    $stmt = $pdo->prepare("
        SELECT prt.nutzer_id
        FROM passwort_reset_tokens prt
        WHERE prt.token = :token
          AND prt.expires_at > NOW()
          AND prt.used = 0
        LIMIT 1
    ");
    $stmt->execute(['token' => $token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['status' => 'error', 'message' => 'Ungültiger oder abgelaufener Token.']);
        exit;
    }

    $nutzer_id = $row['nutzer_id'];
    
    if (strlen($newPassword) < 6) {
        echo json_encode(['status' => 'error', 'message' => 'Passwort zu kurz.']);
        exit;
    }

    // Neues Passwort setzen
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE nutzer SET password_hash = :hash WHERE id = :id");
    $stmt->execute([
        'hash' => $passwordHash,
        'id' => $nutzer_id
    ]);

    // Token als verwendet markieren
    $stmt = $pdo->prepare("UPDATE passwort_reset_tokens SET used = 1 WHERE token = :token");
    $stmt->execute(['token' => $token]);

    echo json_encode(['status' => 'success', 'message' => 'Passwort wurde erfolgreich zurückgesetzt.']);

} catch (Exception $e) {
    error_log("Fehler beim Zurücksetzen des Passworts: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Ein Fehler ist aufgetreten.']);
}
?>