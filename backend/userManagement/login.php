<?php
require_once  __DIR__ . '/../db_connect.php';

// Funktion zum Überprüfen des Logins
function checkLogin($pdo, $inputUsername, $inputPassword) {
    // SQL-Abfrage vorbereiten
    $stmt = $pdo->prepare("SELECT id, username, password_hash, is_verified FROM nutzer WHERE username = :login OR email = :login");
    $stmt->bindParam(':login', $inputUsername, PDO::PARAM_STR);
    $stmt->execute();

    // Überprüfen, ob ein Benutzer mit diesem Benutzernamen existiert
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch();

        if ($user['is_verified'] !== 1) {
            return ['status' => 'error', 'message' => 'Dein Benutzeraccount ist noch nicht bestätigt.'];
        } else if (password_verify($inputPassword, $user['password_hash'])) {
            return ['status' => 'success', 'userId' => $user['id'], 'username' => $user['username']];
        } else {
            return ['status' => 'error', 'message' => 'Falsches Passwort'];
        }
    } else {
        return ['status' => 'error', 'message' => "Benutzername \"$inputUsername\" nicht gefunden"];
    }
}

$input = json_decode(file_get_contents("php://input"), true);
$inputUsername = $input['username'] ?? 'x';
$inputPassword = $input['password'] ?? '';

$result = checkLogin($pdo, $inputUsername, $inputPassword);
echo json_encode($result);
?>