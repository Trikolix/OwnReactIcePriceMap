<?php

function ensureTeamChallengeSchema(PDO $pdo): void
{
    static $initialized = false;
    if ($initialized) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS team_challenges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            inviter_user_id INT NOT NULL,
            invitee_user_id INT NOT NULL,
            type ENUM('daily', 'weekly') NOT NULL DEFAULT 'weekly',
            status ENUM('pending_acceptance', 'accepted', 'proposal_open', 'proposal_submitted', 'shop_finalized', 'completed', 'expired', 'cancelled', 'failed_no_shops') NOT NULL DEFAULT 'pending_acceptance',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            accepted_at DATETIME NULL DEFAULT NULL,
            proposal_deadline DATETIME NULL DEFAULT NULL,
            final_shop_id INT NULL DEFAULT NULL,
            finalized_at DATETIME NULL DEFAULT NULL,
            valid_until DATETIME NULL DEFAULT NULL,
            center_lat DECIMAL(10, 7) NULL DEFAULT NULL,
            center_lon DECIMAL(10, 7) NULL DEFAULT NULL,
            radius_m INT NULL DEFAULT NULL,
            completion_window_minutes INT NOT NULL DEFAULT 90,
            completed_at DATETIME NULL DEFAULT NULL,
            failed_reason VARCHAR(64) NULL DEFAULT NULL,
            created_by_user_id INT NOT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_team_challenges_inviter (inviter_user_id, status),
            KEY idx_team_challenges_invitee (invitee_user_id, status),
            KEY idx_team_challenges_status (status),
            CONSTRAINT fk_team_challenges_inviter FOREIGN KEY (inviter_user_id) REFERENCES nutzer(id) ON DELETE CASCADE,
            CONSTRAINT fk_team_challenges_invitee FOREIGN KEY (invitee_user_id) REFERENCES nutzer(id) ON DELETE CASCADE,
            CONSTRAINT fk_team_challenges_shop FOREIGN KEY (final_shop_id) REFERENCES eisdielen(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS team_challenge_locations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_challenge_id INT NOT NULL,
            user_id INT NOT NULL,
            lat DECIMAL(10, 7) NOT NULL,
            lon DECIMAL(10, 7) NOT NULL,
            captured_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_team_challenge_location (team_challenge_id, user_id),
            CONSTRAINT fk_team_challenge_locations_challenge FOREIGN KEY (team_challenge_id) REFERENCES team_challenges(id) ON DELETE CASCADE,
            CONSTRAINT fk_team_challenge_locations_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS team_challenge_candidates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_challenge_id INT NOT NULL,
            shop_id INT NOT NULL,
            distance_to_center DECIMAL(10, 2) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_team_challenge_candidate (team_challenge_id, shop_id),
            KEY idx_team_challenge_candidate_challenge (team_challenge_id),
            CONSTRAINT fk_team_challenge_candidates_challenge FOREIGN KEY (team_challenge_id) REFERENCES team_challenges(id) ON DELETE CASCADE,
            CONSTRAINT fk_team_challenge_candidates_shop FOREIGN KEY (shop_id) REFERENCES eisdielen(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS team_challenge_proposals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_challenge_id INT NOT NULL,
            shop_id INT NOT NULL,
            proposed_by_user_id INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_team_challenge_proposal (team_challenge_id, shop_id),
            KEY idx_team_challenge_proposal_challenge (team_challenge_id),
            CONSTRAINT fk_team_challenge_proposals_challenge FOREIGN KEY (team_challenge_id) REFERENCES team_challenges(id) ON DELETE CASCADE,
            CONSTRAINT fk_team_challenge_proposals_shop FOREIGN KEY (shop_id) REFERENCES eisdielen(id) ON DELETE CASCADE,
            CONSTRAINT fk_team_challenge_proposals_user FOREIGN KEY (proposed_by_user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS team_challenge_checkins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_challenge_id INT NOT NULL,
            user_id INT NOT NULL,
            checkin_id INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_team_challenge_checkin_user (team_challenge_id, user_id),
            UNIQUE KEY uniq_team_challenge_checkin_checkin (team_challenge_id, checkin_id),
            CONSTRAINT fk_team_challenge_checkins_challenge FOREIGN KEY (team_challenge_id) REFERENCES team_challenges(id) ON DELETE CASCADE,
            CONSTRAINT fk_team_challenge_checkins_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE,
            CONSTRAINT fk_team_challenge_checkins_checkin FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    ensureTeamChallengeNotificationType($pdo);
    $initialized = true;
}

function ensureTeamChallengeNotificationType(PDO $pdo): void
{
    $stmt = $pdo->query("SHOW COLUMNS FROM benachrichtigungen LIKE 'typ'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$column) {
        return;
    }

    $type = (string)($column['Type'] ?? '');
    if (strpos($type, "'team_challenge'") !== false) {
        return;
    }

    $pdo->exec("
        ALTER TABLE benachrichtigungen
        MODIFY COLUMN typ ENUM('kommentar','new_user','systemmeldung','kommentar_bewertung','checkin_mention','kommentar_route','kommentar_new_user','team_challenge')
        CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
    ");
}

function teamChallengeNow(): DateTimeImmutable
{
    static $tz = null;
    if (!$tz instanceof DateTimeZone) {
        $tz = new DateTimeZone('Europe/Berlin');
    }
    return new DateTimeImmutable('now', $tz);
}

function teamChallengeActiveStatuses(): array
{
    return ['pending_acceptance', 'accepted', 'proposal_open', 'proposal_submitted', 'shop_finalized'];
}

function teamChallengeSyncExpired(PDO $pdo): void
{
    $now = teamChallengeNow()->format('Y-m-d H:i:s');

    $stmt = $pdo->prepare("
        UPDATE team_challenges
        SET status = 'expired', failed_reason = COALESCE(failed_reason, 'acceptance_or_proposal_timeout')
        WHERE status IN ('pending_acceptance', 'accepted', 'proposal_open', 'proposal_submitted')
          AND proposal_deadline IS NOT NULL
          AND proposal_deadline < :now
    ");
    $stmt->execute(['now' => $now]);

    $stmt = $pdo->prepare("
        UPDATE team_challenges
        SET status = 'expired', failed_reason = COALESCE(failed_reason, 'challenge_timeout')
        WHERE status = 'shop_finalized'
          AND valid_until IS NOT NULL
          AND valid_until < :now
    ");
    $stmt->execute(['now' => $now]);
}

function teamChallengeGetUserById(PDO $pdo, int $userId): ?array
{
    $stmt = $pdo->prepare("SELECT id, username FROM nutzer WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function teamChallengeGetValidUntil(string $type): string
{
    $now = teamChallengeNow();
    if ($type === 'daily') {
        if ((int)$now->format('H') >= 18) {
            return $now->modify('tomorrow')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
        }
        return $now->setTime(23, 59, 59)->format('Y-m-d H:i:s');
    }

    return $now->modify('next sunday')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
}

function teamChallengeGetProposalDeadline(string $validUntil): string
{
    $now = teamChallengeNow();
    $maxProposalTime = $now->modify('+2 days');
    $validUntilDt = new DateTimeImmutable($validUntil, new DateTimeZone('Europe/Berlin'));
    if ($maxProposalTime > $validUntilDt) {
        return $validUntilDt->format('Y-m-d H:i:s');
    }
    return $maxProposalTime->format('Y-m-d H:i:s');
}

function teamChallengeRequireNoOtherActive(PDO $pdo, int $userId, ?int $excludeChallengeId = null): void
{
    $statuses = teamChallengeActiveStatuses();
    $placeholders = implode(',', array_fill(0, count($statuses), '?'));
    $sql = "
        SELECT id
        FROM team_challenges
        WHERE (inviter_user_id = ? OR invitee_user_id = ?)
          AND status IN ($placeholders)
    ";
    $params = [$userId, $userId, ...$statuses];

    if ($excludeChallengeId !== null) {
        $sql .= " AND id <> ?";
        $params[] = $excludeChallengeId;
    }

    $sql .= " LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    if ($stmt->fetchColumn()) {
        throw new RuntimeException('Dieser Nutzer hat bereits eine aktive Team-Challenge.');
    }
}

function teamChallengeGetBaseRow(PDO $pdo, int $challengeId): ?array
{
    $stmt = $pdo->prepare("
        SELECT
            tc.*,
            inviter.username AS inviter_username,
            invitee.username AS invitee_username,
            shop.name AS final_shop_name,
            shop.adresse AS final_shop_address,
            shop.latitude AS final_shop_lat,
            shop.longitude AS final_shop_lon
        FROM team_challenges tc
        JOIN nutzer inviter ON inviter.id = tc.inviter_user_id
        JOIN nutzer invitee ON invitee.id = tc.invitee_user_id
        LEFT JOIN eisdielen shop ON shop.id = tc.final_shop_id
        WHERE tc.id = :id
        LIMIT 1
    ");
    $stmt->execute(['id' => $challengeId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function teamChallengeEnsureParticipant(array $challenge, int $userId): void
{
    if ((int)$challenge['inviter_user_id'] !== $userId && (int)$challenge['invitee_user_id'] !== $userId) {
        throw new RuntimeException('Keine Berechtigung für diese Team-Challenge.');
    }
}

function teamChallengeBuildSummary(array $row, int $viewerId): array
{
    $isInviter = (int)$row['inviter_user_id'] === $viewerId;
    $isInvitee = (int)$row['invitee_user_id'] === $viewerId;

    return [
        'id' => (int)$row['id'],
        'type' => $row['type'],
        'status' => $row['status'],
        'created_at' => $row['created_at'],
        'accepted_at' => $row['accepted_at'],
        'proposal_deadline' => $row['proposal_deadline'],
        'finalized_at' => $row['finalized_at'],
        'valid_until' => $row['valid_until'],
        'completed_at' => $row['completed_at'],
        'radius_m' => $row['radius_m'] !== null ? (int)$row['radius_m'] : null,
        'completion_window_minutes' => (int)$row['completion_window_minutes'],
        'failed_reason' => $row['failed_reason'],
        'center' => [
            'lat' => $row['center_lat'] !== null ? (float)$row['center_lat'] : null,
            'lon' => $row['center_lon'] !== null ? (float)$row['center_lon'] : null,
        ],
        'inviter' => [
            'id' => (int)$row['inviter_user_id'],
            'username' => $row['inviter_username'],
        ],
        'invitee' => [
            'id' => (int)$row['invitee_user_id'],
            'username' => $row['invitee_username'],
        ],
        'final_shop' => $row['final_shop_id'] ? [
            'id' => (int)$row['final_shop_id'],
            'name' => $row['final_shop_name'],
            'address' => $row['final_shop_address'],
            'lat' => $row['final_shop_lat'] !== null ? (float)$row['final_shop_lat'] : null,
            'lon' => $row['final_shop_lon'] !== null ? (float)$row['final_shop_lon'] : null,
        ] : null,
        'viewer_role' => $isInviter ? 'inviter' : ($isInvitee ? 'invitee' : null),
        'can_accept' => $isInvitee && $row['status'] === 'pending_acceptance',
        'can_decline' => $isInvitee && $row['status'] === 'pending_acceptance',
        'can_submit_proposals' => $isInvitee && in_array($row['status'], ['proposal_open', 'proposal_submitted'], true),
        'can_finalize' => $isInviter && in_array($row['status'], ['proposal_open', 'proposal_submitted'], true),
        'can_cancel' => in_array($row['status'], teamChallengeActiveStatuses(), true),
    ];
}

function teamChallengeFetchCandidates(PDO $pdo, int $challengeId): array
{
    $stmt = $pdo->prepare("
        SELECT
            c.shop_id,
            c.distance_to_center,
            e.name,
            e.adresse,
            e.latitude,
            e.longitude
        FROM team_challenge_candidates c
        JOIN eisdielen e ON e.id = c.shop_id
        WHERE c.team_challenge_id = :challenge_id
        ORDER BY c.distance_to_center ASC, e.name ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);

    return array_map(static function (array $row): array {
        return [
            'shop_id' => (int)$row['shop_id'],
            'distance_to_center' => (float)$row['distance_to_center'],
            'name' => $row['name'],
            'address' => $row['adresse'],
            'lat' => $row['latitude'] !== null ? (float)$row['latitude'] : null,
            'lon' => $row['longitude'] !== null ? (float)$row['longitude'] : null,
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function teamChallengeFetchProposals(PDO $pdo, int $challengeId): array
{
    $stmt = $pdo->prepare("
        SELECT
            p.id,
            p.shop_id,
            p.proposed_by_user_id,
            p.created_at,
            n.username AS proposed_by_username,
            e.name,
            e.adresse,
            e.latitude,
            e.longitude
        FROM team_challenge_proposals p
        JOIN nutzer n ON n.id = p.proposed_by_user_id
        JOIN eisdielen e ON e.id = p.shop_id
        WHERE p.team_challenge_id = :challenge_id
        ORDER BY p.created_at ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);

    return array_map(static function (array $row): array {
        return [
            'id' => (int)$row['id'],
            'shop_id' => (int)$row['shop_id'],
            'created_at' => $row['created_at'],
            'proposed_by' => [
                'id' => (int)$row['proposed_by_user_id'],
                'username' => $row['proposed_by_username'],
            ],
            'shop' => [
                'id' => (int)$row['shop_id'],
                'name' => $row['name'],
                'address' => $row['adresse'],
                'lat' => $row['latitude'] !== null ? (float)$row['latitude'] : null,
                'lon' => $row['longitude'] !== null ? (float)$row['longitude'] : null,
            ],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function teamChallengeFetchLocations(PDO $pdo, int $challengeId): array
{
    $stmt = $pdo->prepare("
        SELECT l.user_id, l.lat, l.lon, l.captured_at, n.username
        FROM team_challenge_locations l
        JOIN nutzer n ON n.id = l.user_id
        WHERE l.team_challenge_id = :challenge_id
        ORDER BY l.captured_at ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    return array_map(static function (array $row): array {
        return [
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'lat' => (float)$row['lat'],
            'lon' => (float)$row['lon'],
            'captured_at' => $row['captured_at'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function teamChallengeFetchCheckins(PDO $pdo, int $challengeId): array
{
    $stmt = $pdo->prepare("
        SELECT tc.user_id, tc.checkin_id, tc.created_at, n.username, c.datum
        FROM team_challenge_checkins tc
        JOIN nutzer n ON n.id = tc.user_id
        JOIN checkins c ON c.id = tc.checkin_id
        WHERE tc.team_challenge_id = :challenge_id
        ORDER BY tc.created_at ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);

    return array_map(static function (array $row): array {
        return [
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'checkin_id' => (int)$row['checkin_id'],
            'created_at' => $row['created_at'],
            'checkin_date' => $row['datum'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function teamChallengeFetchDetail(PDO $pdo, int $challengeId, int $viewerId): array
{
    teamChallengeSyncExpired($pdo);
    $row = teamChallengeGetBaseRow($pdo, $challengeId);
    if (!$row) {
        throw new RuntimeException('Team-Challenge nicht gefunden.');
    }

    teamChallengeEnsureParticipant($row, $viewerId);

    $detail = teamChallengeBuildSummary($row, $viewerId);
    $detail['locations'] = teamChallengeFetchLocations($pdo, $challengeId);
    $detail['candidates'] = teamChallengeFetchCandidates($pdo, $challengeId);
    $detail['proposals'] = teamChallengeFetchProposals($pdo, $challengeId);
    $detail['checkins'] = teamChallengeFetchCheckins($pdo, $challengeId);

    return $detail;
}

function teamChallengeInsertNotification(PDO $pdo, int $recipientId, int $challengeId, string $text, string $action, string $status): void
{
    $stmt = $pdo->prepare("
        INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten)
        VALUES (:recipient_id, 'team_challenge', :reference_id, :text, JSON_OBJECT('team_challenge_id', :json_challenge_id, 'action', :action_name, 'status', :status_name))
    ");
    $stmt->execute([
        'recipient_id' => $recipientId,
        'reference_id' => $challengeId,
        'text' => $text,
        'json_challenge_id' => $challengeId,
        'action_name' => $action,
        'status_name' => $status,
    ]);
}

function teamChallengeStoreLocation(PDO $pdo, int $challengeId, int $userId, float $lat, float $lon): void
{
    $stmt = $pdo->prepare("
        INSERT INTO team_challenge_locations (team_challenge_id, user_id, lat, lon, captured_at)
        VALUES (:challenge_id, :user_id, :lat, :lon, NOW())
        ON DUPLICATE KEY UPDATE lat = VALUES(lat), lon = VALUES(lon), captured_at = NOW()
    ");
    $stmt->execute([
        'challenge_id' => $challengeId,
        'user_id' => $userId,
        'lat' => $lat,
        'lon' => $lon,
    ]);
}

function teamChallengeFetchLocationsByUsers(PDO $pdo, int $challengeId): array
{
    $stmt = $pdo->prepare("SELECT user_id, lat, lon FROM team_challenge_locations WHERE team_challenge_id = :challenge_id");
    $stmt->execute(['challenge_id' => $challengeId]);
    $result = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $result[(int)$row['user_id']] = ['lat' => (float)$row['lat'], 'lon' => (float)$row['lon']];
    }
    return $result;
}

function teamChallengeCalculateCandidateShops(PDO $pdo, float $latA, float $lonA, float $latB, float $lonB): array
{
    $centerLat = ($latA + $latB) / 2;
    $centerLon = ($lonA + $lonB) / 2;
    $earthRadius = 6371000;
    $steps = [1000, 2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000];

    foreach ($steps as $radius) {
        $minLat = $centerLat - rad2deg($radius / $earthRadius);
        $maxLat = $centerLat + rad2deg($radius / $earthRadius);
        $lonDivisor = cos(deg2rad($centerLat));
        if (abs($lonDivisor) < 0.000001) {
            $lonDivisor = 0.000001;
        }
        $minLon = $centerLon - rad2deg($radius / $earthRadius / $lonDivisor);
        $maxLon = $centerLon + rad2deg($radius / $earthRadius / $lonDivisor);

        $stmt = $pdo->prepare("
            SELECT
                e.id AS shop_id,
                e.name,
                e.adresse,
                e.latitude,
                e.longitude,
                (6371000 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(e.latitude)) *
                    COS(RADIANS(e.longitude) - RADIANS(:lon)) +
                    SIN(RADIANS(:lat)) * SIN(RADIANS(e.latitude))
                )) AS distance_to_center
            FROM eisdielen e
            WHERE e.latitude BETWEEN :min_lat AND :max_lat
              AND e.longitude BETWEEN :min_lon AND :max_lon
              AND e.status = 'open'
            HAVING distance_to_center <= :radius
            ORDER BY distance_to_center ASC, e.name ASC
        ");
        $stmt->execute([
            'lat' => $centerLat,
            'lon' => $centerLon,
            'min_lat' => $minLat,
            'max_lat' => $maxLat,
            'min_lon' => $minLon,
            'max_lon' => $maxLon,
            'radius' => $radius,
        ]);

        $shops = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (count($shops) >= 4) {
            return [
                'center_lat' => $centerLat,
                'center_lon' => $centerLon,
                'radius_m' => $radius,
                'shops' => $shops,
            ];
        }
    }

    return [
        'center_lat' => $centerLat,
        'center_lon' => $centerLon,
        'radius_m' => 20000,
        'shops' => [],
    ];
}

function teamChallengeReplaceCandidates(PDO $pdo, int $challengeId, array $shops): void
{
    $pdo->prepare("DELETE FROM team_challenge_candidates WHERE team_challenge_id = :challenge_id")
        ->execute(['challenge_id' => $challengeId]);

    if (empty($shops)) {
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO team_challenge_candidates (team_challenge_id, shop_id, distance_to_center)
        VALUES (:challenge_id, :shop_id, :distance_to_center)
    ");

    foreach ($shops as $shop) {
        $stmt->execute([
            'challenge_id' => $challengeId,
            'shop_id' => (int)$shop['shop_id'],
            'distance_to_center' => (float)$shop['distance_to_center'],
        ]);
    }
}

function teamChallengeCompleteFromCheckin(PDO $pdo, int $userId, int $shopId, int $checkinId): ?array
{
    ensureTeamChallengeSchema($pdo);
    teamChallengeSyncExpired($pdo);

    $stmt = $pdo->prepare("
        SELECT
            tc.*,
            inviter.username AS inviter_username,
            invitee.username AS invitee_username,
            shop.name AS final_shop_name,
            shop.adresse AS final_shop_address,
            shop.latitude AS final_shop_lat,
            shop.longitude AS final_shop_lon
        FROM team_challenges tc
        JOIN nutzer inviter ON inviter.id = tc.inviter_user_id
        JOIN nutzer invitee ON invitee.id = tc.invitee_user_id
        JOIN eisdielen shop ON shop.id = tc.final_shop_id
        WHERE tc.status = 'shop_finalized'
          AND tc.final_shop_id = :shop_id
          AND tc.valid_until >= NOW()
          AND (tc.inviter_user_id = :user_id OR tc.invitee_user_id = :user_id)
        ORDER BY tc.finalized_at DESC, tc.id DESC
        LIMIT 1
    ");
    $stmt->execute([
        'shop_id' => $shopId,
        'user_id' => $userId,
    ]);
    $challenge = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$challenge) {
        return null;
    }

    $insert = $pdo->prepare("
        INSERT INTO team_challenge_checkins (team_challenge_id, user_id, checkin_id, created_at)
        VALUES (:challenge_id, :user_id, :checkin_id, NOW())
        ON DUPLICATE KEY UPDATE checkin_id = VALUES(checkin_id), created_at = NOW()
    ");
    $insert->execute([
        'challenge_id' => (int)$challenge['id'],
        'user_id' => $userId,
        'checkin_id' => $checkinId,
    ]);

    $entries = teamChallengeFetchCheckins($pdo, (int)$challenge['id']);
    if (count($entries) < 2) {
        return [
            'id' => (int)$challenge['id'],
            'status' => 'checkin_recorded',
            'shop_name' => $challenge['final_shop_name'],
            'checkins' => $entries,
            'completion_window_minutes' => (int)$challenge['completion_window_minutes'],
        ];
    }

    usort($entries, static fn(array $a, array $b) => strcmp($a['checkin_date'], $b['checkin_date']));
    $first = new DateTimeImmutable($entries[0]['checkin_date'], new DateTimeZone('Europe/Berlin'));
    $last = new DateTimeImmutable($entries[count($entries) - 1]['checkin_date'], new DateTimeZone('Europe/Berlin'));
    $diffMinutes = (int)floor(($last->getTimestamp() - $first->getTimestamp()) / 60);

    if ($diffMinutes > (int)$challenge['completion_window_minutes']) {
        return [
            'id' => (int)$challenge['id'],
            'status' => 'waiting_for_matching_checkin',
            'shop_name' => $challenge['final_shop_name'],
            'checkins' => $entries,
            'completion_window_minutes' => (int)$challenge['completion_window_minutes'],
        ];
    }

    $update = $pdo->prepare("
        UPDATE team_challenges
        SET status = 'completed', completed_at = NOW()
        WHERE id = :id AND status = 'shop_finalized'
    ");
    $update->execute(['id' => (int)$challenge['id']]);

    $message = 'Eure Team-Challenge wurde erfolgreich abgeschlossen.';
    teamChallengeInsertNotification($pdo, (int)$challenge['inviter_user_id'], (int)$challenge['id'], $message, 'completed', 'completed');
    teamChallengeInsertNotification($pdo, (int)$challenge['invitee_user_id'], (int)$challenge['id'], $message, 'completed', 'completed');

    return [
        'id' => (int)$challenge['id'],
        'status' => 'completed',
        'completed_at' => teamChallengeNow()->format('Y-m-d H:i:s'),
        'shop_name' => $challenge['final_shop_name'],
        'shop_address' => $challenge['final_shop_address'],
        'final_shop' => [
            'id' => (int)$challenge['final_shop_id'],
            'name' => $challenge['final_shop_name'],
            'address' => $challenge['final_shop_address'],
            'lat' => $challenge['final_shop_lat'] !== null ? (float)$challenge['final_shop_lat'] : null,
            'lon' => $challenge['final_shop_lon'] !== null ? (float)$challenge['final_shop_lon'] : null,
        ],
        'participants' => [
            ['id' => (int)$challenge['inviter_user_id'], 'username' => $challenge['inviter_username']],
            ['id' => (int)$challenge['invitee_user_id'], 'username' => $challenge['invitee_username']],
        ],
        'checkins' => $entries,
        'completion_window_minutes' => (int)$challenge['completion_window_minutes'],
    ];
}
