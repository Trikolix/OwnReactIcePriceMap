<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class OneMoreLoopEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 37;

    public function evaluate(int $userId): array {
        global $pdo;
        $achievements = [];

        // Prüfe: Hat Nutzer den QR Code mit ID 1 gescannt?
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_qr_scans WHERE user_id = :userId AND qr_code_id = 1");
        $stmt->execute(['userId' => $userId]);
        $hasScanned = $stmt->fetchColumn() > 0;

        if (!$hasScanned) return [];

        // Prüfe: Hat Nutzer ein Eis per Rad eingecheckt zwischen 01.08. und 10.08.?
        $stmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM checkins 
            WHERE nutzer_id = :userId 
              AND anreise = 'Fahrrad'
              AND DATE(datum) BETWEEN '2025-08-01 00:00:00' AND '2025-08-10 23:59:59'
        ");
        $stmt->execute(['userId' => $userId]);
        $hasCheckin = $stmt->fetchColumn() > 0;

         // Hole passende Level aus der Datenbank (Stufe 1 und 2)
        $stmt = $pdo->prepare("SELECT level, icon_path, title_de, description_de, ep FROM award_levels WHERE award_id = :awardId");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $levelsByLevel = [];
        foreach ($levels as $lvl) {
            $levelsByLevel[(int)$lvl['level']] = $lvl;
        }

        // Bestimme Ziel-Stufe
        $targetLevel = $hasCheckin ? 2 : 1;

        // Prüfe, ob Nutzer schon diese oder höhere Stufe hat
        $stmt = $pdo->prepare("SELECT MAX(level) FROM user_awards WHERE user_id = :userId AND award_id = :awardId");
        $stmt->execute(['userId' => $userId, 'awardId' => self::AWARD_ID]);
        $currentLevel = (int) $stmt->fetchColumn();

        if ($currentLevel >= $targetLevel) return [];

        // Lösche ggf. niedrigere Stufe, um mit höherer zu ersetzen
        if ($currentLevel > 0 && $currentLevel < $targetLevel) {
            $stmt = $pdo->prepare("DELETE FROM user_awards WHERE user_id = :userId AND award_id = :awardId");
            $stmt->execute(['userId' => $userId, 'awardId' => self::AWARD_ID]);
        }

        // Speichere neue Stufe
        $levelData = $levelsByLevel[$targetLevel] ?? null;
        if ($levelData) {
            $this->storeAwardIfNew($userId, self::AWARD_ID, $targetLevel);

            $achievements[] = [
                'award_id' => self::AWARD_ID,
                'level' => $targetLevel,
                'message' => $levelData['description_de'],
                'icon' => $levelData['icon_path'],
                'ep' => (int)$levelData['ep'],
            ];
        }

        return $achievements;
    }
}
?>