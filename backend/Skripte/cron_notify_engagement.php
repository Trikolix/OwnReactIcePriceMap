<?php
/**
 * cron_notify_engagement.php
 *
 * Runs periodically to notify users who haven't been active for 14 days and have no pending team challenges.
 */

if (PHP_SAPI !== 'cli') {
    die("This script can only be run from the command line.");
}

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/notification_dispatcher.php';
require_once __DIR__ . '/../lib/user_notification_settings.php';

ensureUserNotificationSettingsSchema($pdo);

// Ensure the last_engagement_notification_at column exists on nutzer table
try {
    $stmt = $pdo->query("SHOW COLUMNS FROM nutzer LIKE 'last_engagement_notification_at'");
    if (!($stmt && $stmt->fetch(PDO::FETCH_ASSOC))) {
        $pdo->exec("ALTER TABLE nutzer ADD COLUMN last_engagement_notification_at TIMESTAMP NULL DEFAULT NULL AFTER last_notification_email_at");
    }
} catch (Exception $e) {
    echo "Fehler bei Schema-Aktualisierung (nutzer.last_engagement_notification_at): " . $e->getMessage() . "\n";
    exit(1);
}

try {
    // Find users whose last activity was > 14 days ago, and haven't received an engagement notification in the last 30 days
    // Also skip users who have active team challenges
    $stmtUsers = $pdo->prepare("
        SELECT n.id
        FROM nutzer n
        LEFT JOIN user_notification_settings s ON n.id = s.user_id
        WHERE n.last_active_at < DATE_SUB(NOW(), INTERVAL 14 DAY)
          AND (n.last_engagement_notification_at IS NULL OR n.last_engagement_notification_at < DATE_SUB(NOW(), INTERVAL 30 DAY))
          AND (s.notify_news = 1 OR s.notify_news_push = 1)
          AND NOT EXISTS (
              SELECT 1 FROM team_challenges tc
              WHERE (tc.inviter_user_id = n.id OR tc.invitee_user_id = n.id)
                AND tc.status IN ('pending_acceptance', 'accepted', 'proposal_open', 'proposal_submitted', 'shop_finalized')
          )
    ");

    $stmtUsers->execute();
    $users = $stmtUsers->fetchAll(PDO::FETCH_COLUMN);

    if (empty($users)) {
        echo "Keine Nutzer für Engagement-Benachrichtigungen gefunden.\n";
        exit(0);
    }

    $notificationsSent = 0;
    $text = "Zeit für ein Eis! Starte eine neue Challenge oder Check-in in deiner Lieblings-Eisdiele.";

    $stmtUpdateNutzer = $pdo->prepare("UPDATE nutzer SET last_engagement_notification_at = NOW() WHERE id = :id");

    foreach ($users as $userId) {
        $userId = (int)$userId;
        createNotification(
            $pdo,
            $userId,
            'engagement',
            0,
            $text,
            [],
            [
                'email' => [
                    'type' => 'engagement',
                    'senderName' => 'Ice App',
                    'extra' => []
                ]
            ]
        );
        $stmtUpdateNutzer->execute(['id' => $userId]);
        $notificationsSent++;
    }

    echo "Engagement Benachrichtigungen gesendet: $notificationsSent\n";

} catch (Exception $e) {
    echo "Fehler beim Ausführen des Cronjobs: " . $e->getMessage() . "\n";
    exit(1);
}
