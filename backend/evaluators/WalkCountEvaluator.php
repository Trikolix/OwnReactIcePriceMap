<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class WalkCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 24;

    public function evaluate(int $userId): array {
        global $pdo;
        $count = $this->getWalkCount($userId);

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

    private function getWalkCount(int $userId): int {
        global $pdo;
        $sql = "SELECT COUNT(id) AS checkins_count
                FROM checkins
                WHERE nutzer_id = ? AND anreise = 'Zu Fuß'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);

        return (int)$stmt->fetchColumn();
    }
}
?>