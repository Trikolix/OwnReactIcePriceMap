<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class OnboardingAwardEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 77;

    public function evaluate(int $userId, int $level = 1): array {
        global $pdo;

        if ($userId <= 0 || $level <= 0) {
            return [];
        }

        // Wenn der Nutzer dieses Award-Level bereits hat, nichts tun
        if ($this->hasAward($userId, self::AWARD_ID, $level)) {
            return [];
        }

        // Daten des entsprechenden Levels aus award_levels für Award ID 77 laden
        $stmt = $pdo->prepare("
            SELECT level, threshold, icon_path, title_de, description_de, ep
            FROM award_levels 
            WHERE award_id = :awardId AND level = :level
            LIMIT 1
        ");
        $stmt->execute(['awardId' => self::AWARD_ID, 'level' => $level]);
        $levelData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$levelData) {
            // Fallback, falls award_levels noch nicht in DB hinterlegt
            $fallbackTitles = [
                1 => 'Startklar! 🍦',
                2 => 'Ice-App Experte 🌟',
            ];
            $fallbackDescriptions = [
                1 => 'Du hast alle 6 Schritte des Onboardings abgeschlossen!',
                2 => 'Du hast alle 6 Aufgaben der Experten-Stufe gemeistert!',
            ];
            $fallbackEp = [
                1 => 50,
                2 => 100,
            ];

            $levelData = [
                'level' => $level,
                'title_de' => $fallbackTitles[$level] ?? "Stufe $level abgeschlossen!",
                'description_de' => $fallbackDescriptions[$level] ?? "Erfolgreich Stufe $level abgeschlossen!",
                'icon_path' => 'uploads/award_icons/award_startklar.jpg',
                'ep' => $fallbackEp[$level] ?? 50,
            ];
        }

        if ($this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
            return [[
                'award_id' => self::AWARD_ID,
                'level' => $level,
                'title' => $levelData['title_de'] ?? "Stufe $level",
                'message' => $levelData['description_de'] ?? "Du hast Stufe $level abgeschlossen!",
                'icon' => $levelData['icon_path'] ?? 'uploads/award_icons/award_startklar.jpg',
                'ep' => (int)($levelData['ep'] ?? 50),
            ]];
        }

        return [];
    }
}
?>
