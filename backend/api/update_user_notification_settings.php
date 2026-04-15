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
$notify_checkin_mention_push = isset($data['notify_checkin_mention_push']) ? intval($data['notify_checkin_mention_push']) : 1;
$notify_comment_push = isset($data['notify_comment_push']) ? intval($data['notify_comment_push']) : 1;
$notify_comment_participated_push = isset($data['notify_comment_participated_push']) ? intval($data['notify_comment_participated_push']) : 1;
$notify_news_push = isset($data['notify_news_push']) ? intval($data['notify_news_push']) : 0;
$notify_team_challenge_push = isset($data['notify_team_challenge_push']) ? intval($data['notify_team_challenge_push']) : 1;
$notify_photo_challenge = isset($data['notify_photo_challenge']) ? intval($data['notify_photo_challenge']) : 1;
$notify_photo_challenge_push = isset($data['notify_photo_challenge_push']) ? intval($data['notify_photo_challenge_push']) : 1;
$push_enabled_web = isset($data['push_enabled_web']) ? intval($data['push_enabled_web']) : 0;
$push_enabled_android = isset($data['push_enabled_android']) ? intval($data['push_enabled_android']) : 0;

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
    $sql = "UPDATE user_notification_settings SET notify_checkin_mention = :mention, notify_comment = :comment, notify_comment_participated = :comment_participated, notify_news = :news, notify_team_challenge = :team_challenge, notify_checkin_mention_push = :mention_push, notify_comment_push = :comment_push, notify_comment_participated_push = :comment_participated_push, notify_news_push = :news_push, notify_team_challenge_push = :team_challenge_push, notify_photo_challenge = :photo_challenge, notify_photo_challenge_push = :photo_challenge_push, push_enabled_web = :push_enabled_web, push_enabled_android = :push_enabled_android, updated_at = NOW() WHERE user_id = :user_id";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        'mention' => $notify_checkin_mention,
        'comment' => $notify_comment,
        'comment_participated' => $notify_comment_participated,
        'news' => $notify_news,
        'team_challenge' => $notify_team_challenge,
        'mention_push' => $notify_checkin_mention_push,
        'comment_push' => $notify_comment_push,
        'comment_participated_push' => $notify_comment_participated_push,
        'news_push' => $notify_news_push,
        'team_challenge_push' => $notify_team_challenge_push,
        'photo_challenge' => $notify_photo_challenge,
        'photo_challenge_push' => $notify_photo_challenge_push,
        'push_enabled_web' => $push_enabled_web,
        'push_enabled_android' => $push_enabled_android,
        'user_id' => $user_id
    ]);
} else {
    // Insert
    $sql = "INSERT INTO user_notification_settings (user_id, notify_checkin_mention, notify_comment, notify_comment_participated, notify_news, notify_team_challenge, notify_checkin_mention_push, notify_comment_push, notify_comment_participated_push, notify_news_push, notify_team_challenge_push, notify_photo_challenge, notify_photo_challenge_push, push_enabled_web, push_enabled_android) VALUES (:user_id, :mention, :comment, :comment_participated, :news, :team_challenge, :mention_push, :comment_push, :comment_participated_push, :news_push, :team_challenge_push, :photo_challenge, :photo_challenge_push, :push_enabled_web, :push_enabled_android)";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        'user_id' => $user_id,
        'mention' => $notify_checkin_mention,
        'comment' => $notify_comment,
        'comment_participated' => $notify_comment_participated,
        'news' => $notify_news,
        'team_challenge' => $notify_team_challenge,
        'mention_push' => $notify_checkin_mention_push,
        'comment_push' => $notify_comment_push,
        'comment_participated_push' => $notify_comment_participated_push,
        'news_push' => $notify_news_push,
        'team_challenge_push' => $notify_team_challenge_push,
        'photo_challenge' => $notify_photo_challenge,
        'photo_challenge_push' => $notify_photo_challenge_push,
        'push_enabled_web' => $push_enabled_web,
        'push_enabled_android' => $push_enabled_android,
    ]);
}

if ($success) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'Speichern fehlgeschlagen']);
}
?>
