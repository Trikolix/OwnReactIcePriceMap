<?php
require_once 'firebase.php';
require_once '../db_connect.php'; // deine DB-Verbindung

$data = json_decode(file_get_contents('php://input'), true);
$idToken = $data['idToken'];

try {
    $verifiedIdToken = $auth->verifyIdToken($idToken);
    $uid = $verifiedIdToken->claims()->get('sub');
    $email = $verifiedIdToken->getClaim('email');

    // Gibt es den User bereits in der SQL-Datenbank?
    $stmt = $pdo->prepare("SELECT id FROM nutzer WHERE email = ?");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch();

    if (!$existingUser) {
        // Neuen User anlegen
        $stmt = $pdo->prepare("INSERT INTO nutzer (username, email, password_hash) VALUES (?, ?, ?)");
        $username = explode('@', $email)[0]; // Default-Username
        $stmt->execute([$username, $email, 'firebase']); // Passwort irrelevant
    }

    echo json_encode(["status" => "success"]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
