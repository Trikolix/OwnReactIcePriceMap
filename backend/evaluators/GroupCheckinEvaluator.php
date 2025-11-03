<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class GroupCheckinEvaluator extends BaseAwardEvaluator {
    const AWARD_ID_GROUP_COUNT = 50;
    const AWARD_ID_LARGEST_GROUP = 51;

    public function evaluate(int $userId): array {
        $achievements = [];
        
        // Hole alle Gruppendaten in einer Query
        $groupData = $this->getGroupData($userId);
        
        if (empty($groupData)) {
            return $achievements;
        }
        
        // Award für Anzahl der Gruppen-Checkins
        $groupCheckinAchievements = $this->evaluateGroupCheckinCount($userId, $groupData);
        $achievements = array_merge($achievements, $groupCheckinAchievements);
        
        // Award für größte Gruppe
        $largestGroupAchievement = $this->evaluateLargestGroup($userId, $groupData);
        if ($largestGroupAchievement) {
            $achievements[] = $largestGroupAchievement;
        }
        
        return $achievements;
    }
    
    private function getGroupData(int $userId): array {
        global $pdo;
        
        $sql = "SELECT 
                    g.group_id,
                    g.group_size,
                    g.user_checkin_date
                FROM (
                    SELECT 
                        c.group_id,
                        COUNT(DISTINCT c.nutzer_id) AS group_size,
                        MIN(CASE WHEN c.nutzer_id = :userId THEN c.datum END) AS user_checkin_date
                    FROM checkins c
                    WHERE c.group_id IS NOT NULL
                    AND c.group_id IN (
                        SELECT DISTINCT group_id 
                        FROM checkins 
                        WHERE nutzer_id = :userId AND group_id IS NOT NULL
                    )
                    GROUP BY c.group_id
                    HAVING group_size >= 2
                ) g
                WHERE g.user_checkin_date IS NOT NULL
                ORDER BY g.user_checkin_date ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['userId' => $userId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function evaluateGroupCheckinCount(int $userId, array $groupData): array {
        global $pdo;
        $count = count($groupData);
        
        $achievements = [];
        
        // Hole alle Level für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID_GROUP_COUNT]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];
            
            if ($count >= $threshold) {
                // Verwende das Datum des entsprechenden Gruppen-Checkins
                $awardedAt = $groupData[$threshold - 1]['user_checkin_date'];
                
                if ($this->storeAwardIfNewWithDate($userId, self::AWARD_ID_GROUP_COUNT, $level, $awardedAt)) {
                    $achievements[] = [
                        'award_id' => self::AWARD_ID_GROUP_COUNT,
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
    
    private function evaluateLargestGroup(int $userId, array $groupData): ?array {
        global $pdo;
        
        // Finde die größte Gruppe aus den Daten
        $largestGroupSize = 0;
        $largestGroupDate = null;
        
        foreach ($groupData as $group) {
            if ((int)$group['group_size'] > $largestGroupSize) {
                $largestGroupSize = (int)$group['group_size'];
                $largestGroupDate = $group['user_checkin_date'];
            }
        }
        
        if ($largestGroupSize < 2) {
            return null; // Keine Gruppe, wenn weniger als 2 Personen
        }
        
        // Hole das Level für die größte Gruppe
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId AND threshold <= :groupSize
                               ORDER BY level DESC LIMIT 1");
        $stmt->execute(['awardId' => self::AWARD_ID_LARGEST_GROUP, 'groupSize' => $largestGroupSize]);
        $levelData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$levelData) {
            return null;
        }
        
        $level = (int)$levelData['level'];
        
        if ($this->storeAwardIfNewWithDate($userId, self::AWARD_ID_LARGEST_GROUP, $level, $largestGroupDate)) {
            return [
                'award_id' => self::AWARD_ID_LARGEST_GROUP,
                'level' => $level,
                'message' => $levelData['description_de'],
                'icon' => $levelData['icon_path'],
                'ep' => (int)$levelData['ep'],
            ];
        }
        
        return null;
    }
    

}
?>