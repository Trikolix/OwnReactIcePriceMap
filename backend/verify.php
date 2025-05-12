<?php
require 'db_connect.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    echo json_encode(['status' => 'error', 'message' => 'Ungültiger Link.']);
}
try {
    $stmt = $pdo->prepare("SELECT id FROM nutzer WHERE verification_token = :token");
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch();

    if ($user) {
        $stmt = $pdo->prepare("UPDATE nutzer SET is_verified = 1, verification_token = NULL WHERE id = :id");
        $stmt->execute(['id' => $user['id']]);
        echo json_encode(['status' => 'success', 'message' => 'Dein Account wurde erfolgreich bestätigt. Du kannst dich jetzt einloggen.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Ungültiger oder abgelaufener Token.']);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}