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

    $stmt = $pdo->query("SHOW COLUMNS FROM user_notification_settings LIKE 'push_enabled_web'");
    $column = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;
    if (!$column) {
        $pdo->exec("
            ALTER TABLE user_notification_settings
            ADD COLUMN push_enabled_web TINYINT(1) DEFAULT 0
            AFTER notify_team_challenge
        ");
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM user_notification_settings LIKE 'push_enabled_android'");
    $column = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;
    if (!$column) {
        $pdo->exec("
            ALTER TABLE user_notification_settings
            ADD COLUMN push_enabled_android TINYINT(1) DEFAULT 0
            AFTER push_enabled_web
        ");
    }

    $initialized = true;
}
