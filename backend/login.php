<?php
require_once 'db_connect.php';

// Funktion zum Überprüfen des Logins
function checkLogin($pdo, $inputUsername, $inputPassword) {
    // SQL-Abfrage vorbereiten
    $stmt = $pdo->prepare("SELECT id, password_hash FROM nutzer WHERE username = :username");
    $stmt->bindParam(':username', $inputUsername, PDO::PARAM_STR);
    $stmt->execute();

    // Überprüfen, ob ein Benutzer mit diesem Benutzernamen existiert
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch();

        if (password_verify($inputPassword, $user['password_hash'])) {
            return ['status' => 'success', 'userId' => $user['id']];
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