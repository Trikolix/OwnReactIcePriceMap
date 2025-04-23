<?php
require_once 'AwardEvaluator.php';
require_once '../db_connect.php'
class IceShopCountEvaluator implements AwardEvaluator {

public function evaluate(int $userId): array {
    $count = $this->getReviewCount($userId);

    $achievements = [];

    $levels = [
        1 => 1,
        2 => 3,
        3 => 5,
        4 => 10,
        5 => 20,
        6 => 50,
        7 => 100,
    ];

    foreach ($levels as $level => $threshold) {
        if ($count >= $threshold && !$this->hasAward($userId, $level)) {
            $achievements[] = [
                'award_id' => 1,
                'level' => $level,
                'message' => "Du hast $count unterschiedliche Eisdielen besucht!",
                'icon' => "/awards/iceShopCount-$threshold.png",
            ];
        }
    }

    return $achievements;
}

private function getReviewCount(int $userId): int {
    $sql = "SELECT COUNT(DISTINCT eisdiele_id) AS eisdielen_besucht
            FROM checkins
            WHERE nutzer_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);

    return $stmt->fetchColumn();
}

private function hasAward(int $userId, int $level): bool {
    // Prüft, ob der Nutzer diesen Award-Level schon hat
    // SELECT * FROM user_awards WHERE user_id = :userId AND award_level = :level
    return false;
}
}
?>