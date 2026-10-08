<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/onboarding.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'POST') {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        recordOnboardingDeviceAction($pdo, $userId, (string)($body['action'] ?? ''));
    } elseif ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Methode nicht erlaubt.']);
        exit;
    }
    echo json_encode(['success' => true, 'data' => fetchOnboardingProgress($pdo, $userId)]);
} catch (InvalidArgumentException $error) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    error_log('Onboarding: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Dein Fortschritt konnte nicht geladen werden.']);
}
