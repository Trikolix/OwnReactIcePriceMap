<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

function event2026_ensure_schema(PDO $pdo): void
{
    static $initialized = false;
    if ($initialized) {
        return;
    }

    $sql = [
        "CREATE TABLE IF NOT EXISTS event2026_seasons (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(64) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            event_date DATE DEFAULT NULL,
            status ENUM('draft','open','closed','cancelled','confirmed') NOT NULL DEFAULT 'open',
            max_participants INT NOT NULL DEFAULT 150,
            min_participants_for_go INT NOT NULL DEFAULT 60,
            cancellation_deadline DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_legal_versions (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            version VARCHAR(32) NOT NULL,
            content_md TEXT NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_legal_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_legal_version (event_id, version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_registrations (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            registered_by_user_id INT DEFAULT NULL,
            team_name VARCHAR(255) DEFAULT NULL,
            payment_reference_code VARCHAR(64) NOT NULL,
            payment_status ENUM('pending','partially_paid','paid','cancelled') NOT NULL DEFAULT 'pending',
            notes VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_reg_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_payment_ref (payment_reference_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_participant_slots (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            registration_id INT NOT NULL,
            event_id INT NOT NULL,
            user_id INT DEFAULT NULL,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            distance_km INT NOT NULL,
            pace_group VARCHAR(32) NOT NULL,
            women_wave_opt_in TINYINT(1) NOT NULL DEFAULT 0,
            public_name_consent TINYINT(1) NOT NULL DEFAULT 1,
            jersey_interest TINYINT(1) NOT NULL DEFAULT 0,
            jersey_size VARCHAR(10) DEFAULT NULL,
            license_status ENUM('pending_payment','licensed','cancelled') NOT NULL DEFAULT 'pending_payment',
            legal_version_id INT NOT NULL,
            legal_accepted_at DATETIME NOT NULL,
            legal_ip_hash VARCHAR(128) DEFAULT NULL,
            legal_user_agent_hash VARCHAR(128) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_slot_reg FOREIGN KEY (registration_id) REFERENCES event2026_registrations(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_slot_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_slot_legal FOREIGN KEY (legal_version_id) REFERENCES event2026_legal_versions(id),
            KEY idx_event2026_slot_event_license (event_id, license_status),
            KEY idx_event2026_slot_user (event_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_legal_acceptances (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            slot_id INT NOT NULL,
            legal_version_id INT NOT NULL,
            accepted_at DATETIME NOT NULL,
            ip_hash VARCHAR(128) DEFAULT NULL,
            user_agent_hash VARCHAR(128) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_accept_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_accept_legal FOREIGN KEY (legal_version_id) REFERENCES event2026_legal_versions(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_invite_tokens (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            slot_id INT NOT NULL,
            token_hash VARCHAR(128) NOT NULL,
            expires_at DATETIME NOT NULL,
            claimed_at DATETIME DEFAULT NULL,
            revoked_at DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_invite_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_invite_hash (token_hash),
            KEY idx_event2026_invite_slot (slot_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_payments (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            registration_id INT NOT NULL,
            method ENUM('paypal_friends','bank_transfer') NOT NULL DEFAULT 'paypal_friends',
            expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            status ENUM('pending','partially_paid','paid','cancelled') NOT NULL DEFAULT 'pending',
            confirmed_by_admin INT DEFAULT NULL,
            confirmed_at DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_payment_reg FOREIGN KEY (registration_id) REFERENCES event2026_registrations(id) ON DELETE CASCADE,
            KEY idx_event2026_payment_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_payment_mail_matches (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            payment_id INT DEFAULT NULL,
            registration_id INT DEFAULT NULL,
            mail_message_id VARCHAR(255) NOT NULL,
            sender VARCHAR(255) DEFAULT NULL,
            subject VARCHAR(255) DEFAULT NULL,
            amount_detected DECIMAL(10,2) DEFAULT NULL,
            reference_detected VARCHAR(64) DEFAULT NULL,
            confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
            status ENUM('suggested','approved','rejected') NOT NULL DEFAULT 'suggested',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_mailmatch_payment FOREIGN KEY (payment_id) REFERENCES event2026_payments(id) ON DELETE SET NULL,
            CONSTRAINT fk_event2026_mailmatch_registration FOREIGN KEY (registration_id) REFERENCES event2026_registrations(id) ON DELETE SET NULL,
            UNIQUE KEY uniq_event2026_mail_message (mail_message_id),
            KEY idx_event2026_mailmatch_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_waves (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            distance_km INT NOT NULL,
            wave_code VARCHAR(32) NOT NULL,
            start_time DATETIME DEFAULT NULL,
            capacity INT NOT NULL DEFAULT 20,
            is_women_wave TINYINT(1) NOT NULL DEFAULT 0,
            pace_group VARCHAR(32) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_wave_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_wave_code (event_id, wave_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_wave_assignments (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            slot_id INT NOT NULL,
            wave_id INT NOT NULL,
            assigned_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_wave_assign_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_wave_assign_wave FOREIGN KEY (wave_id) REFERENCES event2026_waves(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_wave_slot (slot_id),
            KEY idx_event2026_wave_assign_wave (wave_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_checkpoints (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            shop_id INT DEFAULT NULL,
            name VARCHAR(255) NOT NULL,
            lat DECIMAL(10,7) NOT NULL,
            lng DECIMAL(10,7) NOT NULL,
            order_index INT NOT NULL DEFAULT 0,
            is_mandatory TINYINT(1) NOT NULL DEFAULT 1,
            min_distance_km INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_checkpoint_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            KEY idx_event2026_checkpoint_order (event_id, order_index)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_checkpoint_passages (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            checkpoint_id INT NOT NULL,
            slot_id INT NOT NULL,
            user_id INT NOT NULL,
            passed_at DATETIME NOT NULL,
            source ENUM('qr','onsite_form') NOT NULL,
            checkin_id INT DEFAULT NULL,
            qr_payload VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_passage_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_passage_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES event2026_checkpoints(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_passage_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_passage (event_id, checkpoint_id, slot_id),
            KEY idx_event2026_passage_checkpoint (checkpoint_id, passed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_audit_log (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            actor_user_id INT DEFAULT NULL,
            action VARCHAR(64) NOT NULL,
            target_type VARCHAR(64) DEFAULT NULL,
            target_id INT DEFAULT NULL,
            meta_json JSON DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_audit_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            KEY idx_event2026_audit_action (action, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ];

    foreach ($sql as $statement) {
        $pdo->exec($statement);
    }

    // Backfill for existing installs (without relying on ADD COLUMN IF NOT EXISTS support).
    $columnExistsStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_participant_slots'
          AND COLUMN_NAME = 'public_name_consent'
    ");
    $columnExistsStmt->execute();
    if ((int) $columnExistsStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_participant_slots ADD COLUMN public_name_consent TINYINT(1) NOT NULL DEFAULT 1 AFTER women_wave_opt_in");
    }

    $checkpointMinDistanceColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_checkpoints'
          AND COLUMN_NAME = 'min_distance_km'
    ");
    $checkpointMinDistanceColStmt->execute();
    if ((int) $checkpointMinDistanceColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_checkpoints ADD COLUMN min_distance_km INT NOT NULL DEFAULT 0 AFTER is_mandatory");
    }

    $pdo->exec("INSERT INTO event2026_seasons (slug, name, event_date, status, max_participants, min_participants_for_go, cancellation_deadline)
        SELECT 'event-2026', 'Eis-Tour 2026', '2026-05-16', 'open', 150, 60, '2026-05-01 23:59:59'
        WHERE NOT EXISTS (SELECT 1 FROM event2026_seasons WHERE slug = 'event-2026')");

    $eventIdStmt = $pdo->prepare("SELECT id FROM event2026_seasons WHERE slug = 'event-2026' LIMIT 1");
    $eventIdStmt->execute();
    $eventId = (int) ($eventIdStmt->fetchColumn() ?: 0);

    if ($eventId > 0) {
        $defaultLegal = "## Teilnahmebedingungen Eis-Tour 2026\n\n- Teilnahme auf eigene Gefahr und eigene Kosten.\n- Es gilt die StVO.\n- Dies ist kein Rennen und keine Zeitfahrveranstaltung.\n- Maximal 150 Teilnehmer.\n- Bei zu geringer Teilnehmerzahl behalten wir uns eine Absage vor.";

        $legalStmt = $pdo->prepare("INSERT INTO event2026_legal_versions (event_id, version, content_md, is_active)
            SELECT :event_id, '2026.1', :content_md, 1
            WHERE NOT EXISTS (
                SELECT 1 FROM event2026_legal_versions WHERE event_id = :event_id2 AND version = '2026.1'
            )");
        $legalStmt->execute([
            ':event_id' => $eventId,
            ':event_id2' => $eventId,
            ':content_md' => $defaultLegal,
        ]);

        $targetCheckpointShops = event2026_checkpoint_shop_config();
        $shopIds = array_keys($targetCheckpointShops);
        $shopIdsSql = implode(',', array_map('intval', $shopIds));

        // Keep checkpoint scope aligned with requested event checkpoints.
        $pdo->prepare("DELETE FROM event2026_checkpoints WHERE event_id = :event_id AND (shop_id IS NULL OR shop_id NOT IN ({$shopIdsSql}))")
            ->execute([':event_id' => $eventId]);

        $shopStmt = $pdo->prepare("SELECT id, name, latitude, longitude FROM eisdielen WHERE id = :id LIMIT 1");
        $checkpointStmt = $pdo->prepare("INSERT INTO event2026_checkpoints (event_id, shop_id, name, lat, lng, order_index, is_mandatory, min_distance_km)
            SELECT :event_id, :shop_id, :name, :lat, :lng, :order_index, 1, :min_distance_km
            WHERE NOT EXISTS (
                SELECT 1 FROM event2026_checkpoints WHERE event_id = :event_id2 AND shop_id = :shop_id2
            )");
        $checkpointUpdateStmt = $pdo->prepare("UPDATE event2026_checkpoints
            SET name = :name,
                lat = :lat,
                lng = :lng,
                order_index = :order_index,
                is_mandatory = 1,
                min_distance_km = :min_distance_km
            WHERE event_id = :event_id AND shop_id = :shop_id");

        foreach ($targetCheckpointShops as $shopId => $config) {
            $shopStmt->execute([':id' => $shopId]);
            $shop = $shopStmt->fetch(PDO::FETCH_ASSOC);
            if (!$shop) {
                continue;
            }
            $order = (int) ($config['order'] ?? 0);
            $minDistanceKm = (int) ($config['min_distance_km'] ?? 0);
            $checkpointStmt->execute([
                ':event_id' => $eventId,
                ':event_id2' => $eventId,
                ':shop_id' => $shopId,
                ':shop_id2' => $shopId,
                ':name' => (string) $shop['name'],
                ':lat' => (float) $shop['latitude'],
                ':lng' => (float) $shop['longitude'],
                ':order_index' => $order,
                ':min_distance_km' => $minDistanceKm,
            ]);
            $checkpointUpdateStmt->execute([
                ':event_id' => $eventId,
                ':shop_id' => $shopId,
                ':name' => (string) $shop['name'],
                ':lat' => (float) $shop['latitude'],
                ':lng' => (float) $shop['longitude'],
                ':order_index' => $order,
                ':min_distance_km' => $minDistanceKm,
            ]);
        }
    }

    $initialized = true;
}

function event2026_current_event(PDO $pdo, bool $forUpdate = false): array
{
    $lockClause = $forUpdate ? " FOR UPDATE" : "";
    $stmt = $pdo->prepare("SELECT * FROM event2026_seasons WHERE slug = 'event-2026' LIMIT 1{$lockClause}");
    $stmt->execute();
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$event) {
        throw new RuntimeException('Event 2026 konnte nicht geladen werden.');
    }
    return $event;
}

function event2026_checkpoint_shop_config(): array
{
    return [
        314 => ['order' => 1, 'min_distance_km' => 140], // Bäckerei Bräunig
        145 => ['order' => 2, 'min_distance_km' => 140], // Eisdiele Schöne
        111 => ['order' => 3, 'min_distance_km' => 140], // Klatt-Eismanufaktur
        22  => ['order' => 4, 'min_distance_km' => 175], // Eiscafé Elisenhof
    ];
}

function event2026_checkpoint_shop_ids(): array
{
    return array_keys(event2026_checkpoint_shop_config());
}

function event2026_active_legal(PDO $pdo, int $eventId): array
{
    $stmt = $pdo->prepare("SELECT * FROM event2026_legal_versions WHERE event_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1");
    $stmt->execute([$eventId]);
    $legal = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$legal) {
        throw new RuntimeException('Aktive Rechtstext-Version fehlt.');
    }
    return $legal;
}

function event2026_reserved_count(PDO $pdo, int $eventId): int
{
    $sql = "SELECT COUNT(*)
        FROM event2026_participant_slots
        WHERE event_id = :event_id
          AND (
            license_status = 'licensed'
            OR (
              license_status = 'pending_payment'
              AND created_at >= (NOW() - INTERVAL 72 HOUR)
            )
          )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':event_id' => $eventId]);
    return (int) $stmt->fetchColumn();
}

function event2026_hash_nullable(?string $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    return hash('sha256', $value);
}

function event2026_json_input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new InvalidArgumentException('Ungültige JSON Daten.');
    }
    return $data;
}

function event2026_require_auth_user(PDO $pdo): array
{
    $authData = requireAuth($pdo);
    return [
        'user_id' => (int) $authData['user_id'],
        'username' => (string) $authData['username'],
    ];
}

function event2026_fetch_user_email(PDO $pdo, int $userId): ?string
{
    $stmt = $pdo->prepare("SELECT email FROM nutzer WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $userId]);
    $email = $stmt->fetchColumn();
    if (!is_string($email) || $email === '') {
        return null;
    }
    return $email;
}

function event2026_require_admin(PDO $pdo): array
{
    $auth = event2026_require_auth_user($pdo);
    if ($auth['user_id'] !== 1) {
        http_response_code(403);
        throw new RuntimeException('Nur Admin erlaubt.');
    }
    return $auth;
}

function event2026_create_invite_token(PDO $pdo, int $slotId, int $days = 30): array
{
    $raw = bin2hex(random_bytes(24));
    $hash = hash('sha256', $raw);
    $expiresAt = (new DateTimeImmutable('now'))->modify('+' . $days . ' days')->format('Y-m-d H:i:s');

    $stmt = $pdo->prepare("INSERT INTO event2026_invite_tokens (slot_id, token_hash, expires_at) VALUES (:slot_id, :token_hash, :expires_at)");
    $stmt->execute([
        ':slot_id' => $slotId,
        ':token_hash' => $hash,
        ':expires_at' => $expiresAt,
    ]);

    return [
        'token' => $raw,
        'expires_at' => $expiresAt,
    ];
}

function event2026_get_slot_for_user(PDO $pdo, int $eventId, int $userId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM event2026_participant_slots WHERE event_id = :event_id AND user_id = :user_id LIMIT 1");
    $stmt->execute([':event_id' => $eventId, ':user_id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function event2026_log_action(PDO $pdo, int $eventId, ?int $actorUserId, string $action, ?string $targetType = null, ?int $targetId = null, ?array $meta = null): void
{
    $stmt = $pdo->prepare("INSERT INTO event2026_audit_log (event_id, actor_user_id, action, target_type, target_id, meta_json)
        VALUES (:event_id, :actor_user_id, :action, :target_type, :target_id, :meta_json)");
    $stmt->execute([
        ':event_id' => $eventId,
        ':actor_user_id' => $actorUserId,
        ':action' => $action,
        ':target_type' => $targetType,
        ':target_id' => $targetId,
        ':meta_json' => $meta ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null,
    ]);
}

function event2026_recompute_waves(PDO $pdo, int $eventId, int $capacity = 20, int $womenWaveMinSize = 10): array
{
    $slotsStmt = $pdo->prepare("SELECT id, distance_km, pace_group, women_wave_opt_in
        FROM event2026_participant_slots
        WHERE event_id = :event_id AND license_status = 'licensed'
        ORDER BY distance_km ASC, pace_group ASC, id ASC");
    $slotsStmt->execute([':event_id' => $eventId]);
    $slots = $slotsStmt->fetchAll(PDO::FETCH_ASSOC);

    $pdo->prepare("DELETE wa FROM event2026_wave_assignments wa
        INNER JOIN event2026_participant_slots s ON s.id = wa.slot_id
        WHERE s.event_id = :event_id")->execute([':event_id' => $eventId]);

    $pdo->prepare("DELETE FROM event2026_waves WHERE event_id = :event_id")->execute([':event_id' => $eventId]);

    if (!$slots) {
        return ['waves_created' => 0, 'assignments_created' => 0];
    }

    $groups = [];
    foreach ($slots as $slot) {
        $distance = (int) $slot['distance_km'];
        $pace = (string) $slot['pace_group'];
        $optIn = (int) $slot['women_wave_opt_in'] === 1;
        $key = $distance . '|' . $pace;
        if (!isset($groups[$key])) {
            $groups[$key] = ['distance' => $distance, 'pace' => $pace, 'women' => [], 'normal' => []];
        }
        if ($optIn) {
            $groups[$key]['women'][] = $slot;
        } else {
            $groups[$key]['normal'][] = $slot;
        }
    }

    $waveInsert = $pdo->prepare("INSERT INTO event2026_waves (event_id, distance_km, wave_code, start_time, capacity, is_women_wave, pace_group)
        VALUES (:event_id, :distance_km, :wave_code, NULL, :capacity, :is_women_wave, :pace_group)");
    $assignInsert = $pdo->prepare("INSERT INTO event2026_wave_assignments (slot_id, wave_id, assigned_at) VALUES (:slot_id, :wave_id, NOW())");

    $waveCount = 0;
    $assignmentCount = 0;

    foreach ($groups as $group) {
        $distance = $group['distance'];
        $pace = $group['pace'];

        $normalPool = $group['normal'];
        $womenPool = $group['women'];

        if (count($womenPool) < $womenWaveMinSize) {
            $normalPool = array_merge($normalPool, $womenPool);
            $womenPool = [];
        }

        $buckets = [];
        if ($womenPool) {
            $buckets[] = ['is_women' => 1, 'slots' => $womenPool];
        }
        if ($normalPool) {
            $buckets[] = ['is_women' => 0, 'slots' => $normalPool];
        }

        foreach ($buckets as $bucket) {
            $chunks = array_chunk($bucket['slots'], $capacity);
            foreach ($chunks as $index => $chunk) {
                $waveCode = sprintf(
                    '%d-%s-%s-%02d',
                    $distance,
                    $pace,
                    $bucket['is_women'] ? 'W' : 'M',
                    $index + 1
                );

                $waveInsert->execute([
                    ':event_id' => $eventId,
                    ':distance_km' => $distance,
                    ':wave_code' => $waveCode,
                    ':capacity' => $capacity,
                    ':is_women_wave' => $bucket['is_women'],
                    ':pace_group' => $pace,
                ]);
                $waveId = (int) $pdo->lastInsertId();
                $waveCount++;

                foreach ($chunk as $slot) {
                    $assignInsert->execute([
                        ':slot_id' => (int) $slot['id'],
                        ':wave_id' => $waveId,
                    ]);
                    $assignmentCount++;
                }
            }
        }
    }

    return ['waves_created' => $waveCount, 'assignments_created' => $assignmentCount];
}
