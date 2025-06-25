<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class IceSummerEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 27;

    public function evaluate(int $userId): array {
        global $pdo;
        

        $achievements = [];
        $cur_year = date('Y');

        // Hole das Level für das aktuelle Jahr für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId AND level = :year");
        $stmt->execute(['awardId' => self::AWARD_ID, 'year' => $cur_year]);
        $levelData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($levelData) {
            $count = $this->getCheckinForSummerCount($userId, $cur_year);
            $level = (int)$levelData['level'];
            $treshold = (int)$levelData['threshold'];


            if ($count >= $treshold && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
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

    private function getCheckinForSummerCount(int $userId, int $year): int {
        global $pdo;
        $sql = "SELECT COUNT(*) AS anzahl_checkins
                FROM checkins
                WHERE nutzer_id = :userId
                AND datum BETWEEN :startDate AND :endDate";

        $stmt = $pdo->prepare($sql);

        // Set the parameters
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $startDate = "$year-05-01 00:00:00";
        $endDate = "$year-08-31 23:59:59";
        $stmt->bindParam(':startDate', $startDate);
        $stmt->bindParam(':endDate', $endDate);

        // Execute the query
        $stmt->execute();

        // Return the count as an integer
        return (int)$stmt->fetchColumn();
    }
}
?>