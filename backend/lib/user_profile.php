<?php

function ensureUserProfileTable(PDO $pdo): void {
    $sql = "CREATE TABLE IF NOT EXISTS user_profile_images (
        user_id INT PRIMARY KEY,
        avatar_path VARCHAR(255) DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo->exec($sql);
}

function getUserAvatarPath(PDO $pdo, int $userId): ?string {
    ensureUserProfileTable($pdo);
    $stmt = $pdo->prepare("SELECT avatar_path FROM user_profile_images WHERE user_id = ?");
    $stmt->execute([$userId]);
    $path = $stmt->fetchColumn();
    return $path !== false ? $path : null;
}

function setUserAvatarPath(PDO $pdo, int $userId, ?string $path): void {
    ensureUserProfileTable($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO user_profile_images (user_id, avatar_path)
        VALUES (:user_id, :avatar_path)
        ON DUPLICATE KEY UPDATE avatar_path = VALUES(avatar_path)
    ");
    $stmt->execute([
        ':user_id' => $userId,
        ':avatar_path' => $path
    ]);
}
