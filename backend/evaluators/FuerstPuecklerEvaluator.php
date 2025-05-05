<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class FuerstPuecklerEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 10;

    public function evaluate(int $userId): array {
        global $pdo;      
        if($this->hasAward($userId, self::AWARD_ID, 1)) {
            return [];
        }

        $achievements = [];
        $count = $this->hasFuerstPueckler($userId);

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

            if ($count >= $threshold && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
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

    private function hasFuerstPueckler(int $userId): int {
        global $pdo;
        $sql = "SELECT 
                  COUNT(DISTINCT CASE 
                    WHEN LOWER(cs.sortenname) LIKE '%schoko%' THEN 'schoko'
                    WHEN LOWER(cs.sortenname) LIKE '%vanille%' THEN 'vanille'
                    WHEN LOWER(cs.sortenname) LIKE '%erdbeer%' THEN 'erdbeere'
                  END) = 3 AS hat_alle_drei_sorten
                FROM checkins c
                JOIN checkin_sorten cs ON c.id = cs.checkin_id
                WHERE c.nutzer_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);

        return (int)$stmt->fetchColumn();
    }
}
?>