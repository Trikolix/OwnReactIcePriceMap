<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/MetadataAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class CountryVisitEvaluator extends BaseAwardEvaluator implements MetadataAwardEvaluator {
    const AWARD_ID = 19;

    private array $checkinMeta = [];

    public function setCheckinMetadata(array $meta): void {
        $this->checkinMeta = $meta;
    }

    public function evaluate(int $userId): array {
        global $pdo;

        $achievements = [];

        if (empty($this->checkinMeta['land'])) {
            throw new Exception("Land-Information fehlt");
        }
        $land = $this->checkinMeta['land'];

        // Hole alle Level für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de 
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $landId = (int)$levelData['threshold'];
            if ((int)$land == $landId) {
                if ($this->hasVisitedCountry($userId, $landId) && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
                    $achievements[] = [
                        'award_id' => self::AWARD_ID,
                        'level' => $level,
                        'message' => $levelData['description_de'],
                        'icon' => $levelData['icon_path'],
                    ];
                }
            }
        }
        return $achievements;
    }

    private function hasVisitedCountry(int $userId, int $landId): bool {
        global $pdo;
        $sql = "SELECT 
	                COUNT(c.id)
                FROM `checkins` c
                JOIN eisdielen e ON c.eisdiele_id = e.id
                WHERE c.`nutzer_id` = ? AND e.land_id = ?;";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId, $landId]);

        return (bool)$stmt->fetchColumn() > 0;
    }
}
?>