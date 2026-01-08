<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class SecretWorkshopAwardEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 54; // Placeholder for the new award

    public function evaluate(int $userId, int $level = 1): array {
        global $pdo;

        $achievements = [];

        // Fetch the specified level data for this award from the database
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId AND level = :level");
        $stmt->execute(['awardId' => self::AWARD_ID, 'level' => $level]);
        $levelData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($levelData && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
            $achievements[] = [
                'award_id' => self::AWARD_ID,
                'level' => $level,
                'message' => $levelData['description_de'],
                'icon' => $levelData['icon_path'],
                'ep' => (int)$levelData['ep'],
            ];
        }

        return $achievements;
    }
}
?>
