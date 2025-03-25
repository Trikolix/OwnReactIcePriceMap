<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
$host = "localhost";
$dbname = "db_439770_2";
$username = "USER439770_wed";
$password = "K8RYTP23y8kWSdt";

// Verbindung zur Datenbank
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Datenbankverbindung fehlgeschlagen"]);
    exit();
}

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
        return ['status' => 'error', 'message' => "Benutzername \" $inputUsername \" nicht gefunden"];
    }
}

$inputUsername = $_POST['username'] ?? 'x';
$inputPassword = $_POST['password'] ?? '';

$result = checkLogin($pdo, $inputUsername, $inputPassword);
echo json_encode($result);
?>