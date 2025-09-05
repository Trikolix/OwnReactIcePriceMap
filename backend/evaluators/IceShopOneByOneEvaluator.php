<?php
class IceShopOneByOneEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 44;

    public function evaluate(int $userId): array {
        global $pdo;
        $achievements = [];

        // Hole alle Level für diesen Award aus der DB
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels
                               WHERE award_id = :awardId
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Hole Besuchsdaten pro Eisdiele
        $visitCounts = $this->getIceShopVisitCounts($userId);

        foreach ($levels as $levelData) {
            $level     = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            // Zähle, wie viele Eisdielen mindestens `level`-mal besucht wurden
            $qualifyingShops = 0;
            foreach ($visitCounts as $cnt) {
                if ($cnt >= $threshold) {
                    $qualifyingShops++;
                }
            }

            // Bedingung: mindestens $level Eisdielen jeweils $level-mal besucht
            if ($qualifyingShops >= $threshold) {
                if ($this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
                    $achievements[] = [
                        'award_id' => self::AWARD_ID,
                        'level'    => $level,
                        'message'  => $levelData['description_de'],
                        'icon'     => $levelData['icon_path'],
                        'ep'       => (int)$levelData['ep'],
                    ];
                }
            }
        }

        return $achievements;
    }

    /**
     * Liefert ein Array mit Besuchszahlen pro Eisdiele
     */
    private function getIceShopVisitCounts(int $userId): array {
        global $pdo;
        $sql = "SELECT eisdiele_id, COUNT(*) AS visits
                FROM checkins
                WHERE nutzer_id = ?
                GROUP BY eisdiele_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_column($rows, 'visits'); 
        // ergibt z. B. [2,5,1,...]
    }
}
?>
