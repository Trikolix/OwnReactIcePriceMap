<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class AllIceTypesEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 9;

    public function evaluate(int $userId): array {
        global $pdo;
        $count = $this->hasAllIceTypes($userId);

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
            $meetsCriteria = false;

            if ($level === 1) {
                $meetsCriteria = $this->hasAllIceTypes($userId);
            } elseif ($level === 2) {
                $meetsCriteria = $this->hasConeAndSoftIceSameDay($userId);
            }

            if ($meetsCriteria && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
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

    private function hasAllIceTypes(int $userId): int {
        global $pdo;
        $sql = "SELECT COUNT(DISTINCT typ) AS type_count
                FROM checkins
                WHERE nutzer_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $typeCount = (int)$stmt->fetchColumn();
        
        return $typeCount >= 3;
    }

    private function hasConeAndSoftIceSameDay(int $userId): bool {
        global $pdo;

        // Finde alle Tage, an denen der Nutzer mindestens Softeis UND Kugel hatte
        $sql = "
            SELECT DATE(datum) as tag
            FROM checkins
            WHERE nutzer_id = :userId AND typ IN ('Kugel', 'Softeis')
            GROUP BY DATE(datum)
            HAVING COUNT(DISTINCT typ) = 2
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['userId' => $userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result !== false;
    }
}
?>