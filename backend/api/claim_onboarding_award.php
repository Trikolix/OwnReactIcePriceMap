<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/onboarding.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$auth = requireAuth($pdo);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Methode nicht erlaubt.']);
    exit;
}
$body = json_decode(file_get_contents('php://input'), true) ?: [];
try {
    $userId = (int)$auth['user_id'];
    $claim = claimOnboardingAward($pdo, $userId, (int)($body['level'] ?? 0));
    $awards = $claim['awards'];
    $levelChange = $claim['level_change'];
    echo json_encode(['success' => true, 'new_awards' => $awards,
        'level_up' => $levelChange['level_up'] ?? false, 'new_level' => $levelChange['new_level'] ?? null,
        'data' => fetchOnboardingProgress($pdo, $userId)]);
} catch (InvalidArgumentException $error) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    error_log('Onboarding award: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Die Auszeichnung konnte nicht vergeben werden.']);
}
