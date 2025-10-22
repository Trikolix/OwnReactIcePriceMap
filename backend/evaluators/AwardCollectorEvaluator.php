<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class AwardCollectorEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 29;

    public function evaluate(int $userId): array {
        global $pdo;

        $achievements = [];

        // Hole alle Level für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("
            SELECT level, threshold, icon_path, title_de, description_de, ep
            FROM award_levels 
            WHERE award_id = :awardId 
            ORDER BY level ASC
        ");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Lade alle bereits vergebenen Awards des Users mit Datum
        $awardsStmt = $pdo->prepare("
            SELECT awarded_at
            FROM user_awards
            WHERE user_id = ?
            ORDER BY awarded_at ASC
        ");
        $awardsStmt->execute([$userId]);
        $awards = $awardsStmt->fetchAll(PDO::FETCH_COLUMN);

        $count = count($awards);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($count >= $threshold) {
                // Datum bestimmen, an dem der Nutzer die Schwelle erreicht hat
                $thresholdDate = $awards[$threshold - 1]; // 0-indexiert

                // Award speichern, falls neu
                if ($this->storeAwardIfNewWithDate(
                    $userId,
                    self::AWARD_ID,
                    $level,
                    $thresholdDate
                )) {
                    $achievements[] = [
                        'award_id' => self::AWARD_ID,
                        'level' => $level,
                        'message' => $levelData['description_de'],
                        'icon' => $levelData['icon_path'],
                        'ep' => (int)$levelData['ep'],
                        'date' => $thresholdDate,
                    ];
                }
            }
        }

        return $achievements;
    }
}
?>