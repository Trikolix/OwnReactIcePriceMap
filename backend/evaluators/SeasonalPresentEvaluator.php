<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class SeasonalPresentEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 53;

    public function evaluate(int $userId): array {
        global $pdo;

        $achievements = [];

        // Hole alle Level für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $currentDate = new DateTime();
        $dateStr = $currentDate->format('Y-m-d');

        // Map für Zeiträume und zugehörige Level
        $periods = [
            [
                'start' => '2025-12-23',
                'end' => '2026-01-01',
                'levels' => [
                    1 => ['requireCheckin' => false, 'replaceLevel' => null],
                    2 => ['requireCheckin' => true, 'replaceLevel' => 1],
                ]
            ],
            [
                'start' => '2026-04-02',
                'end' => '2026-04-07',
                'levels' => [
                    3 => ['requireCheckin' => false, 'replaceLevel' => null],
                    4 => ['requireCheckin' => true, 'replaceLevel' => 3],
                ]
            ],
            // Weitere Zeiträume/Festlichkeiten können hier ergänzt werden
        ];

        $activePeriod = null;
        foreach ($periods as $period) {
            if ($dateStr >= $period['start'] && $dateStr <= $period['end']) {
                $activePeriod = $period;
                break;
            }
        }

        if ($activePeriod) {
            $stmtCheckin = $pdo->prepare("SELECT COUNT(*) FROM checkins WHERE nutzer_id = :userId AND datum BETWEEN :start AND :end");
            $hasCheckin = [];
            foreach ($activePeriod['levels'] as $level => $info) {
                if ($info['requireCheckin']) {
                    $stmtCheckin->execute([
                        'userId' => $userId,
                        'start' => $activePeriod['start'],
                        'end' => $activePeriod['end']
                    ]);
                    $hasCheckin[$level] = $stmtCheckin->fetchColumn() > 0;
                } else {
                    $hasCheckin[$level] = false;
                }
            }
            // Hole alle bereits vergebenen Level für diesen Award
            $stmtUserLevels = $pdo->prepare("SELECT level FROM user_awards WHERE user_id = :userId AND award_id = :awardId");
            $stmtUserLevels->execute(['userId' => $userId, 'awardId' => self::AWARD_ID]);
            $userAwardedLevels = array_map('intval', $stmtUserLevels->fetchAll(PDO::FETCH_COLUMN));
            // Prüfe, ob ein höheres Level (mit replaceLevel) bereits vergeben ist, dann überspringe das ersetzte Level
            $replacedLevels = [];
            foreach ($activePeriod['levels'] as $level => $info) {
                if ($info['replaceLevel'] && in_array($level, $userAwardedLevels)) {
                    $replacedLevels[] = $info['replaceLevel'];
                }
            }
            $awardedLevels = [];
            foreach ($levels as $levelData) {
                $level = (int)$levelData['level'];
                if (!isset($activePeriod['levels'][$level])) continue;
                if (in_array($level, $userAwardedLevels)) continue; // Bereits erreicht, nicht erneut prüfen/anzeigen
                if (in_array($level, $replacedLevels)) continue; // Dieses Level wurde durch ein höheres ersetzt
                $info = $activePeriod['levels'][$level];
                if (($info['requireCheckin'] && $hasCheckin[$level]) || (!$info['requireCheckin'] && !$hasCheckin[$level])) {
                    $stored = $this->storeAwardIfNew($userId, self::AWARD_ID, $level);
                    if ($info['replaceLevel']) {
                        $stmt = $pdo->prepare("DELETE FROM user_awards WHERE user_id = :userId AND award_id = :awardId AND level = :level");
                        $stmt->execute(['userId' => $userId, 'awardId' => self::AWARD_ID, 'level' => $info['replaceLevel']]);
                    }
                    $achievements[] = [
                        'award_id' => self::AWARD_ID,
                        'level' => $level,
                        'message' => $levelData['description_de'],
                        'icon' => $levelData['icon_path'],
                        'ep' => (int)$levelData['ep'],
                    ];
                    $awardedLevels[] = $level;
                }
            }
        }
        return $achievements;
    }
}
?>