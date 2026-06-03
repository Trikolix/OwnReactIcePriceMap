<?php

function ensureUserProfileTable(PDO $pdo): void {
    $sql = "CREATE TABLE IF NOT EXISTS user_profile_images (
        user_id INT PRIMARY KEY,
        avatar_path VARCHAR(255) DEFAULT NULL,
        show_level_badge TINYINT(1) NOT NULL DEFAULT 0,
        avatar_frame_key VARCHAR(40) DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo->exec($sql);

    ensureUserProfileImageColumn($pdo, 'show_level_badge', "TINYINT(1) NOT NULL DEFAULT 0");
    ensureUserProfileImageColumn($pdo, 'avatar_frame_key', "VARCHAR(40) DEFAULT NULL");
}

function ensureUserProfileImageColumn(PDO $pdo, string $columnName, string $definition): void {
    $stmt = $pdo->query("SHOW COLUMNS FROM user_profile_images LIKE " . $pdo->quote($columnName));
    $column = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;
    if (!$column) {
        $pdo->exec("ALTER TABLE user_profile_images ADD COLUMN {$columnName} {$definition}");
    }
}

function getAvatarFrameOptions(): array {
    return [
        ['key' => 'none', 'label' => 'Standard', 'min_level' => 1, 'css' => null],
        ['key' => 'mint', 'label' => 'Mint', 'min_level' => 5, 'css' => '#2bb673'],
        ['key' => 'berry', 'label' => 'Beere', 'min_level' => 10, 'css' => '#d9467a'],
        ['key' => 'sky', 'label' => 'Himmel', 'min_level' => 15, 'css' => '#2f80ed'],
        ['key' => 'sunset', 'label' => 'Sonnenuntergang', 'min_level' => 20, 'css' => 'linear-gradient(135deg, #ffb522, #ff595e)'],
        ['key' => 'royal', 'label' => 'Royal', 'min_level' => 30, 'css' => 'linear-gradient(135deg, #6f2dbd, #2f80ed)'],
        ['key' => 'aurora', 'label' => 'Aurora', 'min_level' => 40, 'css' => 'linear-gradient(135deg, #2bb673, #9bf6ff, #ffc6ff)'],
        ['key' => 'gold', 'label' => 'Gold', 'min_level' => 50, 'css' => 'linear-gradient(135deg, #f6d365, #fda085, #ffd700)'],
    ];
}

function getAvailableAvatarFrames(int $currentLevel): array {
    $level = max(0, $currentLevel);
    return array_map(static function (array $frame) use ($level): array {
        $frame['unlocked'] = $level >= (int)$frame['min_level'];
        return $frame;
    }, getAvatarFrameOptions());
}

function getAvatarFrameByKey(?string $frameKey): ?array {
    $key = $frameKey ?: 'none';
    foreach (getAvatarFrameOptions() as $frame) {
        if ($frame['key'] === $key) {
            return $frame;
        }
    }
    return null;
}

function isAvatarFrameUnlocked(?string $frameKey, int $currentLevel): bool {
    $frame = getAvatarFrameByKey($frameKey);
    if (!$frame) {
        return false;
    }
    return max(0, $currentLevel) >= (int)$frame['min_level'];
}

function getUserProfileImageSettings(PDO $pdo, int $userId): array {
    ensureUserProfileTable($pdo);
    $stmt = $pdo->prepare("SELECT avatar_path, show_level_badge, avatar_frame_key FROM user_profile_images WHERE user_id = ?");
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return [
        'avatar_path' => $row['avatar_path'] ?? null,
        'show_level_badge' => (int)($row['show_level_badge'] ?? 0),
        'avatar_frame_key' => $row['avatar_frame_key'] ?? null,
    ];
}

function setUserAvatarDecoration(PDO $pdo, int $userId, int $showLevelBadge, ?string $frameKey): void {
    ensureUserProfileTable($pdo);
    $normalizedFrameKey = ($frameKey === null || $frameKey === '' || $frameKey === 'none') ? null : $frameKey;
    $stmt = $pdo->prepare("
        INSERT INTO user_profile_images (user_id, show_level_badge, avatar_frame_key)
        VALUES (:user_id, :show_level_badge, :avatar_frame_key)
        ON DUPLICATE KEY UPDATE
            show_level_badge = VALUES(show_level_badge),
            avatar_frame_key = VALUES(avatar_frame_key)
    ");
    $stmt->execute([
        ':user_id' => $userId,
        ':show_level_badge' => $showLevelBadge ? 1 : 0,
        ':avatar_frame_key' => $normalizedFrameKey,
    ]);
}

function ensureUserProfileColumns(PDO $pdo): void {
    $stmt = $pdo->query("SHOW COLUMNS FROM nutzer LIKE 'instagram_account'");
    $column = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;
    if (!$column) {
        $pdo->exec("ALTER TABLE nutzer ADD COLUMN instagram_account VARCHAR(255) DEFAULT NULL");
    }
    
    $stmt = $pdo->query("SHOW COLUMNS FROM nutzer LIKE 'strava_account'");
    $column = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;
    if (!$column) {
        $pdo->exec("ALTER TABLE nutzer ADD COLUMN strava_account VARCHAR(255) DEFAULT NULL");
    }
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
