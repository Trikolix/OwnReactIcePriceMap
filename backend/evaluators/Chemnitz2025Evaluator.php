<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class Chemnitz2025Evaluator extends BaseAwardEvaluator {
    const AWARD_ID = 20;

    public function evaluate(int $userId): array {
        global $pdo;

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

            if ($level == 1 && $this->hasVisitedChemnitz25($userId) && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
                $achievements[] = [
                    'award_id' => self::AWARD_ID,
                    'level' => $level,
                    'message' => $levelData['description_de'],
                    'icon' => $levelData['icon_path'],
                    'ep' => (int)$levelData['ep'],
                ];
            }
            if ($level == 2 && $this->hasVisitedNovaGoreca($userId) && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
                $achievements[] = [
                    'award_id' => self::AWARD_ID,
                    'level' => $level,
                    'message' => $levelData['description_de'],
                    'icon' => $levelData['icon_path'],
                    'ep' => (int)$levelData['ep'],
                ];
            }
            if ($level == 3 && $this->hasVisitedNovaGoreca($userId) && $this->hasVisitedChemnitz25($userId) && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
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

    private function hasVisitedChemnitz25(int $userId): bool {
        global $pdo;
        $sql = "SELECT
                    COUNT(c.id)
                FROM
                    `checkins` c
                JOIN eisdielen e ON
                    c.eisdiele_id = e.id
                WHERE
                    c.nutzer_id = ? AND e.landkreis_id = 6 AND YEAR(c.datum) = 2025;";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);

        return (bool)$stmt->fetchColumn() > 0;
    }

    private function hasVisitedNovaGoreca(int $userId): bool {
        global $pdo;
        $sql = "SELECT
                    COUNT(c.id)
                FROM
                    `checkins` c
                JOIN eisdielen e ON
                    c.eisdiele_id = e.id
                WHERE
                    c.nutzer_id = ? AND (e.landkreis_id = 32 OR e.landkreis_id = 33) AND YEAR(c.datum) = 2025;";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);

        return (bool)$stmt->fetchColumn() > 0;
    }
}
?>