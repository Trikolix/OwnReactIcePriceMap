<?php
require 'db_connect.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    echo json_encode(['status' => 'error', 'message' => 'Ungültiger Link.']);
}
try {
    $stmt = $pdo->prepare("SELECT id, username, invited_by FROM nutzer WHERE verification_token = :token");
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch();

    if ($user) {
        $userId = $user['id'];
        $invited_by = $user['invited_by'];
        $username = $user['username'];

        $stmt = $pdo->prepare("UPDATE nutzer SET is_verified = 1, verification_token = NULL WHERE id = :id");
        $stmt->execute(['id' => $userId]);

        // falls Nutzer geworben wurde -> Benachrichtigung an Werbenden senden
        if (!is_null($invited_by)) {
            $stmt = $pdo->prepare("
                 INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text)
                 VALUES (?, 'new_user', ?, ?)
             ");
             $text = "$username hat sich über deinen Einladungslink registriert.";
                
             $stmt->execute([$invited_by, $userId, $text]);
        }

        echo json_encode(['status' => 'success', 'message' => 'Dein Account wurde erfolgreich bestätigt. Du kannst dich jetzt einloggen.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Ungültiger oder abgelaufener Token.']);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}