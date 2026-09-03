<?php

require_once __DIR__ . '/notification_dispatcher.php';
require_once __DIR__ . '/tour_de_glace.php';
require_once __DIR__ . '/../evaluators/TourDeGlaceAwardEvaluator.php';

function getLikeEntityTypes(): array
{
    return ['checkin', 'bewertung', 'route', 'kommentar', 'user_registration', 'user_award'];
}

function isValidLikeEntityType(string $entityType): bool
{
    return in_array($entityType, getLikeEntityTypes(), true);
}

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
            entity_type ENUM('checkin', 'bewertung', 'route', 'kommentar', 'user_registration', 'user_award') NOT NULL,
            entity_id INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_like (user_id, entity_type, entity_id),
            FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    try {
        $pdo->exec("
            ALTER TABLE likes
            MODIFY entity_type ENUM('checkin', 'bewertung', 'route', 'kommentar', 'user_registration', 'user_award') NOT NULL
        ");
    } catch (Throwable $e) {
        error_log("Failed to ensure likes.entity_type supports all entities: " . $e->getMessage());
    }
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

function buildLikeStateKey(string $entityType, int $entityId): string
{
    return $entityType . ':' . $entityId;
}

function getLikeStatesForEntities(PDO $pdo, array $entities, ?int $userId = null): array
{
    ensureLikesSchema($pdo);

    $grouped = [];
    foreach ($entities as $entity) {
        $entityType = (string)($entity['entity_type'] ?? '');
        $entityId = (int)($entity['entity_id'] ?? 0);
        if (!isValidLikeEntityType($entityType) || $entityId <= 0) {
            continue;
        }
        $grouped[$entityType][$entityId] = $entityId;
    }

    if (empty($grouped)) {
        return [];
    }

    $states = [];
    $whereParts = [];
    $params = [];
    foreach ($grouped as $entityType => $ids) {
        foreach ($ids as $entityId) {
            $states[buildLikeStateKey($entityType, (int)$entityId)] = [
                'likes_count' => 0,
                'has_liked' => false,
            ];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $whereParts[] = "(entity_type = ? AND entity_id IN ({$placeholders}))";
        $params[] = $entityType;
        foreach ($ids as $entityId) {
            $params[] = (int)$entityId;
        }
    }

    $stmt = $pdo->prepare("
        SELECT entity_type, entity_id, COUNT(*) AS likes_count
        FROM likes
        WHERE " . implode(' OR ', $whereParts) . "
        GROUP BY entity_type, entity_id
    ");
    $stmt->execute($params);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $key = buildLikeStateKey((string)$row['entity_type'], (int)$row['entity_id']);
        if (isset($states[$key])) {
            $states[$key]['likes_count'] = (int)$row['likes_count'];
        }
    }

    if ($userId) {
        $likedParams = array_merge([$userId], $params);
        $stmtLiked = $pdo->prepare("
            SELECT entity_type, entity_id
            FROM likes
            WHERE user_id = ? AND (" . implode(' OR ', $whereParts) . ")
        ");
        $stmtLiked->execute($likedParams);
        foreach ($stmtLiked->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $key = buildLikeStateKey((string)$row['entity_type'], (int)$row['entity_id']);
            if (isset($states[$key])) {
                $states[$key]['has_liked'] = true;
            }
        }
    }

    return $states;
}

function addLike(PDO $pdo, int $userId, string $entityType, int $entityId): bool {
    ensureLikesSchema($pdo);
    try {
        $stmt = $pdo->prepare("INSERT IGNORE INTO likes (user_id, entity_type, entity_id) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $entityType, $entityId]);

        if ($stmt->rowCount() > 0) {
            $likeId = (int)$pdo->lastInsertId();
            if ($likeId > 0) {
                recordTourDeGlaceLike($pdo, $userId, $likeId, [
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                ]);
                try {
                    (new TourDeGlaceAwardEvaluator())->evaluate($userId);
                } catch (Exception $e) {
                    error_log("Fehler beim Evaluator: TourDeGlaceAwardEvaluator - " . $e->getMessage());
                }
            }
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
        case 'user_registration':
            $stmt = $pdo->prepare("SELECT id FROM nutzer WHERE id = ?");
            break;
        case 'user_award':
            $stmt = $pdo->prepare("SELECT user_id FROM user_awards WHERE id = ?");
            break;
    }
    if ($stmt) {
        $stmt->execute([$entityId]);
        $ownerId = $stmt->fetchColumn();
        return $ownerId ? (int)$ownerId : null;
    }
    return null;
}

function getLikeNotificationExtraData(PDO $pdo, string $entityType, int $entityId, int $likerId): array {
    $extraData = [
        'entity_type' => $entityType,
        'entity_id' => $entityId,
        'liker_id' => $likerId
    ];

    switch ($entityType) {
        case 'checkin':
            $stmt = $pdo->prepare("SELECT id AS checkin_id, eisdiele_id FROM checkins WHERE id = ?");
            $stmt->execute([$entityId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $extraData['checkin_id'] = (int)$row['checkin_id'];
                $extraData['eisdiele_id'] = (int)$row['eisdiele_id'];
            }
            break;
        case 'bewertung':
            $stmt = $pdo->prepare("SELECT id AS bewertung_id, eisdiele_id FROM bewertungen WHERE id = ?");
            $stmt->execute([$entityId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $extraData['bewertung_id'] = (int)$row['bewertung_id'];
                $extraData['eisdiele_id'] = (int)$row['eisdiele_id'];
            }
            break;
        case 'route':
            $stmt = $pdo->prepare("SELECT id AS route_id, nutzer_id AS route_autor_id FROM routen WHERE id = ?");
            $stmt->execute([$entityId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $extraData['route_id'] = (int)$row['route_id'];
                $extraData['route_autor_id'] = (int)$row['route_autor_id'];
            }
            break;
        case 'kommentar':
            $stmt = $pdo->prepare("
                SELECT k.id AS kommentar_id,
                       k.checkin_id,
                       k.bewertung_id,
                       k.route_id,
                       k.user_registration_id,
                       k.user_award_id,
                       c.eisdiele_id AS checkin_eisdiele_id,
                       b.eisdiele_id AS bewertung_eisdiele_id,
                       r.nutzer_id AS route_autor_id
                FROM kommentare k
                LEFT JOIN checkins c ON c.id = k.checkin_id
                LEFT JOIN bewertungen b ON b.id = k.bewertung_id
                LEFT JOIN routen r ON r.id = k.route_id
                WHERE k.id = ?
            ");
            $stmt->execute([$entityId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $extraData['kommentar_id'] = (int)$row['kommentar_id'];
                if (!empty($row['checkin_id'])) {
                    $extraData['checkin_id'] = (int)$row['checkin_id'];
                    $extraData['eisdiele_id'] = (int)$row['checkin_eisdiele_id'];
                } elseif (!empty($row['bewertung_id'])) {
                    $extraData['bewertung_id'] = (int)$row['bewertung_id'];
                    $extraData['eisdiele_id'] = (int)$row['bewertung_eisdiele_id'];
                } elseif (!empty($row['route_id'])) {
                    $extraData['route_id'] = (int)$row['route_id'];
                    $extraData['route_autor_id'] = (int)$row['route_autor_id'];
                } elseif (!empty($row['user_registration_id'])) {
                    $extraData['user_registration_id'] = (int)$row['user_registration_id'];
                } elseif (!empty($row['user_award_id'])) {
                    $extraData['user_award_id'] = (int)$row['user_award_id'];
                }
            }
            break;
        case 'user_registration':
            $extraData['user_registration_id'] = $entityId;
            break;
        case 'user_award':
            $extraData['user_award_id'] = $entityId;
            break;
    }

    return $extraData;
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
        'checkin' => 'dein Checkin',
        'bewertung' => 'deine Bewertung',
        'route' => 'deine Route',
        'kommentar' => 'dein Kommentar',
        'user_registration' => 'dein Profil-Feed-Eintrag',
        'user_award' => 'dein Award'
    ];
    $itemName = $itemNames[$entityType] ?? 'dein Beitrag';

    if ($totalLikes === 1) {
        $firstLiker = $likers[0];
        $text = sprintf("%s gefällt %s.", $firstLiker, $itemName);
    } elseif ($totalLikes === 2) {
        $firstLiker = $likers[0];
        $text = sprintf("%s und 1 weitere Person gefällt %s.", $firstLiker, $itemName);
    } else {
        $firstLiker = $likers[0];
        $othersCount = $totalLikes - 1;
        $text = sprintf("%s und %d weitere Personen gefällt %s.", $firstLiker, $othersCount, $itemName);
    }

    // Check for existing notification
    $stmt = $pdo->prepare("
        SELECT id FROM benachrichtigungen
        WHERE empfaenger_id = ? AND typ = 'like' AND referenz_id = ?
        AND JSON_EXTRACT(zusatzdaten, '$.entity_type') = ?
    ");
    $stmt->execute([$ownerId, $entityId, $entityType]);
    $existingId = $stmt->fetchColumn();

    $extraData = getLikeNotificationExtraData($pdo, $entityType, $entityId, $likerId);
    $extraData['actor_user_id'] = (int)$likerId;

    if ($existingId) {
        $stmt = $pdo->prepare("
            UPDATE benachrichtigungen
            SET text = ?, ist_gelesen = 0, erstellt_am = CURRENT_TIMESTAMP, zusatzdaten = ?
            WHERE id = ?
        ");
        $stmt->execute([$text, json_encode($extraData), $existingId]);
        $notificationId = (int)$existingId;

        $notification = fetchNotificationById($pdo, $notificationId);
        if ($notification) {
            dispatchNotification($pdo, $notification);
        }
    } else {
        createNotification($pdo, $ownerId, 'like', $entityId, $text, $extraData);
    }
}
