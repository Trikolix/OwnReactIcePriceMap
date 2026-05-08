<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class FavoriteShopCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 63;

    public function evaluate(int $userId): array {
        global $pdo;

        $achievements = [];

        $stmt = $pdo->prepare("
            SELECT level, threshold, icon_path, title_de, description_de, ep
            FROM award_levels
            WHERE award_id = :awardId
            ORDER BY level ASC
        ");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $favoritesStmt = $pdo->prepare("
            SELECT hinzugefuegt_am
            FROM favoriten
            WHERE nutzer_id = ?
            ORDER BY hinzugefuegt_am ASC
        ");
        $favoritesStmt->execute([$userId]);
        $favorites = $favoritesStmt->fetchAll(PDO::FETCH_COLUMN);

        $count = count($favorites);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($count >= $threshold) {
                $thresholdDate = $favorites[$threshold - 1] ?? date('Y-m-d H:i:s');

                if ($this->storeAwardIfNewWithDate($userId, self::AWARD_ID, $level, $thresholdDate)) {
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
