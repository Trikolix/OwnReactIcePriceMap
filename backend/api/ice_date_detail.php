<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/ice_dates.php';
require_once __DIR__ . '/../lib/auth.php';

ensureIceDateSchema($pdo);
$token = trim((string)($_GET['token'] ?? ''));
$dateId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$viewerId = 0;
if ($dateId > 0) {
    $authData = requireAuth($pdo);
    $viewerId = (int)$authData['user_id'];
} else {
    $authData = authenticateRequest($pdo);
    $viewerId = $authData ? (int)$authData['user_id'] : 0;
}

$detail = iceDateFetchDetail($pdo, $dateId, $token !== '' ? $token : null, $viewerId);
if (!$detail) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Eis-Date nicht gefunden oder nicht zugänglich.']);
    exit;
}
echo json_encode(['status' => 'success', 'ice_date' => $detail]);
