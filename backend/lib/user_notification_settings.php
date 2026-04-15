<?php

function ensureUserNotificationSettingsSchema(PDO $pdo): void
{
    static $initialized = false;
    if ($initialized) {
        return;
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM user_notification_settings LIKE 'notify_team_challenge'");
    $column = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;
    if (!$column) {
        $pdo->exec("
            ALTER TABLE user_notification_settings
            ADD COLUMN notify_team_challenge TINYINT(1) DEFAULT 1
            AFTER notify_news
        ");
    }

    $initialized = true;
}
