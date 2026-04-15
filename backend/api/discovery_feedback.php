<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/external_shop_discovery.php';
require_once __DIR__ . '/../lib/feature_access.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

if (!featureAccessCanUse('external_discovery', $currentUserId)) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Die Discovery-Funktion ist aktuell nur für freigeschaltete Admin-Nutzer verfügbar.',
    ]);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true) ?: [];

$entryId = isset($payload['entry_id']) ? (int)$payload['entry_id'] : 0;
$feedbackType = trim((string)($payload['feedback_type'] ?? ''));
$note = isset($payload['note']) ? trim((string)$payload['note']) : null;

if ($entryId <= 0 || $feedbackType === '') {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'entry_id und feedback_type sind erforderlich.',
    ]);
    exit;
}

try {
    $result = externalShopRecordFeedback($pdo, $entryId, $currentUserId, $feedbackType, $note);
    echo json_encode([
        'status' => 'success',
        'entry' => $result['entry'] ?? null,
        'false_positive_count' => $result['false_positive_count'] ?? 0,
        'confirmed_valid_count' => $result['confirmed_valid_count'] ?? 0,
    ]);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Feedback konnte nicht gespeichert werden.',
    ]);
}
