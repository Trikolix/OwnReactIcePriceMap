<?php
require 'firebase-init.php';

$body = json_decode(file_get_contents('php://input'), true);
$idToken = $body['idToken'] ?? '';

try {
    $verifiedIdToken = $auth->verifyIdToken($idToken);
    $firebaseUser = $auth->getUser($verifiedIdToken->claims()->get('sub'));

    $email = $firebaseUser->email;
    $username = explode('@', $email)[0];

    // DB-Verbindung
    $pdo = new PDO('mysql:host=localhost;dbname=deine_db', 'db_user', 'db_pass');

    $stmt = $pdo->prepare("SELECT * FROM nutzer WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->rowCount() === 0) {
        $insert = $pdo->prepare("INSERT INTO nutzer (username, email, password_hash) VALUES (?, ?, '')");
        $insert->execute([$username, $email]);
    }

    echo json_encode(['status' => 'user synced']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => 'User-Sync fehlgeschlagen: ' . $e->getMessage()]);
}
?>