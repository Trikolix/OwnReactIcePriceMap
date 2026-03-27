<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class PhotoChallengeVoteCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 61;

    public function evaluate(int $userId): array {
        global $pdo;

        $voteDates = $this->getVoteDates($userId);
        $count = count($voteDates);

        if ($count === 0) {
            return [];
        }

        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels
                               WHERE award_id = :awardId
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT MAX(level) FROM user_awards WHERE user_id = ? AND award_id = ?");
        $stmt->execute([$userId, self::AWARD_ID]);
        $currentLevel = (int)($stmt->fetchColumn() ?? 0);

        $newAwards = [];

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($count >= $threshold && $level > $currentLevel) {
                $awardedAt = $voteDates[$threshold - 1];

                $this->storeAwardIfNewWithDate(
                    $userId,
                    self::AWARD_ID,
                    $level,
                    $awardedAt
                );

                $newAwards[] = [
                    'award_id' => self::AWARD_ID,
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

    private function getVoteDates(int $userId): array {
        global $pdo;

        $stmt = $pdo->prepare("SELECT created_at
                               FROM photo_challenge_votes
                               WHERE nutzer_id = ?
                               ORDER BY created_at ASC, id ASC");
        $stmt->execute([$userId]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
?>
