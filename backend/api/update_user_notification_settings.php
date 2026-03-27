<?php
require_once '../db_connect.php';
require_once '../lib/user_notification_settings.php';
header('Content-Type: application/json');

ensureUserNotificationSettingsSchema($pdo);

// POST: user_id, notify_checkin_mention, notify_comment
$data = json_decode(file_get_contents('php://input'), true);
$user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;

$notify_checkin_mention = isset($data['notify_checkin_mention']) ? intval($data['notify_checkin_mention']) : 1;
$notify_comment = isset($data['notify_comment']) ? intval($data['notify_comment']) : 1;
$notify_comment_participated = isset($data['notify_comment_participated']) ? intval($data['notify_comment_participated']) : 1;
$notify_news = isset($data['notify_news']) ? intval($data['notify_news']) : 0;
$notify_team_challenge = isset($data['notify_team_challenge']) ? intval($data['notify_team_challenge']) : 1;

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
    $sql = "UPDATE user_notification_settings SET notify_checkin_mention = :mention, notify_comment = :comment, notify_comment_participated = :comment_participated, notify_news = :news, notify_team_challenge = :team_challenge, updated_at = NOW() WHERE user_id = :user_id";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        'mention' => $notify_checkin_mention,
        'comment' => $notify_comment,
        'comment_participated' => $notify_comment_participated,
        'news' => $notify_news,
        'team_challenge' => $notify_team_challenge,
        'user_id' => $user_id
    ]);
} else {
    // Insert
    $sql = "INSERT INTO user_notification_settings (user_id, notify_checkin_mention, notify_comment, notify_comment_participated, notify_news, notify_team_challenge) VALUES (:user_id, :mention, :comment, :comment_participated, :news, :team_challenge)";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        'user_id' => $user_id,
        'mention' => $notify_checkin_mention,
        'comment' => $notify_comment,
        'comment_participated' => $notify_comment_participated,
        'news' => $notify_news,
        'team_challenge' => $notify_team_challenge
    ]);
}

if ($success) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'Speichern fehlgeschlagen']);
}
?>
