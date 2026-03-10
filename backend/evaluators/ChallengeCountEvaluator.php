<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class ChallengeCountEvaluator extends BaseAwardEvaluator {
    const CHALLANGE_COUNT_AWARD_ID = 45;
    const MULTIPLE_CHALLENGES_DAY_AWARD_ID = 58;

    public function evaluate(int $userId): array {
        global $pdo;

        // Hole alle Abschlussdaten sortiert nach Datum
        $completionDates = $this->getCompletionDates($userId);
        $count = count($completionDates);

        if ($count === 0) {
            return [];
        }

        // Hole alle Level für diesen Award
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC"); // jetzt ASC, damit wir von unten nach oben durchgehen
        $stmt->execute(['awardId' => self::CHALLANGE_COUNT_AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Hole aktuelle Stufe des Nutzers
        $stmt = $pdo->prepare("SELECT MAX(level) FROM user_awards WHERE user_id = ? AND award_id = ?");
        $stmt->execute([$userId, self::CHALLANGE_COUNT_AWARD_ID]);
        $currentLevel = (int)($stmt->fetchColumn() ?? 0);

        $newAwards = [];

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($count >= $threshold && $level > $currentLevel) {
                $awardedAt = $completionDates[$threshold - 1]; // Datum der n-ten Challenge

                // Neuen Award eintragen mit rückwirkendem Datum
                $this->storeAwardIfNewWithDate(
                    $userId,
                    self::CHALLANGE_COUNT_AWARD_ID,
                    $level,
                    $awardedAt
                );

                $newAwards[] = [
                    'award_id' => self::CHALLANGE_COUNT_AWARD_ID,
                    'level' => $level,
                    'message' => $levelData['description_de'],
                    'icon' => $levelData['icon_path'],
                    'ep' => (int)$levelData['ep'],
                ];

                // WICHTIG: Den aktuellen Stand hochzählen, sonst würden doppelt vergeben
                $currentLevel = $level;
            }
        }

        // Award 58: Challenges an einem Tag (ohne Rückdatierung)
        $dailyChallengeCountByDate = [];
        foreach ($completionDates as $completedAt) {
            $date = substr((string)$completedAt, 0, 10);
            if (!isset($dailyChallengeCountByDate[$date])) {
                $dailyChallengeCountByDate[$date] = 0;
            }
            $dailyChallengeCountByDate[$date]++;
        }

        $maxChallengesPerDay = empty($dailyChallengeCountByDate) ? 0 : max($dailyChallengeCountByDate);

        if ($maxChallengesPerDay > 0) {
            $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                                   FROM award_levels
                                   WHERE award_id = :awardId
                                   ORDER BY level ASC");
            $stmt->execute(['awardId' => self::MULTIPLE_CHALLENGES_DAY_AWARD_ID]);
            $dailyLevels = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $pdo->prepare("SELECT MAX(level) FROM user_awards WHERE user_id = ? AND award_id = ?");
            $stmt->execute([$userId, self::MULTIPLE_CHALLENGES_DAY_AWARD_ID]);
            $currentDailyLevel = (int)($stmt->fetchColumn() ?? 0);

            foreach ($dailyLevels as $dailyLevelData) {
                $dailyLevel = (int)$dailyLevelData['level'];
                $dailyThreshold = (int)$dailyLevelData['threshold'];

                if ($maxChallengesPerDay >= $dailyThreshold && $dailyLevel > $currentDailyLevel) {
                    if ($this->storeAwardIfNew($userId, self::MULTIPLE_CHALLENGES_DAY_AWARD_ID, $dailyLevel)) {
                        $newAwards[] = [
                            'award_id' => self::MULTIPLE_CHALLENGES_DAY_AWARD_ID,
                            'level' => $dailyLevel,
                            'message' => $dailyLevelData['description_de'],
                            'icon' => $dailyLevelData['icon_path'],
                            'ep' => (int)$dailyLevelData['ep'],
                        ];
                    }
                    $currentDailyLevel = $dailyLevel;
                }
            }
        }

        return $newAwards;
    }

    private function getCompletionDates(int $userId): array {
        global $pdo;
        $sql = "SELECT completed_at
                FROM challenges
                WHERE nutzer_id = ? AND completed = 1
                ORDER BY completed_at ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN); // Array mit Datumsstrings
    }
}
?>
