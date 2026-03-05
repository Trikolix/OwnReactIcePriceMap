<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class WeekStreakEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 36;

    public function evaluate(int $userId): array {
        global $pdo;
        $count = $this->getLongestWeekStreak($userId);

        $achievements = [];

        // Hole alle Level für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep 
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($count >= $threshold && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
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

    function getLongestWeekStreak($nutzerId) {
      global $pdo;
       
      $sql = "WITH wochen_daten AS (
                SELECT DISTINCT 
                  YEARWEEK(datum, 3) AS jahrwoche,
                  -- Wir normieren jeden Check-in auf den Montag der jeweiligen Woche
                  STR_TO_DATE(CONCAT(YEARWEEK(datum, 3), ' Monday'), '%X%V %W') AS wochen_montag
                FROM checkins
                WHERE nutzer_id = :nutzer_id
              ),
              serien_gruppen AS (
                SELECT 
                  -- Der Trick: (Montag_der_Woche - Zeilennummer * 7 Tage)
                  -- bleibt identisch, solange die Wochen aufeinanderfolgen.
                  DATE_SUB(wochen_montag, INTERVAL ROW_NUMBER() OVER (ORDER BY wochen_montag) WEEK) AS gruppe_id
                FROM wochen_daten
              ),
              streak_liste AS (
                SELECT COUNT(*) AS streak_laenge
                FROM serien_gruppen
                GROUP BY gruppe_id
              )
              SELECT COALESCE(MAX(streak_laenge), 0) AS max_fortlaufende_wochen
              FROM streak_liste";
      
      $stmt = $pdo->prepare($sql);
      $stmt->execute(['nutzer_id' => $nutzerId]);
      $result = $stmt->fetch(PDO::FETCH_ASSOC);
       
      return (int)$result['max_fortlaufende_wochen'];
    }
}
?>