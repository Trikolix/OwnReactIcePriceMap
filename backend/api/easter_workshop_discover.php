<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/seasonal_campaigns.php';

date_default_timezone_set('Europe/Berlin');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
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
if ($phase !== 'active') {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'phase' => $phase,
        'message' => 'Die Osterwerkstatt kann nur waehrend der Osteraktion entdeckt werden.',
    ]);
    exit;
}

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false);

if (!empty($normalized['progress']['completed'])) {
    echo json_encode([
        'success' => true,
        'phase' => $phase,
        'message' => 'Die Osterhasenwerkstatt hast du bereits entdeckt.',
        'progress' => $normalized['progress'],
        'rules' => $normalized['rules'],
        'achievements' => [],
    ]);
    exit;
}

$stmt = $pdo->prepare(
    "UPDATE easter_bunny_progress
     SET completed_at = NOW()
     WHERE user_id = :user_id"
);
$stmt->execute(['user_id' => $userId]);

$achievements = grantSeasonalActionAward($pdo, 'easter_2026', 'hideout_found', $userId);
$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false);

echo json_encode([
    'success' => true,
    'phase' => $phase,
    'message' => 'Du hast die Osterhasenwerkstatt auf der Osterinsel gefunden und den Secret Award freigeschaltet.',
    'progress' => $normalized['progress'],
    'rules' => $normalized['rules'],
    'achievements' => $achievements,
]);
?>
