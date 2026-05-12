<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/summer_campaign.php';

header('Content-Type: application/json');

try {
    $auth = authenticateRequest($pdo);
    $userId = $auth ? (int)$auth['user_id'] : null;

    $progress = getSummerCampaignProgress($pdo, $userId, SUMMER_CAMPAIGN_ID);
    echo json_encode([
        'status' => 'success',
        'authenticated' => $userId !== null,
        ...$progress,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Sommeraktion konnte nicht geladen werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
?>
