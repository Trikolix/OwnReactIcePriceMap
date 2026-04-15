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
        'message' => 'Tageshinweise sind nur waehrend der Osteraktion verfuegbar.',
    ]);
    exit;
}

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false);
$row = $normalized['row'];
$today = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');
$currentTotalHints = (int)($normalized['progress']['total_hints_found'] ?? 0);
$hint = getDailyHintForUser($userId, $today, (int)($row['hop_count'] ?? 0), $currentTotalHints);

if (($row['last_hint_claimed_on'] ?? null) === $today) {
    echo json_encode([
        'success' => true,
        'phase' => $phase,
        'message' => 'Der heutige Hinweis wurde bereits abgeholt.',
        'hint' => $hint,
        'progress' => $normalized['progress'],
        'rules' => $normalized['rules'],
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
$updatedTotalHints = (int)($normalized['progress']['total_hints_found'] ?? $currentTotalHints + 1);
$hint = getDailyHintForUser($userId, $today, (int)($normalized['row']['hop_count'] ?? $row['hop_count'] ?? 0), $updatedTotalHints);

echo json_encode([
    'success' => true,
    'phase' => $phase,
    'message' => $hint['text'] ?? 'Der Osterhase hinterlaesst heute nur sehr leise Spuren.',
    'hint' => $hint,
    'progress' => $normalized['progress'],
    'rules' => $normalized['rules'],
]);
?>
