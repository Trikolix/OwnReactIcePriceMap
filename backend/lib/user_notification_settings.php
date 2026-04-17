<?php

function ensureUserNotificationSettingsSchema(PDO $pdo): void
{
    if (isset($GLOBALS['__user_notification_settings_schema_initialized'])) {
        return;
    }
    $GLOBALS['__user_notification_settings_schema_initialized'] = true;

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


    $columns = [
        'notify_checkin_mention_push' => 'TINYINT(1) DEFAULT 1 AFTER notify_team_challenge',
        'notify_comment_push' => 'TINYINT(1) DEFAULT 1 AFTER notify_checkin_mention_push',
        'notify_comment_participated_push' => 'TINYINT(1) DEFAULT 1 AFTER notify_comment_push',
        'notify_news_push' => 'TINYINT(1) DEFAULT 0 AFTER notify_comment_participated_push',
        'notify_team_challenge_push' => 'TINYINT(1) DEFAULT 1 AFTER notify_news_push',
        'notify_photo_challenge' => 'TINYINT(1) DEFAULT 1 AFTER notify_team_challenge_push',
        'notify_photo_challenge_push' => 'TINYINT(1) DEFAULT 1 AFTER notify_photo_challenge',
    ];

    foreach ($columns as $column_name => $column_def) {
        $stmt = $pdo->query("SHOW COLUMNS FROM user_notification_settings LIKE '$column_name'");
        if (!($stmt && $stmt->fetch(PDO::FETCH_ASSOC))) {
            $pdo->exec("ALTER TABLE user_notification_settings ADD COLUMN $column_name $column_def");
        }
    }

    $initialized = true;
}
