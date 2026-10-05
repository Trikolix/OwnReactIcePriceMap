<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/summer_campaign_results.php';

header('Content-Type: application/json; charset=utf-8');

try {
    echo json_encode([
        'status' => 'success',
        ...getSummerCampaignResults($pdo),
    ], JSON_UNESCAPED_UNICODE);
} catch (DomainException $e) {
    http_response_code(409);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('Sommer-Auswertung: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Die Sommer-Auswertung konnte nicht geladen werden.',
    ], JSON_UNESCAPED_UNICODE);
}
