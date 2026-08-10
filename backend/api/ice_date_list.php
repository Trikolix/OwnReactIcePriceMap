<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/ice_dates.php';

ensureIceDateSchema($pdo);
$authData = requireAuth($pdo);
$userId = (int)$authData['user_id'];

$stmt = $pdo->prepare("SELECT d.id FROM ice_dates d JOIN ice_date_participants p ON p.date_id = d.id AND p.user_id = :user_id WHERE d.status <> 'cancelled' ORDER BY d.starts_at DESC LIMIT 50");
$stmt->execute(['user_id' => $userId]);
$dates = [];
foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $dateId) {
    $detail = iceDateFetchDetail($pdo, (int)$dateId, null, $userId);
    if ($detail) $dates[] = $detail;
}
echo json_encode(['status' => 'success', 'ice_dates' => $dates]);
