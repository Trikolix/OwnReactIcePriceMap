<?php
require_once 'AwardEvaluator.php';
require_once '../db_connect.php'
class PhotosCountEvaluator implements AwardEvaluator {
    const AWARD_ID = 6;

public function evaluate(int $userId): array {
    $count = $this->getPhotosCount($userId);

    $achievements = [];

    // Hole alle Level für diesen Award aus der Datenbank
    $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de 
                           FROM award_levels 
                           WHERE award_id = :awardId 
                           ORDER BY level ASC");
    $stmt->execute(['awardId' => self::AWARD_ID]);
    $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($levels as $levelData) {
        $level = (int)$levelData['level'];
        $threshold = (int)$levelData['threshold'];

        if ($count >= $threshold && !$this->hasAward($pdo, $userId, $level)) {
            $achievements[] = [
                'award_id' => self::AWARD_ID,
                'level' => $level,
                'message' => $levelData['description_de'],
                'icon' => $levelData['icon_path'],
            ];
        }
    }

    return $achievements;
}

private function getPhotosCount(int $userId): int {
    $sql = "SELECT COUNT(id) AS checkins_photos_count
            FROM checkins
            WHERE nutzer_id = ? AND bild_url IS NOT NULL";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);

    return (int)$stmt->fetchColumn();
}

// Prüft, ob der Nutzer diesen Award-Level schon hat
private function hasAward(int $userId, int $level): bool {
    $sql = "SELECT 1
            FROM user_awards
            WHERE user_id = :userId AND award_level = :level AND award_id = :awardId";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'userId' => $userId,
            'level' => $level,
            'awardId' => self::AWARD_ID,
        ]);
    return $stmt->fetch() !== false;
}
?>