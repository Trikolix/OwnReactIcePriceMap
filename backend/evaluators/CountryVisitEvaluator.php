<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/mail.php';
 
class CountryVisitEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 19;

    private const ADMIN_EMAIL = 'admin@ice-app.de';

    private ?int $checkedInCountryId;

    public function __construct(?int $checkedInCountryId = null) {
        $this->checkedInCountryId = $checkedInCountryId;
    }
 
    public function evaluate(int $userId): array {
        $visitedCountries = $this->getVisitedCountryCodes($userId); // z. B. ['DE', 'FR', 'IT']
        $achievements = [];
 
        global $pdo;
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->notifyAdminAboutMissingCountryAward($userId, $levels);
 
        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $requiredCountryCode = $levelData['threshold']; // z. B. 'IT'
 
            if (in_array($requiredCountryCode, $visitedCountries, true) &&
                $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
 
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

    private function notifyAdminAboutMissingCountryAward(int $userId, array $levels): void {
        if ($this->checkedInCountryId === null || $this->checkedInCountryId <= 0 || $this->checkedInCountryId === 1) {
            return;
        }

        foreach ($levels as $levelData) {
            if ((int)$levelData['threshold'] === $this->checkedInCountryId) {
                return;
            }
        }

        global $pdo;
        $stmt = $pdo->prepare(
            'SELECT l.id AS country_id, l.name AS country_name, n.id AS user_id, n.username
             FROM laender l
             JOIN nutzer n ON n.id = :userId
             WHERE l.id = :countryId
             LIMIT 1'
        );
        $stmt->execute([
            'userId' => $userId,
            'countryId' => $this->checkedInCountryId,
        ]);
        $details = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$details) {
            return;
        }

        $subject = 'Fehlender Länder-Award nach Check-in';
        $message = "Ein Nutzer hat in einem Land eingecheckt, für das noch kein Länder-Award existiert.\n\n"
            . "Land: {$details['country_name']}\n"
            . "Land-ID: {$details['country_id']}\n"
            . "Nutzer: {$details['username']}\n"
            . "Nutzer-ID: {$details['user_id']}\n";

        if (!iceapp_send_utf8_text_mail(self::ADMIN_EMAIL, $subject, $message)) {
            error_log(sprintf(
                'Admin-Benachrichtigung für fehlenden Länder-Award konnte nicht gesendet werden (Land-ID: %d, Nutzer-ID: %d).',
                $this->checkedInCountryId,
                $userId
            ));
        }
    }
 
    private function getVisitedCountryCodes(int $userId): array {
        global $pdo;
        $sql = "SELECT DISTINCT s.land_id
                FROM checkins c
                JOIN eisdielen s ON c.eisdiele_id = s.id
                WHERE c.nutzer_id = ? AND s.land_id IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
 
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'land_id');
    }
}
?>
