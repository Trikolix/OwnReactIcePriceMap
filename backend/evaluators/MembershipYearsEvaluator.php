<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../db_connect.php';

class MembershipYearsEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 59;

    public function evaluate(int $userId): array {
        global $pdo;

        $memberSince = $this->getMemberSince($userId);
        if ($memberSince === null) {
            return [];
        }

        $membershipYears = $this->getMembershipYears($memberSince);
        $achievements = [];

        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                               FROM award_levels
                               WHERE award_id = :awardId
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($membershipYears < $threshold) {
                continue;
            }

            $awardedAt = $this->getAnniversaryDate($memberSince, $threshold);
            if ($this->storeAwardIfNewWithDate($userId, self::AWARD_ID, $level, $awardedAt)) {
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

    private function getMemberSince(int $userId): ?string {
        global $pdo;

        $stmt = $pdo->prepare("SELECT DATE(erstellt_am) AS erstellt_am
                               FROM nutzer
                               WHERE id = :userId
                               LIMIT 1");
        $stmt->execute(['userId' => $userId]);
        $createdAt = $stmt->fetchColumn();

        return $createdAt ?: null;
    }

    private function getMembershipYears(string $memberSince): int {
        global $pdo;

        $stmt = $pdo->prepare("SELECT TIMESTAMPDIFF(YEAR, :memberSince, CURDATE())");
        $stmt->execute(['memberSince' => $memberSince]);

        return (int)$stmt->fetchColumn();
    }

    private function getAnniversaryDate(string $memberSince, int $threshold): string {
        global $pdo;

        $stmt = $pdo->prepare("SELECT DATE_ADD(:memberSince, INTERVAL :threshold YEAR)");
        $stmt->bindValue(':memberSince', $memberSince);
        $stmt->bindValue(':threshold', $threshold, PDO::PARAM_INT);
        $stmt->execute();

        return (string)$stmt->fetchColumn();
    }
}
?>
