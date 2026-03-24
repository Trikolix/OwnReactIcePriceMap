<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/seasonal_results.php';

$userId = intval($_GET['user_id'] ?? $_GET['nutzer_id'] ?? 0);
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id fehlt oder ungültig']);
    exit;
}

try {
    $archived = getArchivedCampaignResult($pdo, 'birthday_2026', $userId);
    if (!$archived) {
        http_response_code(404);
        echo json_encode(['error' => 'Kein archiviertes Geburtstags-Ergebnis gefunden']);
        exit;
    }

    $payload = decodeArchivedPayload($archived['payload_json'] ?? null);
    $payload['read_only'] = true;
    $payload['archived'] = true;
    $payload['archived_meta'] = [
        'campaign_id' => 'birthday_2026',
        'rank' => (int)$archived['rank_position'],
        'score' => (int)$archived['score'],
        'finalized_at' => $archived['finalized_at'],
    ];

    echo json_encode($payload);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
