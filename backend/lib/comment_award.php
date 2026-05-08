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
