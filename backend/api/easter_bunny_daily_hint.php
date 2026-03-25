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
        'message' => 'Tageshinweise sind nur während der Osteraktion verfügbar.',
    ]);
    exit;
}

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false);
$row = $normalized['row'];
$today = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');

if (($row['last_hint_claimed_on'] ?? null) === $today) {
    echo json_encode([
        'success' => true,
        'phase' => $phase,
        'message' => 'Der heutige Hinweis wurde bereits abgeholt.',
        'progress' => $normalized['progress'],
    ]);
    exit;
}

$stmt = $pdo->prepare(
    "UPDATE easter_bunny_progress
     SET daily_hint_claims = daily_hint_claims + 1,
         last_hint_claimed_on = :today
     WHERE user_id = :user_id"
);
$stmt->execute([
    'today' => $today,
    'user_id' => $userId,
]);

$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false);

echo json_encode([
    'success' => true,
    'phase' => $phase,
    'message' => $normalized['progress']['hint']['text'] ?? 'Der Osterhase hinterlässt heute nur sehr leise Spuren.',
    'hint' => $normalized['progress']['hint'],
    'progress' => $normalized['progress'],
]);
?>
