<?php
require_once '../db_connect.php';
header('Content-Type: application/json');

// POST: user_id, notify_checkin_mention, notify_comment
$data = json_decode(file_get_contents('php://input'), true);
$user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
$notify_checkin_mention = isset($data['notify_checkin_mention']) ? intval($data['notify_checkin_mention']) : 1;
$notify_comment = isset($data['notify_comment']) ? intval($data['notify_comment']) : 1;

if ($user_id <= 0) {
    echo json_encode(['error' => 'Ungültige Nutzer-ID']);
    exit;
}

// Prüfe, ob Settings existieren

$sql = "SELECT id FROM user_notification_settings WHERE user_id = :user_id";
$stmt = $pdo->prepare($sql);
$stmt->execute(['user_id' => $user_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    // Update
    $sql = "UPDATE user_notification_settings SET notify_checkin_mention = :mention, notify_comment = :comment, updated_at = NOW() WHERE user_id = :user_id";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        'mention' => $notify_checkin_mention,
        'comment' => $notify_comment,
        'user_id' => $user_id
    ]);
} else {
    // Insert
    $sql = "INSERT INTO user_notification_settings (user_id, notify_checkin_mention, notify_comment) VALUES (:user_id, :mention, :comment)";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        'user_id' => $user_id,
        'mention' => $notify_checkin_mention,
        'comment' => $notify_comment
    ]);
}

if ($success) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'Speichern fehlgeschlagen']);
}
?>
