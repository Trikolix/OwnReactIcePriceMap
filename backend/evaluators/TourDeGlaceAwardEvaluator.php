<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';

class TourDeGlaceAwardEvaluator extends BaseAwardEvaluator {
    const ACTIVE_DAYS_AWARD_ID = 72;
    const SIGHTED_STAGES_AWARD_ID = 73;

    public function evaluate(int $userId): array {
        global $pdo;
        ensureTourDeGlaceTables($pdo);
        if (getTourDeGlacePointScopeValue() !== 0) {
            return [];
        }

        $achievements = [];
        $activeDays = $this->getActiveStageDays($userId);
        $sightedStages = $this->getSightedStageCount($userId);

        $achievements = array_merge(
            $achievements,
            $this->evaluateThresholdAward($userId, self::ACTIVE_DAYS_AWARD_ID, $activeDays),
            $this->evaluateThresholdAward($userId, self::SIGHTED_STAGES_AWARD_ID, $sightedStages)
        );

        return $achievements;
    }

    private function evaluateThresholdAward(int $userId, int $awardId, int $count): array {
        global $pdo;

        $stmt = $pdo->prepare(
            "SELECT level, threshold, icon_path, title_de, description_de, ep
             FROM award_levels
             WHERE award_id = :awardId
             ORDER BY threshold ASC, level ASC"
        );
        $stmt->execute(['awardId' => $awardId]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $achievements = [];
        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];
            if ($count < $threshold || !$this->storeAwardIfNew($userId, $awardId, $level)) {
                continue;
            }

            $achievements[] = [
                'award_id' => $awardId,
                'level' => $level,
                'title' => $levelData['title_de'],
                'message' => $levelData['description_de'],
                'icon' => $levelData['icon_path'],
                'ep' => (int)$levelData['ep'],
            ];
        }

        return $achievements;
    }

    private function getActiveStageDays(int $userId): int {
        global $pdo;

        $stageDates = array_values(array_unique(array_map(
            static fn(array $stage): string => $stage['date'],
            tourDeGlaceConfig()['stages']
        )));
        if (!$stageDates) {
            return 0;
        }

        $placeholders = implode(',', array_fill(0, count($stageDates), '?'));
        $params = array_merge([
            TOUR_DE_GLACE_ID,
            $userId,
            getTourDeGlacePointScopeValue(),
        ], $stageDates);

        $stmt = $pdo->prepare(
            "SELECT COUNT(DISTINCT DATE(created_at))
             FROM tour_de_glace_point_events
             WHERE campaign_id = ?
               AND user_id = ?
               AND is_shadow_test = ?
               AND DATE(created_at) IN ({$placeholders})"
        );
        $stmt->execute($params);

        return (int)$stmt->fetchColumn();
    }

    private function getSightedStageCount(int $userId): int {
        global $pdo;

        $stmt = $pdo->prepare(
            "SELECT COUNT(DISTINCT easter_egg_id)
             FROM tour_de_glace_user_easter_eggs
             WHERE campaign_id = ?
               AND user_id = ?
               AND is_shadow_test = ?"
        );
        $stmt->execute([TOUR_DE_GLACE_ID, $userId, getTourDeGlacePointScopeValue()]);

        return (int)$stmt->fetchColumn();
    }
}
?>
