<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class EarlyStarterEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 26;

    public function evaluate(int $userId): array {
        global $pdo;        

        $achievements = [];
        // Hole alle Level für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de 
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];
            $fullfillsAward = $this->isQuickstarter($userId, $threshold);

            if ($fullfillsAward && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
                $achievements[] = [
                    'award_id' => self::AWARD_ID,
                    'level' => $level,
                    'message' => $levelData['description_de'],
                    'icon' => $levelData['icon_path'],
                ];
            }
        }
        return $achievements;
    }

    /**
     * Prüft, ob der Nutzer zu den ersten $threshold Nutzern gehört,
     * die einen Check-in gemacht haben (nach frühestem Datum).
     */
    function isQuickstarter(int $nutzerId, $threshold): bool {
        global $pdo;
        $sql = "
            SELECT nutzer_id
            FROM (
                SELECT c.nutzer_id, MIN(c.datum) AS first_checkin
                FROM checkins c
                GROUP BY c.nutzer_id
                ORDER BY first_checkin ASC
                LIMIT ?
            ) AS early_users;
        ";    

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(1, $threshold, PDO::PARAM_INT);
        $stmt->execute();
        $quickstarterIds = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);     

        return in_array($nutzerId, $quickstarterIds);
    }

}
?>