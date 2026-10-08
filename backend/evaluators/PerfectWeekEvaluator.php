<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class PerfectWeekEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 11;

    public function evaluate(int $userId): array {
        global $pdo;

        $achievements = [];
        $streaks = $this->getDailyIceStreaks($userId);

        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels
                               WHERE award_id = :awardId
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            foreach ($streaks as $streak) {
                if ((int)$streak['streak_length'] < $threshold) {
                    continue;
                }

                if ($this->storeAwardIfNewWithDate($userId, self::AWARD_ID, $level, $streak['end_date'])) {
                    $achievements[] = [
                        'award_id' => self::AWARD_ID,
                        'level' => $level,
                        'message' => $levelData['description_de'],
                        'icon' => $levelData['icon_path'],
                        'ep' => (int)$levelData['ep'],
                    ];
                }

                break;
            }
        }

        return $achievements;
    }

    private function getDailyIceStreaks(int $userId): array {
        global $pdo;
        require_once __DIR__ . '/../lib/streaks.php';
        $now = streakNow();
        $data = streakLoad($pdo, $userId, $now);
        [, $protected] = streakSettle($data['states']['day'], $data['real']['day'], $data['protected']['day'], 'day', $now);
        return array_map(fn($run) => ['streak_length' => $run['value'], 'end_date' => $run['end']], streakRuns($data['real']['day'], $protected, 'day'));
    }
}
