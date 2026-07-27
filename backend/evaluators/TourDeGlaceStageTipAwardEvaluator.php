<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';

class TourDeGlaceStageTipAwardEvaluator extends BaseAwardEvaluator {
    // TODO: Replace with the real award_id after creating award_levels for stage-tip hits.
    const AWARD_ID = 74;

    public function evaluate(int $userId): array {
        global $pdo;
        ensureTourDeGlaceTables($pdo);

        if (self::AWARD_ID <= 0) {
            return [];
        }

        $correctTips = getTourDeGlaceCorrectStageTipCount($pdo, $userId);
        $stmt = $pdo->prepare(
            "SELECT level, threshold, icon_path, title_de, description_de, ep
             FROM award_levels
             WHERE award_id = :awardId
             ORDER BY threshold ASC, level ASC"
        );
        $stmt->execute(['awardId' => self::AWARD_ID]);

        $achievements = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];
            if ($correctTips < $threshold || !$this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
                continue;
            }

            $achievements[] = [
                'award_id' => self::AWARD_ID,
                'level' => $level,
                'title' => $levelData['title_de'],
                'message' => $levelData['description_de'],
                'icon' => $levelData['icon_path'],
                'ep' => (int)$levelData['ep'],
            ];
        }

        return $achievements;
    }
}
?>
