<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class PerfectWeekEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 11;

    public function evaluate(int $userId): array {
        global $pdo;      
        if($this->hasAward($userId, self::AWARD_ID, 1)) {
            return [];
        }

        $achievements = [];
        $count = $this->hasPerfectWeek($userId);

        // Hole alle Level für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($count >= $threshold && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
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

    private function hasPerfectWeek(int $userId): int {
        global $pdo;
        $sql = "SELECT COUNT(DISTINCT DATE(datum)) = 7 AS hat_7_tage_checkins
                FROM checkins
                WHERE nutzer_id = :userId
                  AND DATE(datum) >= CURDATE() - INTERVAL 6 DAY
                  AND DATE(datum) <= CURDATE()";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['userId' => $userId]);

        return (int)$stmt->fetchColumn();
    }
}
?>