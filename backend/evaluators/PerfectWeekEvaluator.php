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

        $sql = "WITH checkin_days AS (
                    SELECT DISTINCT DATE(datum) AS checkin_date
                    FROM checkins
                    WHERE nutzer_id = :userId
                ),
                numbered_days AS (
                    SELECT
                        checkin_date,
                        ROW_NUMBER() OVER (ORDER BY checkin_date) AS row_num
                    FROM checkin_days
                ),
                streak_groups AS (
                    SELECT
                        checkin_date,
                        DATE_SUB(checkin_date, INTERVAL row_num DAY) AS streak_group
                    FROM numbered_days
                )
                SELECT
                    MIN(checkin_date) AS start_date,
                    MAX(checkin_date) AS end_date,
                    COUNT(*) AS streak_length
                FROM streak_groups
                GROUP BY streak_group
                ORDER BY start_date ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['userId' => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
