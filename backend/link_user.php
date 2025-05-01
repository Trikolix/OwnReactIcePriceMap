
<?php
require 'firebase_init.php';
require 'db_connection.php'; // Stelle sicher, dass du eine Datenbankverbindung hast

header('Content-Type: application/json');

$token = $_POST['token'] ?? '';

try {
    // Verifiziere das ID-Token
    $verifiedIdToken = $auth->verifyIdToken($token);
    $uid = $verifiedIdToken->claims()->get('sub');
    $email = $verifiedIdToken->claims()->get('email');
    $name = $verifiedIdToken->claims()->get('name');

    // Überprüfe, ob der Benutzer bereits in der Datenbank existiert
    $stmt = $pdo->prepare('SELECT * FROM nutzer WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        // Benutzer existiert bereits, aktualisiere die Daten
        $stmt = $pdo->prepare('UPDATE nutzer SET username = ?, password_hash = ? WHERE email = ?');
        $stmt->execute([$name, 'firebase_auth', $email]);
        echo json_encode(['message' => 'Benutzerdaten aktualisiert']);
    } else {
        // Benutzer existiert nicht, füge neuen Benutzer hinzu
        $stmt = $pdo->prepare('INSERT INTO nutzer (username, email, password_hash) VALUES (?, ?, ?)');
        $stmt->execute([$name, $email, 'firebase_auth']);
        echo json_encode(['message' => 'Neuer Benutzer hinzugefügt']);
    }
} catch (InvalidToken $e) {
    echo json_encode(['error' => 'Das bereitgestellte Token ist ungültig.']);
} catch (Exception $e) {
    echo json_encode(['error' => 'Token konnte nicht verifiziert werden: ' . $e->getMessage()]);
}
?>