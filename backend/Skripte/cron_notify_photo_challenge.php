<?php
/**
 * cron_notify_photo_challenge.php
 *
 * Runs periodically to check for photo challenges that started within the last 24 hours.
 * Notifies all eligible users to participate.
 */

if (PHP_SAPI !== 'cli') {
    die("This script can only be run from the command line.");
}

// Since this is in backend/Skripte/, include paths need to go one level up
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/notification_dispatcher.php';
require_once __DIR__ . '/../lib/user_notification_settings.php';

ensureUserNotificationSettingsSchema($pdo);

try {
    // 1. Find photo challenges that started recently (e.g. within the last 24h)
    // Status can be 'group_running' or 'ko_running'
    $stmtChallenges = $pdo->prepare("
        SELECT id, title, start_at
        FROM photo_challenges pc
        WHERE start_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          AND start_at <= NOW()
          AND status IN ('group_running', 'ko_running')
          AND NOT EXISTS (
              SELECT 1 FROM benachrichtigungen b
              WHERE b.typ = 'photo_challenge' AND b.referenz_id = pc.id
          )
    ");
    $stmtChallenges->execute();
    $recentChallenges = $stmtChallenges->fetchAll(PDO::FETCH_ASSOC);

    if (empty($recentChallenges)) {
        echo "Keine neuen Foto-Challenges in den letzten 24h gestartet.\n";
        exit(0);
    }

    // Prepare to find users who want notifications for photo challenges
    // We only want to notify users who have the email or push setting enabled.
    // However, createNotification checks the settings internally again, so we just need
    // to filter basic engagement or verify the user still exists.
    $stmtUsers = $pdo->prepare("
        SELECT n.id
        FROM nutzer n
        LEFT JOIN user_notification_settings s ON n.id = s.user_id
        WHERE (s.notify_photo_challenge = 1 OR s.notify_photo_challenge_push = 1)
          OR s.id IS NULL
    ");

    $stmtUsers->execute();
    $users = $stmtUsers->fetchAll(PDO::FETCH_COLUMN);

    if (empty($users)) {
        echo "Keine passenden Nutzer für Benachrichtigungen gefunden.\n";
        exit(0);
    }

    $notificationsSent = 0;

    foreach ($recentChallenges as $challenge) {
        $challengeId = (int)$challenge['id'];
        $title = $challenge['title'];

        $text = "Eine neue Foto-Challenge ist gestartet: '{$title}'! Mache jetzt mit oder stimme für deine Favoriten ab.";

        foreach ($users as $userId) {
            // Use createNotification to handle the actual delivery check and insertion
            createNotification(
                $pdo,
                (int)$userId,
                'photo_challenge',
                $challengeId,
                $text,
                [], // extra data json
                [
                    'email' => [
                        'type' => 'photo_challenge',
                        'senderName' => 'Ice App',
                        'extra' => [
                            'challengeId' => $challengeId,
                        ]
                    ]
                ]
            );
            $notificationsSent++;
        }
    }

    echo "Foto-Challenge Benachrichtigungen gesendet: $notificationsSent\n";

} catch (Exception $e) {
    echo "Fehler beim Ausführen des Cronjobs: " . $e->getMessage() . "\n";
    exit(1);
}
