<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class IcePortionsPerWeekEvaluator. extends BaseAwardEvaluator {
    const AWARD_ID = 31;

    public function evaluate(int $userId): array {
        global $pdo;
        $count = $this->getIcePortionsPerWeekCount($userId);

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

    private function getIcePortionsPerWeekCount(int $userId): int {
        global $pdo;
        $sql = "SELECT
                  checkin_portionen.nutzer_id,
                  YEAR(checkin_portionen.datum) AS jahr,
                  WEEK(checkin_portionen.datum, 3) AS kalenderwoche,
                  SUM(checkin_portionen.portionen_pro_checkin) AS portionen
                FROM (
                  SELECT
                    c.id,
                    c.nutzer_id,
                    c.datum,
                    IF(COUNT(cs.id) = 0, 1, COUNT(cs.id)) AS portionen_pro_checkin
                  FROM
                    checkins c
                  LEFT JOIN
                    checkin_sorten cs ON cs.checkin_id = c.id
                  WHERE
                    c.nutzer_id = ?
                  GROUP BY
                    c.id
                ) AS checkin_portionen
                GROUP BY
                  checkin_portionen.nutzer_id,
                  jahr,
                  kalenderwoche
                ORDER BY
                  checkin_portionen.nutzer_id,
                  p
                  jahr,
                  kalenderwoche;
                ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);

        return (int)$stmt->fetchColumn();
    }
}
?>