<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../lib/summer_campaign.php';

class SummerCampaignEvaluator extends BaseAwardEvaluator {
    public function evaluate(int $userId): array {
        global $pdo;
        return evaluateSummerCampaignBonusAwards($pdo, $userId, SUMMER_CAMPAIGN_ID);
    }
}
?>
