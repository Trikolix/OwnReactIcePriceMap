<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/seasonal_campaigns.php';

date_default_timezone_set('Europe/Berlin');

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($requestMethod, ['GET', 'POST'], true)) {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

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
    'rules' => [
        'bunny_min_zoom' => (int)($config['bunny_min_zoom'] ?? 9),
        'workshop_min_zoom' => (int)($config['workshop_min_zoom'] ?? 6),
    ],
    'workshop' => array_merge($config['workshop_location'], ['found' => false]),
];

if (!$auth) {
    echo json_encode($response);
    exit;
}

$userId = (int)$auth['user_id'];
$context = $requestMethod === 'POST' ? getEasterMapContextFromRequest() : null;
$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false, $context);

echo json_encode(array_merge($response, [
    'progress' => $normalized['progress'],
    'rules' => $normalized['rules'],
    'workshop' => $normalized['progress']['workshop'] ?? $response['workshop'],
]));
?>
