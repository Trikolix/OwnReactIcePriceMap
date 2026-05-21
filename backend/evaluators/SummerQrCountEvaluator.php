<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../lib/summer_campaign.php';

class SummerQrCountEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 67;

    public function evaluate(int $userId): array {
        if (self::AWARD_ID <= 0) {
            return [];
        }

        global $pdo;
        ensureSummerCampaignTables($pdo);

        $config = getSummerCampaignConfig($pdo, SUMMER_CAMPAIGN_ID);
        if (!isSummerCampaignCurrentlyActive($config)) {
            return [];
        }

        $scanCount = $this->getCollectedSummerQrCount($userId);
        $stmt = $pdo->prepare(
            "SELECT level, threshold, icon_path, title_de, description_de, ep
             FROM award_levels
             WHERE award_id = :awardId
             ORDER BY threshold ASC, level ASC"
        );
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $achievements = [];
        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];
            if ($scanCount < $threshold || !$this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
                continue;
            }

            $achievements[] = [
                'award_id' => self::AWARD_ID,
                'level' => $level,
                'title' => $levelData['title_de'],
                'message' => $levelData['description_de'],
                'icon' => $levelData['icon_path'],
                'ep' => (int)$levelData['ep'],
            ];
        }

        return $achievements;
    }

    private function getCollectedSummerQrCount(int $userId): int {
        global $pdo;

        $stmt = $pdo->prepare(
            "SELECT COUNT(DISTINCT scs.qr_code_id)
             FROM summer_campaign_shops scs
             JOIN user_qr_scans uqs ON uqs.qr_code_id = scs.qr_code_id
             WHERE scs.campaign_id = :campaignId
               AND scs.is_active = 1
               AND uqs.user_id = :userId"
        );
        $stmt->execute([
            'campaignId' => SUMMER_CAMPAIGN_ID,
            'userId' => $userId,
        ]);

        return (int)$stmt->fetchColumn();
    }
}
?>
