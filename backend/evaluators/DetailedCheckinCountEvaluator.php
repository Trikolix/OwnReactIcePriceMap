<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class DetailedCheckinCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 33;

    public function evaluate(int $userId): array {
        global $pdo;
        $count = $this->getDetailedCheckinCount($userId);

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

    private function getDetailedCheckinCount(int $userId): int {
        global $pdo;

        $sql = "SELECT COUNT(*) 
                FROM checkins 
                WHERE nutzer_id = :userId 
                  AND CHAR_LENGTH(kommentar) > 250";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['userId' => $userId]);

        return (int)$stmt->fetchColumn();
    }

}
?>