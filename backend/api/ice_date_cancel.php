<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/ice_dates.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['status' => 'error', 'message' => 'Bitte verwende POST.']);
    exit;
}
ensureIceDateSchema($pdo);
$authData = requireAuth($pdo);
$payload = json_decode(file_get_contents('php://input'), true);
try {
    iceDateCancel($pdo, (int)$authData['user_id'], (int)($payload['ice_date_id'] ?? 0));
    echo json_encode(['status' => 'success']);
} catch (IceDateError $error) {
    http_response_code($error->getCode());
    echo json_encode(['status' => 'error', 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    error_log('Ice date cancellation failed: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Das Eis-Date konnte nicht abgesagt werden. Bitte versuche es erneut.']);
}
