<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/seasonal_campaigns.php';

date_default_timezone_set('Europe/Berlin');

$config = getSeasonalCampaignConfig('easter_2026');
if (!$config) {
    http_response_code(500);
    echo json_encode(['error' => 'Kampagnenkonfiguration fehlt.']);
    exit;
}

$phase = getSeasonalCampaignPhase($config);
$auth = authenticateRequest($pdo);

$response = [
    'campaign_id' => $config['id'],
    'phase' => $phase,
    'requires_login' => !$auth,
];

if (!$auth) {
    echo json_encode($response);
    exit;
}

$userId = (int)$auth['user_id'];
$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false);

echo json_encode(array_merge($response, [
    'progress' => $normalized['progress'],
]));
?>
