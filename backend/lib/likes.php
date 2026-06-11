<?php

require_once __DIR__ . '/notification_dispatcher.php';

function ensureLikesSchema(PDO $pdo): void
{
    if (isset($GLOBALS['__likes_schema_initialized'])) {
        return;
    }
    $GLOBALS['__likes_schema_initialized'] = true;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            entity_type ENUM('checkin', 'bewertung', 'route', 'kommentar') NOT NULL,
            entity_id INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_like (user_id, entity_type, entity_id),
            FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");
}

function getLikesCount(PDO $pdo, string $entityType, int $entityId): int {
    ensureLikesSchema($pdo);
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM likes WHERE entity_type = ? AND entity_id = ?");
    $stmt->execute([$entityType, $entityId]);
    return (int)$stmt->fetchColumn();
}

function hasUserLiked(PDO $pdo, int $userId, string $entityType, int $entityId): bool {
    ensureLikesSchema($pdo);
    $stmt = $pdo->prepare("SELECT 1 FROM likes WHERE user_id = ? AND entity_type = ? AND entity_id = ? LIMIT 1");
    $stmt->execute([$userId, $entityType, $entityId]);
    return (bool)$stmt->fetchColumn();
}

function addLike(PDO $pdo, int $userId, string $entityType, int $entityId): bool {
    ensureLikesSchema($pdo);
    try {
        $stmt = $pdo->prepare("INSERT IGNORE INTO likes (user_id, entity_type, entity_id) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $entityType, $entityId]);

        if ($stmt->rowCount() > 0) {
            dispatchLikeNotification($pdo, $userId, $entityType, $entityId);
            return true;
        }
        return false;
    } catch (PDOException $e) {
        return false;
    }
}

function getEntityOwner(PDO $pdo, string $entityType, int $entityId): ?int {
    $stmt = null;
    switch ($entityType) {
        case 'checkin':
            $stmt = $pdo->prepare("SELECT nutzer_id FROM checkins WHERE id = ?");
            break;
        case 'bewertung':
            $stmt = $pdo->prepare("SELECT nutzer_id FROM bewertungen WHERE id = ?");
            break;
        case 'route':
            $stmt = $pdo->prepare("SELECT nutzer_id FROM routen WHERE id = ?");
            break;
        case 'kommentar':
            $stmt = $pdo->prepare("SELECT nutzer_id FROM kommentare WHERE id = ?");
            break;
    }
    if ($stmt) {
        $stmt->execute([$entityId]);
        $ownerId = $stmt->fetchColumn();
        return $ownerId ? (int)$ownerId : null;
    }
    return null;
}

function dispatchLikeNotification(PDO $pdo, int $likerId, string $entityType, int $entityId): void {
    $ownerId = getEntityOwner($pdo, $entityType, $entityId);

    // Don't notify if user liked their own item
    if (!$ownerId || $ownerId === $likerId) {
        return;
    }

    $stmt = $pdo->prepare("SELECT username FROM nutzer WHERE id = ?");
    $stmt->execute([$likerId]);
    $likerName = $stmt->fetchColumn() ?: 'Ein Nutzer';

    $stmt = $pdo->prepare("
        SELECT u.username
        FROM likes l
        JOIN nutzer u ON l.user_id = u.id
        WHERE l.entity_type = ? AND l.entity_id = ?
        ORDER BY l.created_at ASC
    ");
    $stmt->execute([$entityType, $entityId]);
    $likers = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $totalLikes = count($likers);
    if ($totalLikes === 0) return; // Should not happen, we just inserted one

    $itemNames = [
        'checkin' => 'Check-in',
        'bewertung' => 'Bewertung',
        'route' => 'Route',
        'kommentar' => 'Kommentar'
    ];
    $itemName = $itemNames[$entityType] ?? 'Beitrag';

    if ($totalLikes === 1) {
        $firstLiker = $likers[0];
        $text = sprintf("%s gefällt dein(e) %s.", $firstLiker, $itemName);
    } elseif ($totalLikes === 2) {
        $firstLiker = $likers[0];
        $text = sprintf("%s und 1 weitere Person gefällt dein(e) %s.", $firstLiker, $itemName);
    } else {
        $firstLiker = $likers[0];
        $othersCount = $totalLikes - 1;
        $text = sprintf("%s und %d weitere Personen gefällt dein(e) %s.", $firstLiker, $othersCount, $itemName);
    }

    // Check for existing notification
    $stmt = $pdo->prepare("
        SELECT id FROM benachrichtigungen
        WHERE empfaenger_id = ? AND typ = 'like' AND referenz_id = ?
        AND JSON_EXTRACT(zusatzdaten, '$.entity_type') = ?
    ");
    $stmt->execute([$ownerId, $entityId, $entityType]);
    $existingId = $stmt->fetchColumn();

    $extraData = [
        'entity_type' => $entityType,
        'entity_id' => $entityId,
        'liker_id' => $likerId
    ];

    if ($existingId) {
        $stmt = $pdo->prepare("
            UPDATE benachrichtigungen
            SET text = ?, ist_gelesen = 0, erstellt_am = CURRENT_TIMESTAMP, zusatzdaten = ?
            WHERE id = ?
        ");
        $stmt->execute([$text, json_encode($extraData), $existingId]);
        $notificationId = (int)$existingId;
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, ist_gelesen, zusatzdaten)
            VALUES (?, 'like', ?, ?, 0, ?)
        ");
        $stmt->execute([$ownerId, $entityId, $text, json_encode($extraData)]);
        $notificationId = (int)$pdo->lastInsertId();
    }

    $notification = fetchNotificationById($pdo, $notificationId);
    if ($notification) {
        dispatchPushNotification($pdo, $ownerId, $notification);
    }
}
