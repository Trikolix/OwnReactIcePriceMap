<?php

require_once __DIR__ . '/notification_dispatcher.php';
require_once __DIR__ . '/opening_hours.php';

const ICE_DATE_CAPACITY = 8;

class IceDateError extends RuntimeException {}

function iceDateParseStart(string $value): ?DateTimeImmutable
{
    $date = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $value, new DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));
    return $date && $date->format('Y-m-d H:i:s') === $value ? $date : null;
}

function iceDateOpenAtStart(array $rows, array $shop, string $startsAt): ?bool
{
    $moment = iceDateParseStart($startsAt);
    if (!$moment) return null;
    $status = $shop['status'] ?? 'open';
    if ($status === 'permanent_closed') return false;
    $timezone = new DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE);
    $reopen = !empty($shop['reopening_date']) ? DateTimeImmutable::createFromFormat('!Y-m-d', $shop['reopening_date'], $timezone) : null;
    $close = !empty($shop['closing_date']) ? DateTimeImmutable::createFromFormat('!Y-m-d', $shop['closing_date'], $timezone) : null;
    if ($close && $reopen && $moment >= $close && $moment < $reopen) return false;
    if ($status === 'seasonal_closed' && (!$reopen || $moment < $reopen)) return false;
    if (!$rows) return null;
    return is_shop_open($rows, $moment, $status === 'seasonal_closed' ? 'open' : $status);
}

/** All attendance changes lock the parent date before inspecting its reservations. */
function iceDateRespond(PDO $pdo, int $userId, array $payload): array
{
    if ($userId <= 0) throw new IceDateError('Bitte logge dich ein.', 401);
    $dateId = (int)($payload['ice_date_id'] ?? 0);
    $token = trim((string)($payload['invite_token'] ?? ''));
    $status = (string)($payload['status'] ?? '');
    if (!in_array($status, ['going', 'maybe', 'declined'], true)) throw new IceDateError('Bitte wähle eine gültige Antwort.', 400);
    if ($dateId <= 0 && $token === '') throw new IceDateError('Eis-Date nicht gefunden.', 404);
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT id, creator_user_id, status, invite_token FROM ice_dates WHERE ' . ($dateId > 0 ? 'id = ?' : 'invite_token = ?') . ' FOR UPDATE');
        $stmt->execute([$dateId > 0 ? $dateId : $token]);
        $date = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$date || ($token !== '' && !hash_equals($date['invite_token'], $token))) throw new IceDateError('Einladung nicht gefunden oder nicht gültig.', 404);
        $dateId = (int)$date['id'];
        $stmt = $pdo->prepare('SELECT status FROM ice_date_participants WHERE date_id = ? AND user_id = ?');
        $stmt->execute([$dateId, $userId]);
        $previous = $stmt->fetchColumn();
        if ($previous === false && $token === '') throw new IceDateError('Für die Teilnahme benötigst du den Einladungslink.', 403);
        if ($date['status'] !== 'planned') throw new IceDateError('Dieses Eis-Date ist bereits abgeschlossen oder abgesagt.', 409);
        $organizerId = (int)$date['creator_user_id'];
        if ($status !== 'declined' && $userId !== $organizerId && ($previous === false || $previous === 'declined')) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM ice_date_participants WHERE date_id = ? AND user_id <> ? AND status <> 'declined'");
            $stmt->execute([$dateId, $organizerId]);
            if (1 + (int)$stmt->fetchColumn() >= ICE_DATE_CAPACITY) throw new IceDateError('Alle acht Plätze sind bereits reserviert.', 409);
        }
        $changed = $previous !== $status;
        if ($changed) {
            $stmt = $pdo->prepare("INSERT INTO ice_date_participants (date_id, user_id, role, status) VALUES (?, ?, 'participant', ?) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()");
            $stmt->execute([$dateId, $userId, $status]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    if ($changed && $userId !== $organizerId) {
        $stmt = $pdo->prepare('SELECT username FROM nutzer WHERE id = ?');
        $stmt->execute([$userId]);
        $username = (string)$stmt->fetchColumn();
        $message = match ($status) {
            'going' => 'für dein Eis-Date zugesagt',
            'maybe' => 'angegeben, vielleicht dabei zu sein',
            'declined' => 'für dein Eis-Date abgesagt',
        };
        // Attendance is committed even if an external delivery channel is unavailable.
        try { iceDateNotify($pdo, $organizerId, $dateId, "$username hat $message.", 'rsvp', $username); }
        catch (Throwable $error) { error_log('Ice date RSVP notification failed: ' . $error->getMessage()); }
    }
    return iceDateFetchDetail($pdo, $dateId, null, $userId);
}

function iceDateCancel(PDO $pdo, int $userId, int $dateId): void
{
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT creator_user_id, status FROM ice_dates WHERE id = ? FOR UPDATE');
        $stmt->execute([$dateId]);
        $date = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$date || (int)$date['creator_user_id'] !== $userId) throw new IceDateError('Nur die erstellende Person kann das Eis-Date absagen.', 403);
        if ($date['status'] !== 'planned') throw new IceDateError('Dieses Eis-Date ist bereits abgeschlossen oder abgesagt.', 409);
        $pdo->prepare("UPDATE ice_dates SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?")->execute([$dateId]);
        $stmt = $pdo->prepare("SELECT user_id FROM ice_date_participants WHERE date_id = ? AND user_id <> ? AND status <> 'declined'");
        $stmt->execute([$dateId, $userId]);
        $recipients = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    foreach ($recipients as $recipient) {
        try { iceDateNotify($pdo, (int)$recipient, $dateId, 'Ein Eis-Date wurde abgesagt.', 'cancelled'); }
        catch (Throwable $error) { error_log('Ice date cancellation notification failed: ' . $error->getMessage()); }
    }
}

