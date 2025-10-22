<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class IceSeasonEvaluator extends BaseAwardEvaluator {
    const AWARD_ID_SPRING = 47;
    const AWARD_ID_SUMMER = 27;
    const AWARD_ID_AUTUMN = 46;
    const AWARD_ID_WINTER = 42;
    
    private const SEASONS = [
        'spring' => [
            'award_id' => self::AWARD_ID_SPRING,
            'start_month' => 3,
            'start_day' => 1,
            'end_month' => 6,
            'end_day' => 1,
        ],
        'summer' => [
            'award_id' => self::AWARD_ID_SUMMER,
            'start_month' => 5,
            'start_day' => 1,
            'end_month' => 9,
            'end_day' => 1,
        ],
        'autumn' => [
            'award_id' => self::AWARD_ID_AUTUMN,
            'start_month' => 9,
            'start_day' => 1,
            'end_month' => 12,
            'end_day' => 1,
        ],
        'winter' => [
            'award_id' => self::AWARD_ID_WINTER,
            'start_month' => 12,
            'start_day' => 1,
            'end_month' => 3,
            'end_day' => 1,
        ],
    ];
    
    public function evaluate(int $userId): array {
        $achievements = [];
        $curYear = date('Y');
        
        foreach (self::SEASONS as $seasonKey => $season) {
            $awardId = $season['award_id'];
            $levelData = $this->getLevelData($awardId, $curYear);
            
            if ($levelData) {
                $count = $this->getCheckinForSeasonCount($userId, $curYear, $season);
                $level = (int)$levelData['level'];
                $threshold = (int)$levelData['threshold'];
                
                if ($count >= $threshold && $this->storeAwardIfNew($userId, $awardId, $level)) {
                    $achievements[] = [
                        'award_id' => $awardId,
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
    
    private function getLevelData(int $awardId, int $year): ?array {
        global $pdo;
        
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId AND level = :year");
        $stmt->execute(['awardId' => $awardId, 'year' => $year]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }
    
    private function getCheckinForSeasonCount(int $userId, int $year, array $season): int {
        global $pdo;
        
        list($startDate, $endDate) = $this->getSeasonDateRange($year, $season);
        
        $sql = "SELECT COUNT(*) AS anzahl_checkins
                FROM checkins
                WHERE nutzer_id = :userId
                AND datum >= :startDate
                AND datum < :endDate";
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':startDate', $startDate);
        $stmt->bindParam(':endDate', $endDate);
        $stmt->execute();
        
        return (int)$stmt->fetchColumn();
    }
    
    private function getSeasonDateRange(int $year, array $season): array {
        $startMonth = str_pad($season['start_month'], 2, '0', STR_PAD_LEFT);
        $startDay = str_pad($season['start_day'], 2, '0', STR_PAD_LEFT);
        $endMonth = str_pad($season['end_month'], 2, '0', STR_PAD_LEFT);
        $endDay = str_pad($season['end_day'], 2, '0', STR_PAD_LEFT);
        
        // Sonderbehandlung für Winter (geht über Jahreswechsel)
        if ($season['start_month'] == 12) {
            // Winter: 1. Dezember bis 1. März des Folgejahres
            $startDate = "$year-$startMonth-$startDay 00:00:00";
            $nextYear = $year + 1;
            $endDate = "$nextYear-$endMonth-$endDay 00:00:00";
        } else {
            $startDate = "$year-$startMonth-$startDay 00:00:00";
            $endDate = "$year-$endMonth-$endDay 00:00:00";
        }
        
        return [$startDate, $endDate];
    }
}
?>