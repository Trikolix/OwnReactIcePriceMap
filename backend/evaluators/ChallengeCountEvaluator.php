<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class PriceSubmitCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 7;

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

        // Lade alle gemeldeten Preise mit Datum
        $preiseStmt = $pdo->prepare("
            SELECT gemeldet_am
            FROM preise
            WHERE gemeldet_von = ?
            ORDER BY gemeldet_am ASC
        ");
        $preiseStmt->execute([$userId]);
        $preise = $preiseStmt->fetchAll(PDO::FETCH_COLUMN);

        $count = count($preise);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            // Prüfen, ob der Nutzer die Schwelle erreicht hat
            if ($count >= $threshold) {
                // Datum bestimmen, an dem die Schwelle erreicht wurde
                $thresholdDate = $preise[$threshold - 1]; // -1 weil 0-indexiert

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