function ensureIceDateSchema(PDO $pdo): void
{
    if (isset($GLOBALS['__ice_date_schema_initialized'])) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ice_dates (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            creator_user_id INT NOT NULL,
            shop_id INT NOT NULL,
            title VARCHAR(120) NULL DEFAULT NULL,
            note TEXT NULL,
            starts_at DATETIME NOT NULL,
            status ENUM('planned', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
            invite_token CHAR(64) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            completed_at DATETIME NULL DEFAULT NULL,
            cancelled_at DATETIME NULL DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_ice_dates_invite_token (invite_token),
            KEY idx_ice_dates_creator_status (creator_user_id, status, starts_at),
            KEY idx_ice_dates_shop_time (shop_id, starts_at),
            CONSTRAINT fk_ice_dates_creator FOREIGN KEY (creator_user_id) REFERENCES nutzer(id) ON DELETE CASCADE,
            CONSTRAINT fk_ice_dates_shop FOREIGN KEY (shop_id) REFERENCES eisdielen(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ice_date_participants (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            date_id INT UNSIGNED NOT NULL,
            user_id INT NOT NULL,
            role ENUM('organizer', 'participant') NOT NULL DEFAULT 'participant',
            status ENUM('invited', 'going', 'maybe', 'declined') NOT NULL DEFAULT 'invited',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_ice_date_participant (date_id, user_id),
            KEY idx_ice_date_participants_user (user_id, status),
            CONSTRAINT fk_ice_date_participants_date FOREIGN KEY (date_id) REFERENCES ice_dates(id) ON DELETE CASCADE,
            CONSTRAINT fk_ice_date_participants_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ice_date_checkins (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            date_id INT UNSIGNED NOT NULL,
            user_id INT NOT NULL,
            checkin_id INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_ice_date_checkin_user (date_id, user_id),
            UNIQUE KEY uniq_ice_date_checkin (date_id, checkin_id),
            KEY idx_ice_date_checkins_date (date_id),
            CONSTRAINT fk_ice_date_checkins_date FOREIGN KEY (date_id) REFERENCES ice_dates(id) ON DELETE CASCADE,
            CONSTRAINT fk_ice_date_checkins_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE,
            CONSTRAINT fk_ice_date_checkins_checkin FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $GLOBALS['__ice_date_schema_initialized'] = true;
}

function iceDateNormalizeStatus(string $status): string
{
    return in_array($status, ['going', 'maybe', 'declined'], true) ? $status : 'going';
}

function iceDateToken(): string
{
    return bin2hex(random_bytes(32));
}

function iceDateFetchDetail(PDO $pdo, int $dateId = 0, ?string $token = null, int $viewerId = 0): ?array
{
    $where = $dateId > 0 ? 'd.id = :date_id' : 'd.invite_token = :token';
    $params = $dateId > 0 ? ['date_id' => $dateId] : ['token' => (string)$token];
    $stmt = $pdo->prepare("
        SELECT d.id, d.creator_user_id, d.shop_id, d.title, d.note, d.starts_at, d.status,
               d.invite_token, d.created_at, d.completed_at,
               creator.username AS creator_username,
               shop.name AS shop_name, shop.adresse AS shop_address,
               shop.latitude AS shop_lat, shop.longitude AS shop_lon,
               shop.openingHours AS shop_opening_hours,
               shop.opening_hours_note AS shop_opening_hours_note,
               shop.status AS shop_status,
               shop.reopening_date AS shop_reopening_date,
               shop.closing_date AS shop_closing_date,
               (d.starts_at BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY)) AS checkin_window_open
        FROM ice_dates d
        JOIN nutzer creator ON creator.id = d.creator_user_id
        JOIN eisdielen shop ON shop.id = d.shop_id
        WHERE {$where}
        LIMIT 1
    ");
    $stmt->execute($params);
    $date = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$date) {
        return null;
    }

    $date['id'] = (int)$date['id'];
    $date['creator_user_id'] = (int)$date['creator_user_id'];
    $date['shop_id'] = (int)$date['shop_id'];
    $date['is_organizer'] = $viewerId > 0 && $date['creator_user_id'] === $viewerId;

    $openingRows = fetch_opening_hours_rows($pdo, $date['shop_id']);
    $openingNote = $date['shop_opening_hours_note'] ?? null;
    if (empty($openingRows) && !empty($date['shop_opening_hours'])) {
        $parsed = parse_legacy_opening_hours($date['shop_opening_hours']);
        $openingRows = $parsed['rows'];
        if ($openingNote === null && $parsed['note']) {
            $openingNote = $parsed['note'];
        }
    }
    $date['shop_opening_hours_structured'] = build_structured_opening_hours($openingRows, $openingNote);
    $date['shop_opening_hours_note'] = $openingNote;
    $date['shop_is_open_now'] = is_shop_open($openingRows, null, $date['shop_status'] ?? null);
    $date['shop_is_open_at_start'] = iceDateOpenAtStart($openingRows, [
        'status' => $date['shop_status'], 'reopening_date' => $date['shop_reopening_date'], 'closing_date' => $date['shop_closing_date'],
    ], $date['starts_at']);

    if ($viewerId > 0 && !$date['is_organizer'] && $dateId > 0) {
        $access = $pdo->prepare('SELECT 1 FROM ice_date_participants WHERE date_id = :date_id AND user_id = :user_id LIMIT 1');
        $access->execute(['date_id' => $date['id'], 'user_id' => $viewerId]);
        if (!$access->fetchColumn()) {
            return null;
        }
    }

    // Some installations have no avatar table yet. Reading details must not run DDL
    // inside the transaction that records a check-in.
    $hasAvatars = (bool)$pdo->query("SHOW TABLES LIKE 'user_profile_images'")->fetchColumn();
    $avatarColumn = $hasAvatars ? 'avatar.avatar_path' : 'NULL';
    $avatarJoin = $hasAvatars ? 'LEFT JOIN user_profile_images avatar ON avatar.user_id = p.user_id' : '';
    $participants = $pdo->prepare("
        SELECT p.user_id, p.role, p.status, p.created_at, p.updated_at, u.username, $avatarColumn AS avatar_url
        FROM ice_date_participants p
        JOIN nutzer u ON u.id = p.user_id
        $avatarJoin
        WHERE p.date_id = :date_id
        ORDER BY p.role = 'organizer' DESC, p.created_at ASC
    ");
    $participants->execute(['date_id' => $date['id']]);
    $date['participants'] = array_map(static function (array $participant): array {
        $participant['user_id'] = (int)$participant['user_id'];
        return $participant;
    }, $participants->fetchAll(PDO::FETCH_ASSOC));

    $checkins = $pdo->prepare("
        SELECT c.user_id, c.checkin_id, c.created_at, u.username
        FROM ice_date_checkins c
        JOIN nutzer u ON u.id = c.user_id
        WHERE c.date_id = :date_id
        ORDER BY c.created_at ASC
    ");
    $checkins->execute(['date_id' => $date['id']]);
    $date['checkins'] = array_map(static function (array $checkin): array {
        $checkin['user_id'] = (int)$checkin['user_id'];
        $checkin['checkin_id'] = (int)$checkin['checkin_id'];
        return $checkin;
    }, $checkins->fetchAll(PDO::FETCH_ASSOC));
    $date['going_count'] = count(array_filter($date['participants'], static function (array $participant): bool {
        return $participant['status'] === 'going';
    }));
    $date['checkin_count'] = count($date['checkins']);
    $date['capacity'] = ICE_DATE_CAPACITY;
    $date['reserved_count'] = 1 + count(array_filter($date['participants'], static function (array $participant) use ($date): bool {
        return $participant['user_id'] !== $date['creator_user_id'] && $participant['status'] !== 'declined';
    }));
    $date['free_places'] = max(0, ICE_DATE_CAPACITY - $date['reserved_count']);
    $date['viewer_status'] = null;
    foreach ($date['participants'] as $participant) {
        if ($viewerId > 0 && $participant['user_id'] === $viewerId) {
            $date['viewer_status'] = $participant['status'];
            break;
        }
    }
    $date['checkin_window_open'] = (bool)$date['checkin_window_open'];
    $date['can_checkin'] = $date['status'] === 'planned' && $date['viewer_status'] === 'going' && $date['checkin_window_open'];

    return $date;
}

function iceDateNotify(PDO $pdo, int $recipientId, int $dateId, string $text, string $action, string $senderName = ''): void
{
    createNotification(
        $pdo,
        $recipientId,
        'ice_date',
        $dateId,
        $text,
        ['ice_date_id' => $dateId, 'action' => $action],
        $senderName !== '' ? [
            'email' => [
                'type' => 'ice_date',
                'senderName' => $senderName,
                'extra' => ['iceDateId' => $dateId, 'skipRateLimit' => true],
            ],
        ] : []
    );
}

function iceDateRecordCheckin(PDO $pdo, int $userId, int $shopId, int $checkinId): ?array
{
    $stmt = $pdo->prepare("
        SELECT d.id, d.creator_user_id, d.shop_id, d.starts_at, d.status
        FROM ice_dates d
        JOIN ice_date_participants p ON p.date_id = d.id AND p.user_id = :user_id AND p.status = 'going'
        WHERE d.shop_id = :shop_id
          AND d.status = 'planned'
          AND d.starts_at BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY)
        ORDER BY ABS(TIMESTAMPDIFF(MINUTE, d.starts_at, NOW())) ASC
        LIMIT 1
    ");
    $stmt->execute(['user_id' => $userId, 'shop_id' => $shopId]);
    $date = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$date) {
        return null;
    }

    $insert = $pdo->prepare("INSERT IGNORE INTO ice_date_checkins (date_id, user_id, checkin_id) VALUES (:date_id, :user_id, :checkin_id)");
    $insert->execute(['date_id' => $date['id'], 'user_id' => $userId, 'checkin_id' => $checkinId]);

    $checkins = $pdo->prepare('SELECT user_id, checkin_id FROM ice_date_checkins WHERE date_id = :date_id ORDER BY created_at ASC');
    $checkins->execute(['date_id' => $date['id']]);
    $checkinRows = $checkins->fetchAll(PDO::FETCH_ASSOC);
    if (count($checkinRows) >= 2) {
        $update = $pdo->prepare("UPDATE ice_dates SET status = 'completed', completed_at = NOW() WHERE id = :date_id AND status = 'planned'");
        $update->execute(['date_id' => $date['id']]);
        if (function_exists('resolveOrMergeCheckinGroup')) {
            resolveOrMergeCheckinGroup($pdo, array_column($checkinRows, 'checkin_id'));
        }
    }

    return iceDateFetchDetail($pdo, (int)$date['id'], null, $userId);
}
