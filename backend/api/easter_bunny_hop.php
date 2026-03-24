<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/seasonal_campaigns.php';

date_default_timezone_set('Europe/Berlin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
        'message' => 'Die Osterhasenjagd ist aktuell nicht aktiv.',
    ]);
    exit;
}

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];

$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false);
$row = $normalized['row'];
$path = $normalized['path'];
$progress = $normalized['progress'];

if ($progress['completed']) {
    echo json_encode([
        'success' => true,
        'phase' => $phase,
        'message' => 'Das Versteck ist bereits gefunden.',
        'progress' => $progress,
        'achievements' => [],
    ]);
    exit;
}

$nextIndex = ((int)($row['current_index'] ?? 0)) + 1;
$totalHops = (int)($row['total_hops'] ?? $config['total_hops']);
$achievements = [];

if ($nextIndex >= $totalHops) {
    $stmt = $pdo->prepare(
        "UPDATE easter_bunny_progress
         SET current_index = :current_index,
             completed_at = NOW()
         WHERE user_id = :user_id"
    );
    $stmt->execute([
        'current_index' => $totalHops - 1,
        'user_id' => $userId,
    ]);
    $achievements = grantSeasonalActionAward($pdo, 'easter_2026', 'hideout_found', $userId);
    $normalized = normalizeEasterProgressRow($pdo, $userId, $config, false);

    echo json_encode([
        'success' => true,
        'phase' => $phase,
        'message' => 'Du hast das Versteck des Osterhasen gefunden und den Award freigeschaltet.',
        'progress' => $normalized['progress'],
        'achievements' => $achievements,
    ]);
    exit;
}

$stmt = $pdo->prepare(
    "UPDATE easter_bunny_progress
     SET current_index = :current_index
     WHERE user_id = :user_id"
);
$stmt->execute([
    'current_index' => $nextIndex,
    'user_id' => $userId,
]);

$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false);
$target = $normalized['progress']['current_target'];
$targetName = isset($target['name']) ? (string)$target['name'] : 'dem nächsten Versteck';

echo json_encode([
    'success' => true,
    'phase' => $phase,
    'message' => "Der Hase hopst weiter in Richtung {$targetName}.",
    'progress' => $normalized['progress'],
    'achievements' => [],
]);
?>
