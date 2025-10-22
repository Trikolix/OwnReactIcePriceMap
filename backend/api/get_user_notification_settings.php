<?php
require_once '../db_connect.php';
header('Content-Type: application/json');

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
if ($user_id <= 0) {
    echo json_encode(['error' => 'Ungültige Nutzer-ID']);
    exit;
}


$sql = "SELECT notify_checkin_mention, notify_comment FROM user_notification_settings WHERE user_id = :user_id";
$stmt = $pdo->prepare($sql);
$stmt->execute(['user_id' => $user_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    echo json_encode($row);
} else {
    // Default-Werte, falls keine Settings existieren
    echo json_encode([
        'notify_checkin_mention' => 1,
        'notify_comment' => 1
    ]);
}
?>
