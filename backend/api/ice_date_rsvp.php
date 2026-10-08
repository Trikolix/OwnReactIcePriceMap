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
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Antwort.']);
    exit;
}
try {
    $detail = iceDateRespond($pdo, (int)$authData['user_id'], $payload);
    echo json_encode(['status' => 'success', 'ice_date' => $detail]);
} catch (IceDateError $error) {
    http_response_code($error->getCode());
    echo json_encode(['status' => 'error', 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    error_log('Ice date RSVP failed: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Deine Antwort konnte nicht gespeichert werden. Bitte versuche es erneut.']);
}
