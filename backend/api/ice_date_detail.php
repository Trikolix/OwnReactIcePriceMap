<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/ice_dates.php';

ensureIceDateSchema($pdo);
$token = trim((string)($_GET['token'] ?? ''));
$dateId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$viewerId = 0;
if ($dateId > 0) {
    require_once __DIR__ . '/../lib/auth.php';
    $authData = requireAuth($pdo);
    $viewerId = (int)$authData['user_id'];
}

$detail = iceDateFetchDetail($pdo, $dateId, $token !== '' ? $token : null, $viewerId);
if (!$detail) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Eis-Date nicht gefunden oder nicht zugänglich.']);
    exit;
}
echo json_encode(['status' => 'success', 'ice_date' => $detail]);
