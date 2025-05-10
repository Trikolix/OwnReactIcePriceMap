<?php
require 'db_connect.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    die("Ungültiger Link.");
}

$stmt = $pdo->prepare("SELECT id FROM nutzer WHERE verification_token = :token");
$stmt->execute(['token' => $token]);
$user = $stmt->fetch();

if ($user) {
    $stmt = $pdo->prepare("UPDATE nutzer SET is_verified = 1, verification_token = NULL WHERE id = :id");
    $stmt->execute(['id' => $user['id']]);
    echo "Dein Account wurde erfolgreich bestätigt. Du kannst dich jetzt einloggen.";
} else {
    echo "Ungültiger oder abgelaufener Token.";
}
