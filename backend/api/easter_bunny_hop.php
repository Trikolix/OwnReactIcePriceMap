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
        'message' => 'Die Osterhasenjagd ist aktuell nicht aktiv.',
    ]);
    exit;
}

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
$context = getEasterMapContextFromRequest();
$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false, $context);
$row = $normalized['row'];
$history = $normalized['path'];
$progress = $normalized['progress'];

if (!empty($progress['completed'])) {
    echo json_encode([
        'success' => true,
        'phase' => $phase,
        'message' => 'Die Osterhasenwerkstatt wurde bereits gefunden.',
        'progress' => $progress,
        'rules' => $normalized['rules'],
        'achievements' => [],
    ]);
    exit;
}

if (empty($progress['current_target'])) {
    echo json_encode([
        'success' => false,
        'phase' => $phase,
        'message' => 'Der Hase zeigt sich gerade nicht in deiner Naehe. Zoome naeher heran und streife etwas durch die Karte.',
        'progress' => $progress,
        'rules' => $normalized['rules'],
        'achievements' => [],
    ]);
    exit;
}

$currentTarget = $progress['current_target'];
$origin = [
    'lat' => (float)$currentTarget['lat'],
    'lng' => (float)$currentTarget['lng'],
];
$fallbackShops = loadFallbackCandidatePool($pdo, $origin, 42);
$selection = chooseNextBunnyLocation(
    $currentTarget,
    $context['visible_shops'] ?? [],
    $context['nearby_shops'] ?? [],
    $fallbackShops,
    $history
);

if (!$selection || empty($selection['target'])) {
    echo json_encode([
        'success' => false,
        'phase' => $phase,
        'message' => 'Heute war der Hase besonders geschickt. Versuch es nach einem kleinen Kartenschwenk noch einmal.',
        'progress' => $progress,
        'rules' => $normalized['rules'],
        'achievements' => [],
    ]);
    exit;
}

$nextTarget = $selection['target'];
$direction = $selection['direction'];
$nextHopCount = ((int)($row['hop_count'] ?? 0)) + 1;
$updatedHistory = appendEasterHistory($history, $nextTarget);

$stmt = $pdo->prepare(
    "UPDATE easter_bunny_progress
     SET current_location_json = :current_location_json,
         path_json = :path_json,
         current_index = :current_index,
         hop_count = :hop_count
     WHERE user_id = :user_id"
);
$stmt->execute([
    'current_location_json' => encodeJsonValue($nextTarget),
    'path_json' => encodeJsonValue($updatedHistory),
    'current_index' => $nextHopCount,
    'hop_count' => $nextHopCount,
    'user_id' => $userId,
]);

$normalized = normalizeEasterProgressRow($pdo, $userId, $config, false, $context);
$foundHints = (int)($normalized['progress']['total_hints_found'] ?? 0);
$encounterType = random_int(1, 100) <= getWorkshopHintChanceForHopCount($nextHopCount) ? 'workshop' : 'direction';

if ($encounterType === 'workshop') {
    $stmt = $pdo->prepare(
        "UPDATE easter_bunny_progress
         SET workshop_hint_claims = workshop_hint_claims + 1
         WHERE user_id = :user_id"
    );
    $stmt->execute([
        'user_id' => $userId,
    ]);

    $normalized = normalizeEasterProgressRow($pdo, $userId, $config, false, $context);
    $foundHints = (int)($normalized['progress']['total_hints_found'] ?? ($foundHints + 1));
}

$hint = $encounterType === 'direction'
    ? buildHopDirectionHint($direction, $userId . '|hop|' . $nextHopCount . '|direction')
    : buildWorkshopHint($foundHints, $userId . '|hop|' . $nextHopCount . '|workshop');
$message = $hint['text'] ?? 'Der Osterhase war schneller.';

echo json_encode([
    'success' => true,
    'phase' => $phase,
    'encounter_type' => $encounterType,
    'direction' => $direction,
    'message' => $message,
    'hint' => $hint,
    'progress' => $normalized['progress'],
    'rules' => $normalized['rules'],
    'achievements' => [],
]);
?>
