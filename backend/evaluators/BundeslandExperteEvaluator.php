<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/MetadataAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class BundeslandExperteEvaluator extends BaseAwardEvaluator implements MetadataAwardEvaluator {
    const AWARD_ID = 22;

    private array $checkinMeta = [];

    public function setCheckinMetadata(array $meta): void {
        $this->checkinMeta = $meta;
    }

    public function evaluate(int $userId): array {
        global $pdo;
        
        if (empty($this->checkinMeta['bundesland'])) {
            throw new Exception("Bundesland-Information fehlt");
        }
        $bundesland = $this->checkinMeta['bundesland'];

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
            $bundeslandId = (int)$levelData['threshold'];
            if ((int)$bundesland == $bundeslandId) {
                $iceCount = $this->getIceCountBundesland($userId, $bundeslandId);

                if ($iceCount >= 30 && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
                    $achievements[] = [
                        'award_id' => self::AWARD_ID,
                        'level' => $level,
                        'message' => $levelData['description_de'],
                        'icon' => $levelData['icon_path'],
                        'ep' => (int)$levelData['ep'],
                    ];
                }
            }
        }
        return $achievements;
    }

    private function getIceCountBundesland(int $userId, int $bundeslandId): int {
        global $pdo;
        $sql = "SELECT COUNT(s.id) AS anzahl_eis
         FROM checkins c
         JOIN checkin_sorten s ON s.checkin_id = c.id
		 JOIN eisdielen e ON e.id = c.eisdiele_id
         WHERE c.nutzer_id = :userId AND e.bundesland_id = :bundeslandId;";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['userId' => $userId, 'bundeslandId' => $bundeslandId]);

        return (int)$stmt->fetchColumn();
    }
}
?>