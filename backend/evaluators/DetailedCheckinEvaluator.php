<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class DetailedCheckinEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 32;

    public function evaluate(int $userId): array {
        global $pdo;
        
        // Hole alle Level für diesen Award
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY threshold ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Hole alle Check-ins mit Kommentar >= kleinste Schwelle
        $minThreshold = (int)$levels[0]['threshold'];
        
        $sql = "SELECT 
                    datum,
                    CHAR_LENGTH(kommentar) AS zeichenanzahl
                FROM 
                    checkins
                WHERE 
                    nutzer_id = :userId
                    AND kommentar IS NOT NULL
                    AND CHAR_LENGTH(kommentar) >= :minThreshold
                ORDER BY datum ASC";
    
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'userId' => $userId,
            'minThreshold' => $minThreshold
        ]);
        $checkins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
        $achievements = [];
    
        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];
        
            // Suche frühestes Datum, an dem Threshold erreicht wurde
            foreach ($checkins as $checkin) {
                if ((int)$checkin['zeichenanzahl'] >= $threshold) {
                    $awardedAt = $checkin['datum'];
                
                    if ($this->storeAwardIfNewWithDate($userId, self::AWARD_ID, $level, $awardedAt)) {
                        $achievements[] = [
                            'award_id' => self::AWARD_ID,
                            'level' => $level,
                            'message' => $levelData['description_de'],
                            'icon' => $levelData['icon_path'],
                            'ep' => (int)$levelData['ep'],
                        ];
                    }
                
                    break; // Nächster Level
                }
            }
        }
    
        return $achievements;
    }

}
?>