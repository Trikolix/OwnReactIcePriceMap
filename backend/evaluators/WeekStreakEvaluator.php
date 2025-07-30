<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class WeekStreakEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 36;

    public function evaluate(int $userId): array {
        global $pdo;
        $count = $this->getLongestWeekStreak($userId);

        $achievements = [];

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

    function getLongestWeekStreak($nutzerId) {
        global $pdo;
        $sql = "WITH wochen AS (
                  SELECT
                    nutzer_id,
                    YEARWEEK(datum, 3) AS jahrwoche
                  FROM checkins
                  WHERE nutzer_id = :nutzer_id
                  GROUP BY YEARWEEK(datum, 3)
                ),
                gruppen AS (
                  SELECT
                    jahrwoche,
                    ROW_NUMBER() OVER (ORDER BY jahrwoche) AS rn
                  FROM wochen
                ),
                sequenzgruppen AS (
                  SELECT
                    jahrwoche,
                    jahrwoche - rn AS gruppe_id
                  FROM gruppen
                )
                SELECT MAX(anzahl_wochen) AS max_fortlaufende_wochen
                FROM (
                  SELECT COUNT(*) AS anzahl_wochen
                  FROM sequenzgruppen
                  GROUP BY gruppe_id
                ) AS untergruppen;";
    
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['nutzer_id' => $nutzerId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
        return (int)($result['max_fortlaufende_wochen'] ?? 0);
    }
}
?>