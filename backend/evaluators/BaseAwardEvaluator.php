<?php
require_once  __DIR__ . '/AwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/award_grants.php';

abstract class BaseAwardEvaluator implements AwardEvaluator {
    protected function hasAward(int $userId, int $awardId, int $level): bool {
        global $pdo;

        $stmt = $pdo->prepare("SELECT 1 FROM user_awards 
                               WHERE user_id = :userId AND award_id = :awardId AND level = :level 
                               LIMIT 1");
        $stmt->execute([
            'userId' => $userId,
            'awardId' => $awardId,
            'level' => $level
        ]);

        return (bool)$stmt->fetchColumn();
    }

    protected function storeAwardIfNew(int $userId, int $awardId, int $level): bool {
        global $pdo;
        ensureAwardShownAtColumn($pdo);
        if ($this->hasAward($userId, $awardId, $level)) {
            return false;
        }

        $stmt = $pdo->prepare("INSERT INTO user_awards (user_id, award_id, level, shown_at)
                               VALUES (:userId, :awardId, :level, NOW())");
        return $stmt->execute([
            'userId' => $userId,
            'awardId' => $awardId,
            'level' => $level
        ]);
    }

    protected function storeAwardIfNewWithDate(int $userId, int $awardId, int $level, string $awardedAt): bool {
    global $pdo;
    ensureAwardShownAtColumn($pdo);
    if ($this->hasAward($userId, $awardId, $level)) {
        return false;
    }

    $stmt = $pdo->prepare("INSERT INTO user_awards (user_id, award_id, level, awarded_at, shown_at)
                           VALUES (:userId, :awardId, :level, :awardedAt, NOW())");
    return $stmt->execute([
        'userId' => $userId,
        'awardId' => $awardId,
        'level' => $level,
        'awardedAt' => $awardedAt
    ]);
}
}
