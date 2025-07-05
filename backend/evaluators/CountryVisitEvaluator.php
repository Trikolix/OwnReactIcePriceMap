<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';
 
class CountryVisitEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 19;
 
    public function evaluate(int $userId): array {
        $visitedCountries = $this->getVisitedCountryCodes($userId); // z. B. ['DE', 'FR', 'IT']
        $achievements = [];
 
        global $pdo;
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $requiredCountryCode = $levelData['threshold']; // z. B. 'IT'
 
            if (in_array($requiredCountryCode, $visitedCountries, true) &&
                $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
 
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
 
    private function getVisitedCountryCodes(int $userId): array {
        global $pdo;
        $sql = "SELECT DISTINCT s.land_id
                FROM checkins c
                JOIN eisdielen s ON c.eisdiele_id = s.id
                WHERE c.nutzer_id = ? AND s.land_id IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
 
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'land_id');
    }
}
?>