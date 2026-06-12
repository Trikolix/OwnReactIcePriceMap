<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class ReviewCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 70;

    public function evaluate(int $userId): array {
        global $pdo;

        $achievements = [];

        $stmt = $pdo->prepare("
            SELECT level, threshold, icon_path, title_de, description_de, ep
            FROM award_levels
            WHERE award_id = :awardId
            ORDER BY level ASC
        ");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$levels) {
            return $achievements;
        }

        $reviewsStmt = $pdo->prepare("
            SELECT erstellt_am
            FROM bewertungen
            WHERE nutzer_id = ?
            ORDER BY erstellt_am ASC, id ASC
        ");
        $reviewsStmt->execute([$userId]);
        $reviewDates = $reviewsStmt->fetchAll(PDO::FETCH_COLUMN);
        $count = count($reviewDates);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($threshold <= 0 || $count < $threshold) {
                continue;
            }

            $thresholdDate = $reviewDates[$threshold - 1] ?? null;
            if (!$thresholdDate) {
                continue;
            }

            if ($this->storeAwardIfNewWithDate($userId, self::AWARD_ID, $level, $thresholdDate)) {
                $achievements[] = [
                    'award_id' => self::AWARD_ID,
                    'level' => $level,
                    'message' => $levelData['description_de'],
                    'icon' => $levelData['icon_path'],
                    'ep' => (int)$levelData['ep'],
                    'date' => $thresholdDate,
                ];
            }
        }

        return $achievements;
    }
}
?>
