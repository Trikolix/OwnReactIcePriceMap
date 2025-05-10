<?php
require_once  __DIR__ . '/AwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

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
        if ($this->hasAward($userId, $awardId, $level)) {
            return false;
        }

        global $pdo;
        $stmt = $pdo->prepare("INSERT INTO user_awards (user_id, award_id, level) 
                               VALUES (:userId, :awardId, :level)");
        return $stmt->execute([
            'userId' => $userId,
            'awardId' => $awardId,
            'level' => $level
        ]);
    }
}
