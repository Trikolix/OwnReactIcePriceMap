<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class GeschmackstreueEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 18;

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

        $thresholdDates = $this->getThresholdReachedDates($userId, array_map(
            static fn($levelData) => (int)$levelData['threshold'],
            $levels
        ));

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];
            $awardedAt = $thresholdDates[$threshold] ?? null;

            if ($awardedAt !== null && $this->storeAwardIfNewWithDate($userId, self::AWARD_ID, $level, $awardedAt)) {
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

    private function getThresholdReachedDates(int $userId, array $thresholds): array {
        global $pdo;
        $thresholds = array_values(array_unique(array_filter(array_map('intval', $thresholds), static fn($value) => $value > 0)));
        if (empty($thresholds)) {
            return [];
        }

        $sql = "SELECT s.sortenname, c.datum
                FROM checkin_sorten s
                JOIN checkins c ON c.id = s.checkin_id
                WHERE c.nutzer_id = ?
                ORDER BY c.datum ASC, c.id ASC, s.id ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);

        $countsByFlavour = [];
        $datesByThreshold = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $flavour = trim((string)$row['sortenname']);
            if ($flavour === '') {
                continue;
            }

            $countsByFlavour[$flavour] = ($countsByFlavour[$flavour] ?? 0) + 1;
            $count = $countsByFlavour[$flavour];
            if (in_array($count, $thresholds, true) && !isset($datesByThreshold[$count])) {
                $datesByThreshold[$count] = (string)$row['datum'];
            }
        }

        return $datesByThreshold;
    }
}
?>
