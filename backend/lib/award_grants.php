<?php

function ensureAwardShownAtColumn(PDO $pdo): void
{
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;

    $column = $pdo->query("SHOW COLUMNS FROM user_awards LIKE 'shown_at'");
    if ($column && $column->fetch(PDO::FETCH_ASSOC)) {
        return;
    }

    $pdo->exec("ALTER TABLE user_awards ADD COLUMN shown_at DATETIME NULL DEFAULT NULL AFTER awarded_at");
    // Existing awards have already been part of the profile and must not create retroactive popups.
    $pdo->exec("UPDATE user_awards SET shown_at = COALESCE(awarded_at, NOW()) WHERE shown_at IS NULL");
}

function getAwardPopupPayload(PDO $pdo, int $userAwardId, int $userId): ?array
{
    $stmt = $pdo->prepare(
        "SELECT ua.id AS user_award_id,
                ua.award_id,
                ua.level,
                al.title_de,
                al.description_de AS message,
                al.icon_path AS icon,
                al.ep
         FROM user_awards ua
         JOIN award_levels al ON al.award_id = ua.award_id AND al.level = ua.level
         WHERE ua.id = ? AND ua.user_id = ?
         LIMIT 1"
    );
    $stmt->execute([$userAwardId, $userId]);
    $award = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$award) {
        return null;
    }
    return [
        'user_award_id' => (int)$award['user_award_id'],
        'award_id' => (int)$award['award_id'],
        'level' => (int)$award['level'],
        'title' => $award['title_de'],
        'message' => $award['message'],
        'icon' => $award['icon'],
        'ep' => (int)$award['ep'],
    ];
}

function getPendingAwardPopups(PDO $pdo, int $userId): array
{
    ensureAwardShownAtColumn($pdo);
    $stmt = $pdo->prepare(
        "SELECT ua.id
         FROM user_awards ua
         WHERE ua.user_id = ? AND ua.shown_at IS NULL
         ORDER BY ua.awarded_at ASC, ua.id ASC"
    );
    $stmt->execute([$userId]);

    $awards = [];
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $userAwardId) {
        $award = getAwardPopupPayload($pdo, (int)$userAwardId, $userId);
        if ($award) {
            $awards[] = $award;
        }
    }
    return $awards;
}

function markAwardPopupsShown(PDO $pdo, int $userId, array $userAwardIds): int
{
    ensureAwardShownAtColumn($pdo);
    $ids = array_values(array_unique(array_filter(array_map('intval', $userAwardIds), static fn(int $id): bool => $id > 0)));
    if (!$ids) {
        return 0;
    }

    $placeholders = implode(', ', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare(
        "UPDATE user_awards
         SET shown_at = NOW()
         WHERE user_id = ? AND shown_at IS NULL AND id IN ({$placeholders})"
    );
    $stmt->execute(array_merge([$userId], $ids));
    return $stmt->rowCount();
}

function grantAwardToUser(PDO $pdo, int $userId, int $awardId, int $level, bool $showPopup = true): array
{
    ensureAwardShownAtColumn($pdo);
    if ($userId <= 0 || $awardId <= 0 || $level <= 0) {
        throw new InvalidArgumentException('Nutzer, Award und Level müssen gültig sein.');
    }

    $levelStmt = $pdo->prepare(
        "SELECT title_de, description_de, icon_path, ep
         FROM award_levels
         WHERE award_id = ? AND level = ?
         LIMIT 1"
    );
    $levelStmt->execute([$awardId, $level]);
    if (!$levelStmt->fetch(PDO::FETCH_ASSOC)) {
        throw new InvalidArgumentException('Der gewählte Award-Level existiert nicht.');
    }

    $userStmt = $pdo->prepare("SELECT id FROM nutzer WHERE id = ? LIMIT 1");
    $userStmt->execute([$userId]);
    if (!$userStmt->fetchColumn()) {
        throw new InvalidArgumentException('Der gewählte Nutzer existiert nicht.');
    }

    $existingStmt = $pdo->prepare(
        "SELECT id, shown_at FROM user_awards WHERE user_id = ? AND award_id = ? AND level = ? LIMIT 1"
    );
    $existingStmt->execute([$userId, $awardId, $level]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        return [
            'created' => false,
            'shown_at' => $existing['shown_at'],
            'award' => getAwardPopupPayload($pdo, (int)$existing['id'], $userId),
        ];
    }

    $stmt = $pdo->prepare(
        "INSERT INTO user_awards (user_id, award_id, level, shown_at)
         VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$userId, $awardId, $level, $showPopup ? null : date('Y-m-d H:i:s')]);
    $userAwardId = (int)$pdo->lastInsertId();

    return [
        'created' => true,
        'shown_at' => $showPopup ? null : date('Y-m-d H:i:s'),
        'award' => getAwardPopupPayload($pdo, $userAwardId, $userId),
    ];
}

?>
