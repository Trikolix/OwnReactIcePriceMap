<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class DifferentIceShopCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 28;

    public function evaluate(int $userId): array {
        global $pdo;

        $achievements = [];

        // Hole alle Level für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $thresholdDates = $this->getThresholdReachedDates($userId, array_map(
            static fn($levelData) => (int)$levelData['threshold'],
            $levels
        ));

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];
            $awardedAt = $thresholdDates[$threshold] ?? null;

            if ($awardedAt !== null && $this->storeAwardIfNewWithDate($userId, self::AWARD_ID, $level, $awardedAt)) {
                $achievements[] = [
                    'award_id' => self::AWARD_ID,
                    'level' => $level,
                    'message' => $levelData['description_de'],
                    'icon' => $levelData['icon_path'],
                    'ep' => (int)$levelData['ep'],
                ];
            }
        }
        return $achievements;
    }

    private function getThresholdReachedDates(int $userId, array $thresholds): array {
        global $pdo;
        $thresholds = array_values(array_unique(array_filter(array_map('intval', $thresholds), static fn($value) => $value > 0)));
        if (empty($thresholds)) {
            return [];
        }

        $sql = "SELECT eisdiele_id, MIN(datum) AS first_checkin_at
                FROM checkins
                WHERE nutzer_id = ? AND context_type = 'ice_shop' AND eisdiele_id IS NOT NULL
                GROUP BY eisdiele_id
                ORDER BY first_checkin_at ASC, eisdiele_id ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);

        $datesByThreshold = [];
        $distinctShopCount = 0;
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $distinctShopCount++;
            if (in_array($distinctShopCount, $thresholds, true) && !isset($datesByThreshold[$distinctShopCount])) {
                $datesByThreshold[$distinctShopCount] = (string)$row['first_checkin_at'];
            }
        }

        return $datesByThreshold;
    }
}
?>
