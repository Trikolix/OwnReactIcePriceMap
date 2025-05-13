<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/checkin.php';

$checkinId = $_GET['checkin_id'] ?? null;

echo json_encode(getCheckinById($pdo, $checkinId));
?>
