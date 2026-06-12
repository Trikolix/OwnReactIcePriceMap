<?php
require 'db_connect.php';
require_once __DIR__ . '/lib/notification_dispatcher.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    echo json_encode(['status' => 'error', 'message' => 'Ungültiger Link.']);
}

try {
    $stmt = $pdo->prepare("SELECT id, username, email, invited_by FROM nutzer WHERE verification_token = :token");
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch();

    if ($user) {
        $userId = (int)$user['id'];
        $invitedBy = $user['invited_by'] !== null ? (int)$user['invited_by'] : null;
        $username = (string)$user['username'];
        $email = (string)$user['email'];

        $stmt = $pdo->prepare("UPDATE nutzer SET is_verified = 1, verification_token = NULL WHERE id = :id");
        $stmt->execute(['id' => $userId]);

        require_once __DIR__ . '/lib/user_lifecycle_mails.php';
        iceapp_send_welcome_mail_to_user($pdo, $userId);

        if ($invitedBy !== null) {
            createNotification(
                $pdo,
                $invitedBy,
                'new_user',
                $userId,
                $username . ' hat sich über deinen Einladungslink registriert.'
            );
        }

        echo json_encode(['status' => 'success', 'message' => 'Dein Account wurde erfolgreich bestätigt. Du kannst dich jetzt einloggen.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Ungültiger oder abgelaufener Token.']);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
