<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class CommentCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 35;

    public function evaluate(int $userId): array {
        global $pdo;
        $count = $this->getCommentCount($userId);   
         
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
    
    private function getCommentCount(int $userId): int {
        global $pdo;
        $sql = "SELECT COUNT(DISTINCT k.checkin_id) AS anzahl_kommentierter_checkins
                FROM kommentare k
                JOIN checkins c ON k.checkin_id = c.id
                WHERE k.nutzer_id = ?
                  AND c.nutzer_id != k.nutzer_id;";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
    
        return $stmt->fetchColumn();
    }
}
?>