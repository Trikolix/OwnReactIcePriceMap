<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class ChallengeCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 45;

    public function evaluate(int $userId): array {
        global $pdo;
        $count = $this->getChallengeCount($userId);
        
        // Hole alle Level für diesen Award
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level DESC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Hole aktuelle Stufe des Nutzers
        $stmt = $pdo->prepare("SELECT level FROM user_awards WHERE user_id = ? AND award_id = ?");
        $stmt->execute([$userId, self::AWARD_ID]);
        $currentLevel = (int)($stmt->fetchColumn() ?? 0);
        
        $newLevelData = null;
        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];
            if ($count >= $threshold) {
                if ($level > $currentLevel) {
                    $newLevelData = $levelData;
                }
                break; // Nur höchste Stufe
            }
        }
    
        if ($newLevelData) {
            // Lösche alten Award
            $stmt = $pdo->prepare("DELETE FROM user_awards WHERE user_id = ? AND award_id = ?");
            $stmt->execute([$userId, self::AWARD_ID]);
            // Lege neuen Award an
            $this->storeAwardIfNew($userId, self::AWARD_ID, (int)$newLevelData['level']);
            return [[
                'award_id' => self::AWARD_ID,
                'level' => (int)$newLevelData['level'],
                'message' => $newLevelData['description_de'],
                'icon' => $newLevelData['icon_path'],
                'ep' => (int)$newLevelData['ep'],
            ]];
        }
        return [];
    }

    private function getChallengeCount(int $userId): int {
        global $pdo;
        $sql = "SELECT COUNT(id)
                FROM challenges
                WHERE nutzer_id = ? AND completed = 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);

        return (int)$stmt->fetchColumn();
    }
}
?>