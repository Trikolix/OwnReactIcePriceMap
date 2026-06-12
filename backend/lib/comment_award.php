<?php

function ensureKommentarUserAwardSupport(PDO $pdo): bool
{
    static $ensured = null;
    if ($ensured !== null) {
        return $ensured;
    }

    $columnExists = false;
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM kommentare LIKE 'user_award_id'");
        $columnExists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        error_log("Failed to inspect kommentare table: " . $e->getMessage());
        $ensured = false;
        return false;
    }

    if (!$columnExists) {
        try {
            $pdo->exec("ALTER TABLE kommentare ADD COLUMN user_award_id INT NULL DEFAULT NULL AFTER user_registration_id");
        } catch (Throwable $e) {
            error_log("Failed to add kommentare.user_award_id: " . $e->getMessage());
            $ensured = false;
            return false;
        }
    }

    try {
        $idxStmt = $pdo->query("SHOW INDEX FROM kommentare WHERE Key_name = 'idx_kommentare_user_award_id'");
        $hasIndex = (bool)$idxStmt->fetch(PDO::FETCH_ASSOC);
        if (!$hasIndex) {
            $pdo->exec("ALTER TABLE kommentare ADD INDEX idx_kommentare_user_award_id (user_award_id)");
        }
    } catch (Throwable $e) {
        error_log("Failed to ensure kommentare user award index: " . $e->getMessage());
    }

    $ensured = true;
    return true;
}

function ensureAwardCommentNotificationSupport(PDO $pdo): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }

    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM benachrichtigungen LIKE 'typ'");
        $column = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;
        $type = (string)($column['Type'] ?? '');
        if ($type && strpos($type, "'kommentar_award'") === false) {
            $pdo->exec("
                ALTER TABLE benachrichtigungen
                MODIFY COLUMN typ ENUM(
                    'kommentar',
                    'new_user',
                    'systemmeldung',
                    'kommentar_bewertung',
                    'checkin_mention',
                    'kommentar_route',
                    'kommentar_new_user',
                    'team_challenge',
                    'engagement',
                    'photo_challenge',
                    'kommentar_award',
                    'mention'
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
            ");
        }
    } catch (Throwable $e) {
        error_log("Failed to ensure benachrichtigungen.typ supports kommentar_award: " . $e->getMessage());
    }

    $ensured = true;
}
