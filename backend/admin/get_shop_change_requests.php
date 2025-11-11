<?php
require_once __DIR__ . '/../db_connect.php';

header('Content-Type: application/json; charset=utf-8');

$allowedStatuses = ['pending', 'approved', 'rejected', 'all'];
$status = isset($_GET['status']) ? strtolower(trim($_GET['status'])) : 'pending';
if (!in_array($status, $allowedStatuses, true)) {
    $status = 'pending';
}

$sql = "SELECT 
            ecr.*,
            e.name AS shop_name,
            e.adresse AS shop_address,
            e.status AS shop_status,
            e.openingHours AS shop_opening_hours,
            e.website AS shop_website,
            e.reopening_date AS shop_reopening_date,
            n.username AS requester_name,
            n.email AS requester_email
        FROM eisdiele_change_requests ecr
        JOIN eisdielen e ON ecr.eisdiele_id = e.id
        JOIN nutzer n ON ecr.requested_by = n.id";
$params = [];

if ($status !== 'all') {
    $sql .= " WHERE ecr.status = :status";
    $params[':status'] = $status;
}
$sql .= " ORDER BY ecr.created_at ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

$response = array_map(function ($row) {
    $payload = json_decode($row['payload'], true);
    $changes = [];
    if (is_array($payload) && isset($payload['changes']) && is_array($payload['changes'])) {
        $changes = $payload['changes'];
    }

    return [
        'id' => (int)$row['id'],
        'eisdiele_id' => (int)$row['eisdiele_id'],
        'requested_by' => (int)$row['requested_by'],
        'shop_name' => $row['shop_name'],
        'shop_address' => $row['shop_address'],
        'shop_status' => $row['shop_status'],
        'shop_opening_hours' => $row['shop_opening_hours'],
        'shop_website' => $row['shop_website'],
        'shop_reopening_date' => $row['shop_reopening_date'],
        'requester_name' => $row['requester_name'],
        'requester_email' => $row['requester_email'],
        'status' => $row['status'],
        'created_at' => $row['created_at'],
        'decided_at' => $row['decided_at'],
        'decided_by' => $row['decided_by'] ? (int)$row['decided_by'] : null,
        'changes' => $changes
    ];
}, $requests);

echo json_encode(['requests' => $response], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
