<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class TeamChallengeCountEvaluator extends BaseAwardEvaluator {
    const TEAM_CHALLENGE_COUNT_AWARD_ID = 60;

    public function evaluate(int $userId): array {
        global $pdo;

        $completionDates = $this->getCompletionDates($userId);
        $count = count($completionDates);

        if ($count === 0) {
            return [];
        }

        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels
                               WHERE award_id = :awardId
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::TEAM_CHALLENGE_COUNT_AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT MAX(level) FROM user_awards WHERE user_id = ? AND award_id = ?");
        $stmt->execute([$userId, self::TEAM_CHALLENGE_COUNT_AWARD_ID]);
        $currentLevel = (int)($stmt->fetchColumn() ?? 0);

        $newAwards = [];

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($count >= $threshold && $level > $currentLevel) {
                $awardedAt = $completionDates[$threshold - 1];

                $this->storeAwardIfNewWithDate(
                    $userId,
                    self::TEAM_CHALLENGE_COUNT_AWARD_ID,
                    $level,
                    $awardedAt
                );

                $newAwards[] = [
                    'award_id' => self::TEAM_CHALLENGE_COUNT_AWARD_ID,
                    'level' => $level,
                    'message' => $levelData['description_de'],
                    'icon' => $levelData['icon_path'],
                    'ep' => (int)$levelData['ep'],
                ];

                $currentLevel = $level;
            }
        }

        return $newAwards;
    }

    private function getCompletionDates(int $userId): array {
        global $pdo;
        $sql = "SELECT completed_at
                FROM team_challenges
                WHERE status = 'completed'
                  AND completed_at IS NOT NULL
                  AND (inviter_user_id = ? OR invitee_user_id = ?)
                ORDER BY completed_at ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId, $userId]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
?>
