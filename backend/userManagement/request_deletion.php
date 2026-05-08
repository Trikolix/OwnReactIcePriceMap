<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/user_profile.php';

/**
 * Endpoint to request account deletion via immediate anonymization.
 * This fulfills GDPR "Right to be forgotten" while preserving non-personal community data.
 */

function deleteUserAvatarFile(?string $path): void {
    if (!$path) return;
    $uploadsPrefix = 'uploads/user_avatars/';
    if (strncmp($path, $uploadsPrefix, strlen($uploadsPrefix)) !== 0) return;

    $absolute = __DIR__ . '/../../' . ltrim($path, '/');
    if (file_exists($absolute)) {
        @unlink($absolute);
    }
}

try {
    // 1. Check authentication
    $authData = requireAuth($pdo);
    $userId = (int)$authData['user_id'];

    // 2. Read request data
    $input = json_decode(file_get_contents("php://input"), true);
    $password = $input['password'] ?? '';

    if (empty($password)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Passwort zur Bestätigung erforderlich.']);
        exit;
    }

    // 3. Verify password
    $stmt = $pdo->prepare("SELECT password_hash FROM nutzer WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Das eingegebene Passwort ist nicht korrekt.']);
        exit;
    }

    // Pre-run DDL statements to avoid implicit commits during transaction
    ensureUserProfileTable($pdo);
    if (function_exists('ensureUserNotificationSettingsSchema')) {
        ensureUserNotificationSettingsSchema($pdo);
    }

    // --- ANONYMIZATION START ---
    $pdo->beginTransaction();

    // 4. Delete avatar file and entry
    $avatarPath = getUserAvatarPath($pdo, $userId);
    deleteUserAvatarFile($avatarPath);
    
    $stmt = $pdo->prepare("DELETE FROM user_profile_images WHERE user_id = :id");
    $stmt->execute(['id' => $userId]);

    // 5. Clean up personal data tables
    // Remove favorites
    $stmt = $pdo->prepare("DELETE FROM favoriten WHERE nutzer_id = :id");
    $stmt->execute(['id' => $userId]);

    // Remove notification settings
    $stmt = $pdo->prepare("DELETE FROM user_notification_settings WHERE user_id = :id");
    $stmt->execute(['id' => $userId]);

    // Remove personal notifications
    $stmt = $pdo->prepare("DELETE FROM benachrichtigungen WHERE empfaenger_id = :id");
    $stmt->execute(['id' => $userId]);
    
    // Remove password reset tokens
    $stmt = $pdo->prepare("DELETE FROM passwort_reset_tokens WHERE nutzer_id = :id");
    $stmt->execute(['id' => $userId]);

    // 6. Update user record (The Core of Anonymization)
    $anonUsername = "Ehemaliger Nutzer #" . $userId;
    // We use a random suffix to ensure the email is freed up for re-registration but stays unique in the DB
    $anonEmail = "deleted_" . $userId . "_" . bin2hex(random_bytes(4)) . "@ice-app.local";
    
    $stmt = $pdo->prepare("
        UPDATE nutzer SET 
            username = :username,
            email = :email,
            password_hash = CONCAT('ANONYMIZED_', NOW()),
            is_verified = 0,
            verification_token = NULL,
            invite_code = NULL,
            last_notification_email_at = NULL,
            deletion_requested_at = NOW()
        WHERE id = :id
    ");
    $stmt->execute([
        'username' => $anonUsername,
        'email' => $anonEmail,
        'id' => $userId
    ]);

    $pdo->commit();
    // --- ANONYMIZATION END ---

    // 7. Revoke all tokens for this user
    revokeAllTokensForUser($pdo, $userId);

    // 8. Clear auth cookie
    setcookie(
        AUTH_COOKIE_NAME,
        '',
        [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]
    );

    echo json_encode([
        'status' => 'success',
        'message' => 'Dein Account wurde erfolgreich anonymisiert. Deine persönlichen Daten wurden gelöscht, deine Beiträge (Preise/Kommentare) bleiben anonym erhalten.'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error in request_deletion.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Ein interner Fehler ist aufgetreten.']);
}
