<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/seasonal_campaigns.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$campaignId = (string)($input['campaign_id'] ?? '');
$actionKey = (string)($input['action_key'] ?? '');

if ($campaignId === '' || $actionKey === '') {
    http_response_code(400);
    echo json_encode(['error' => 'campaign_id und action_key sind erforderlich']);
    exit;
}

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
$achievements = grantSeasonalActionAward($pdo, $campaignId, $actionKey, $userId);

echo json_encode([
    'success' => true,
    'campaign_id' => $campaignId,
    'action_key' => $actionKey,
    'achievements' => $achievements,
]);
?>
