<?php

require_once __DIR__ . '/auth.php';

const TOUR_DE_GLACE_ID = 'tour_de_glace_2026';
const TOUR_DE_GLACE_TIP_DEADLINE = '2026-07-03 23:59:59';
const TOUR_DE_GLACE_SHADOW_TEST_START = '2026-06-12 00:00:00';

function tourDeGlaceTimezone(): DateTimeZone
{
    return new DateTimeZone('Europe/Berlin');
}

function tourDeGlaceConfig(): array
{
    return [
        'id' => TOUR_DE_GLACE_ID,
        'title' => 'Tour de Glace 2026',
        'pre_start' => '2026-06-27 00:00:00',
        'start' => '2026-07-04 00:00:00',
        'end' => '2026-07-26 23:59:59',
        'tip_deadline' => TOUR_DE_GLACE_TIP_DEADLINE,
        'jerseys' => [
            'yellow' => ['label' => 'Gelbes Trikot', 'priority' => 1],
            'mountain' => ['label' => 'Bergtrikot', 'priority' => 2],
            'green' => ['label' => 'Gruenes Trikot', 'priority' => 3],
            'ice' => ['label' => 'Eiscreme-Trikot', 'priority' => 4],
            'white' => ['label' => 'Weisses Trikot', 'priority' => 5],
        ],
        'rider_types' => [
            'sprinter' => [
                'name' => 'Sprinter',
                'description' => 'Stark bei Likes, Kommentaren und Tagesaufgaben.',
                'multipliers' => ['likes' => 1.8, 'comments' => 1.5, 'checkins' => 0.9, 'bike' => 0.7, 'routes' => 0.8, 'reviews' => 1.0, 'profile' => 1.1, 'easter' => 1.1],
            ],
            'bergfloh' => [
                'name' => 'Bergfloh',
                'description' => 'Stark bei Fahrrad-Anreise und sportlichen Aktionen.',
                'multipliers' => ['likes' => 0.7, 'comments' => 0.8, 'checkins' => 1.0, 'bike' => 2.0, 'routes' => 1.5, 'reviews' => 0.9, 'profile' => 1.0, 'easter' => 1.0],
            ],
            'connaisseur' => [
                'name' => 'Eis-Connaisseur',
                'description' => 'Stark bei Check-ins, Sorten und Bewertungen.',
                'multipliers' => ['likes' => 0.8, 'comments' => 1.0, 'checkins' => 1.8, 'bike' => 1.0, 'routes' => 1.0, 'reviews' => 1.6, 'profile' => 1.0, 'easter' => 1.0],
            ],
            'domestique' => [
                'name' => 'Domestique',
                'description' => 'Stark bei Community- und Gruppenaktionen.',
                'multipliers' => ['likes' => 1.2, 'comments' => 1.8, 'checkins' => 1.0, 'bike' => 1.2, 'routes' => 1.0, 'reviews' => 1.0, 'profile' => 1.1, 'easter' => 1.1],
            ],
            'fotograf' => [
                'name' => 'Fotograf',
                'description' => 'Stark bei Foto- und visuellen Aktionen.',
                'multipliers' => ['likes' => 1.5, 'comments' => 1.2, 'checkins' => 1.2, 'bike' => 0.9, 'routes' => 0.9, 'reviews' => 1.1, 'profile' => 1.2, 'easter' => 1.1],
            ],
            'rookie' => [
                'name' => 'Rookie',
                'description' => 'Einsteigerfreundlich mit soliden Boni auf einfache Aktionen.',
                'multipliers' => ['likes' => 1.2, 'comments' => 1.2, 'checkins' => 1.2, 'bike' => 1.0, 'routes' => 1.0, 'reviews' => 1.2, 'profile' => 1.5, 'easter' => 1.2],
            ],
        ],
        'stages' => [
            1 => ['date' => '2026-07-04', 'start' => 'Barcelona', 'finish' => 'Barcelona', 'lat' => 41.3874, 'lng' => 2.1686, 'hint' => 'Die Tour startet in Barcelona.'],
            2 => ['date' => '2026-07-05', 'start' => 'Tarragona', 'finish' => 'Barcelona', 'lat' => 41.3874, 'lng' => 2.1686, 'hint' => 'Die Etappe endet wieder in Barcelona.'],
            3 => ['date' => '2026-07-06', 'start' => 'Granollers', 'finish' => 'Les Angles', 'lat' => 42.5797, 'lng' => 2.0747, 'hint' => 'Heute geht es in Richtung Pyrenaeen.'],
            4 => ['date' => '2026-07-07', 'start' => 'Carcassonne', 'finish' => 'Foix', 'lat' => 42.9653, 'lng' => 1.6072, 'hint' => 'Suche zwischen Burgstadt und Pyrenaeen.'],
            5 => ['date' => '2026-07-08', 'start' => 'Lannemezan', 'finish' => 'Pau', 'lat' => 43.2951, 'lng' => -0.3708, 'hint' => 'Pau ist ein Klassiker der Tour.'],
            6 => ['date' => '2026-07-09', 'start' => 'Pau', 'finish' => 'Gavarnie-Gedre', 'lat' => 42.7353, 'lng' => -0.0099, 'hint' => 'Bergluft und Pyrenaeen warten.'],
            7 => ['date' => '2026-07-10', 'start' => 'Hagetmau', 'finish' => 'Bordeaux', 'lat' => 44.8378, 'lng' => -0.5792, 'hint' => 'Heute fuehrt die Spur nach Bordeaux.'],
            8 => ['date' => '2026-07-11', 'start' => 'Perigueux', 'finish' => 'Bergerac', 'lat' => 44.8536, 'lng' => 0.4830, 'hint' => 'Dordogne-Tag mit Ziel Bergerac.'],
            9 => ['date' => '2026-07-12', 'start' => 'Malemort', 'finish' => 'Ussel', 'lat' => 45.5480, 'lng' => 2.3090, 'hint' => 'Massif-Central-Gefuehl in Ussel.'],
            10 => ['date' => '2026-07-14', 'start' => 'Aurillac', 'finish' => 'Le Lioran', 'lat' => 45.0919, 'lng' => 2.7515, 'hint' => 'Nach dem Ruhetag wartet Le Lioran.'],
            11 => ['date' => '2026-07-15', 'start' => 'Vichy', 'finish' => 'Nevers', 'lat' => 46.9896, 'lng' => 3.1590, 'hint' => 'Von Vichy nach Nevers.'],
            12 => ['date' => '2026-07-16', 'start' => 'Nevers Magny-Cours', 'finish' => 'Chalon-sur-Saone', 'lat' => 46.7808, 'lng' => 4.8539, 'hint' => 'Motorsport-Start, Saone-Ziel.'],
            13 => ['date' => '2026-07-17', 'start' => 'Dole', 'finish' => 'Belfort', 'lat' => 47.6397, 'lng' => 6.8638, 'hint' => 'Belfort markiert den Weg in die Vogesen.'],
            14 => ['date' => '2026-07-18', 'start' => 'Mulhouse', 'finish' => 'Le Markstein', 'lat' => 47.9230, 'lng' => 7.0300, 'hint' => 'Vogesen-Bergtag am Le Markstein.'],
            15 => ['date' => '2026-07-19', 'start' => 'Champagnole', 'finish' => 'Plateau de Solaison', 'lat' => 46.0240, 'lng' => 6.4090, 'hint' => 'Plateau-Finish vor dem Ruhetag.'],
            16 => ['date' => '2026-07-21', 'start' => 'Evian-les-Bains', 'finish' => 'Thonon-les-Bains', 'lat' => 46.3705, 'lng' => 6.4798, 'hint' => 'Zeitfahr-Spur am Genfersee.'],
            17 => ['date' => '2026-07-22', 'start' => 'Chambery', 'finish' => 'Voiron', 'lat' => 45.3630, 'lng' => 5.5920, 'hint' => 'Alpenrand nach Voiron.'],
            18 => ['date' => '2026-07-23', 'start' => 'Voiron', 'finish' => 'Orcieres-Merlette', 'lat' => 44.6970, 'lng' => 6.3270, 'hint' => 'Orcieres-Merlette ruft.'],
            19 => ['date' => '2026-07-24', 'start' => 'Gap', 'finish' => 'Alpe dHuez', 'lat' => 45.0910, 'lng' => 6.0680, 'hint' => 'Die beruehmten Kehren warten.'],
            20 => ['date' => '2026-07-25', 'start' => 'Le Bourg-dOisans', 'finish' => 'Alpe dHuez', 'lat' => 45.0910, 'lng' => 6.0680, 'hint' => 'Noch einmal Alpe dHuez.'],
            21 => ['date' => '2026-07-26', 'start' => 'Thoiry', 'finish' => 'Paris Champs-Elysees', 'lat' => 48.8698, 'lng' => 2.3076, 'hint' => 'Finale in Paris.'],
        ],
    ];
}

function getTourDeGlaceNow(): DateTimeImmutable
{
    return new DateTimeImmutable('now', tourDeGlaceTimezone());
}

function isTourDeGlaceLocalDevRequest(): bool
{
    $hostValues = [
        $_SERVER['HTTP_HOST'] ?? '',
        $_SERVER['SERVER_NAME'] ?? '',
        $_SERVER['HTTP_ORIGIN'] ?? '',
        $_SERVER['HTTP_REFERER'] ?? '',
    ];

    foreach ($hostValues as $value) {
        if (preg_match('/(^|\/\/)(localhost|127\.0\.0\.1)(:|\/|$)/i', (string)$value)) {
            $requestUri = (string)($_SERVER['REQUEST_URI'] ?? '');
            $serverHost = (string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '');
            return stripos($serverHost, 'localhost') !== false
                || stripos($serverHost, '127.0.0.1') !== false
                || stripos($requestUri, '/backend_dev/') !== false;
        }
    }

    return false;
}

function ensureTourDeGlaceTables(PDO $pdo): void
{
    if (isset($GLOBALS['__tour_de_glace_schema_initialized'])) {
        return;
    }
    $GLOBALS['__tour_de_glace_schema_initialized'] = true;

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_user_profiles (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            user_id INT NOT NULL,
            rider_type VARCHAR(40) NOT NULL,
            rider_type_changes INT NOT NULL DEFAULT 0,
            selected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_profile (campaign_id, user_id),
            KEY idx_tdg_profile_rider (campaign_id, rider_type),
            CONSTRAINT fk_tdg_profile_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_user_profiles', 'rider_type_changes', 'INT NOT NULL DEFAULT 0 AFTER rider_type');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_point_events (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            user_id INT NOT NULL,
            action_type VARCHAR(64) NOT NULL,
            action_category VARCHAR(40) NOT NULL,
            source_type VARCHAR(64) NOT NULL,
            source_id INT NOT NULL,
            points_yellow INT NOT NULL DEFAULT 0,
            points_green INT NOT NULL DEFAULT 0,
            points_mountain INT NOT NULL DEFAULT 0,
            points_ice INT NOT NULL DEFAULT 0,
            points_white INT NOT NULL DEFAULT 0,
            is_shadow_test TINYINT(1) NOT NULL DEFAULT 0,
            metadata_json LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_point_source (campaign_id, action_type, source_type, source_id, user_id, is_shadow_test),
            KEY idx_tdg_points_user (campaign_id, user_id, created_at),
            KEY idx_tdg_points_action_day (campaign_id, user_id, action_type, created_at),
            CONSTRAINT fk_tdg_points_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_point_events', 'is_shadow_test', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER points_white');
    ensureTourDeGlaceUniqueIndex($pdo, 'tour_de_glace_point_events', 'uniq_tdg_point_source', ['campaign_id', 'action_type', 'source_type', 'source_id', 'user_id', 'is_shadow_test']);

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_tips (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            user_id INT NOT NULL,
            tip_gc_winner VARCHAR(160) DEFAULT NULL,
            tip_gc_second VARCHAR(160) DEFAULT NULL,
            tip_gc_third VARCHAR(160) DEFAULT NULL,
            tip_green_winner VARCHAR(160) DEFAULT NULL,
            tip_mountain_winner VARCHAR(160) DEFAULT NULL,
            tip_white_winner VARCHAR(160) DEFAULT NULL,
            submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_tips (campaign_id, user_id),
            CONSTRAINT fk_tdg_tips_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_tips', 'tip_gc_second', 'VARCHAR(160) DEFAULT NULL AFTER tip_gc_winner');
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_tips', 'tip_gc_third', 'VARCHAR(160) DEFAULT NULL AFTER tip_gc_second');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_easter_eggs (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            stage_number INT NOT NULL,
            stage_date DATE NOT NULL,
            start_location VARCHAR(120) NOT NULL,
            finish_location VARCHAR(120) NOT NULL,
            latitude DECIMAL(10,7) DEFAULT NULL,
            longitude DECIMAL(10,7) DEFAULT NULL,
            hint_text VARCHAR(255) NOT NULL,
            secret_code VARCHAR(80) NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_egg_stage (campaign_id, stage_number),
            UNIQUE KEY uniq_tdg_egg_code (campaign_id, secret_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_easter_eggs', 'latitude', 'DECIMAL(10,7) DEFAULT NULL AFTER finish_location');
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_easter_eggs', 'longitude', 'DECIMAL(10,7) DEFAULT NULL AFTER latitude');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_user_easter_eggs (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            easter_egg_id INT NOT NULL,
            user_id INT NOT NULL,
            is_shadow_test TINYINT(1) NOT NULL DEFAULT 0,
            found_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_user_egg (campaign_id, easter_egg_id, user_id, is_shadow_test),
            KEY idx_tdg_user_eggs_user (campaign_id, user_id),
            CONSTRAINT fk_tdg_user_egg FOREIGN KEY (easter_egg_id) REFERENCES tour_de_glace_easter_eggs(id) ON DELETE CASCADE,
            CONSTRAINT fk_tdg_user_egg_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_user_easter_eggs', 'is_shadow_test', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER user_id');
    ensureTourDeGlaceUniqueIndex($pdo, 'tour_de_glace_user_easter_eggs', 'uniq_tdg_user_egg', ['campaign_id', 'easter_egg_id', 'user_id', 'is_shadow_test']);

    seedTourDeGlaceEasterEggs($pdo);
}

function ensureTourDeGlaceColumn(PDO $pdo, string $tableName, string $columnName, string $definition): void
{
    $stmt = $pdo->prepare("SHOW COLUMNS FROM {$tableName} LIKE :column_name");
    $stmt->execute(['column_name' => $columnName]);
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec("ALTER TABLE {$tableName} ADD COLUMN {$columnName} {$definition}");
    }
}

function ensureTourDeGlaceUniqueIndex(PDO $pdo, string $tableName, string $indexName, array $columns): void
{
    $stmt = $pdo->prepare("SHOW INDEX FROM {$tableName} WHERE Key_name = :index_name");
    $stmt->execute(['index_name' => $indexName]);
    $existingRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $existingColumns = [];
    foreach ($existingRows as $row) {
        $existingColumns[(int)$row['Seq_in_index']] = $row['Column_name'];
    }
    ksort($existingColumns);
    $existingColumns = array_values($existingColumns);

    if ($existingColumns === $columns) {
        return;
    }

    if ($existingRows) {
        $pdo->exec("ALTER TABLE {$tableName} DROP INDEX {$indexName}");
    }

    $columnList = implode(', ', $columns);
    $pdo->exec("ALTER TABLE {$tableName} ADD UNIQUE KEY {$indexName} ({$columnList})");
}

function seedTourDeGlaceEasterEggs(PDO $pdo): void
{
    $config = tourDeGlaceConfig();
    $stmt = $pdo->prepare(
        "INSERT INTO tour_de_glace_easter_eggs
            (campaign_id, stage_number, stage_date, start_location, finish_location, latitude, longitude, hint_text, secret_code, is_active)
         VALUES
            (:campaign_id, :stage_number, :stage_date, :start_location, :finish_location, :latitude, :longitude, :hint_text, :secret_code, 1)
         ON DUPLICATE KEY UPDATE
            stage_date = VALUES(stage_date),
            start_location = VALUES(start_location),
            finish_location = VALUES(finish_location),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            hint_text = VALUES(hint_text),
            is_active = 1"
    );

    foreach ($config['stages'] as $stageNumber => $stage) {
        $stmt->execute([
            'campaign_id' => TOUR_DE_GLACE_ID,
            'stage_number' => $stageNumber,
            'stage_date' => $stage['date'],
            'start_location' => $stage['start'],
            'finish_location' => $stage['finish'],
            'latitude' => $stage['lat'] ?? null,
            'longitude' => $stage['lng'] ?? null,
            'hint_text' => $stage['hint'],
            'secret_code' => 'tdg-' . $stageNumber . '-' . strtolower(substr(sha1(TOUR_DE_GLACE_ID . '|' . $stageNumber), 0, 8)),
        ]);
    }
}

function getTourDeGlacePhase(?DateTimeImmutable $now = null): string
{
    $config = tourDeGlaceConfig();
    $tz = tourDeGlaceTimezone();
    $reference = $now ?? getTourDeGlaceNow();
    $preStart = new DateTimeImmutable($config['pre_start'], $tz);
    $start = new DateTimeImmutable($config['start'], $tz);
    $end = new DateTimeImmutable($config['end'], $tz);

    if ($reference < $preStart) {
        return 'upcoming';
    }
    if ($reference < $start) {
        return 'pre';
    }
    if ($reference <= $end) {
        return 'active';
    }
    return 'results';
}

function getTourDeGlaceProfile(PDO $pdo, int $userId): ?array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare("SELECT * FROM tour_de_glace_user_profiles WHERE campaign_id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([TOUR_DE_GLACE_ID, $userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    return $profile ?: null;
}

function selectTourDeGlaceRiderType(PDO $pdo, int $userId, string $riderType): array
{
    ensureTourDeGlaceTables($pdo);
    $config = tourDeGlaceConfig();
    if (!isset($config['rider_types'][$riderType])) {
        throw new InvalidArgumentException('Ungueltiger Fahrertyp.');
    }

    $existing = getTourDeGlaceProfile($pdo, $userId);
    if ($existing) {
        if ((string)$existing['rider_type'] === $riderType) {
            return $existing;
        }
        if ((int)($existing['rider_type_changes'] ?? 0) >= 3) {
            throw new RuntimeException('Du hast deinen Fahrertyp bereits 3 mal gewechselt.');
        }
        $stmt = $pdo->prepare(
            "UPDATE tour_de_glace_user_profiles
             SET rider_type = ?, rider_type_changes = rider_type_changes + 1, selected_at = NOW()
             WHERE campaign_id = ? AND user_id = ?"
        );
        $stmt->execute([$riderType, TOUR_DE_GLACE_ID, $userId]);
        return getTourDeGlaceProfile($pdo, $userId) ?: ['user_id' => $userId, 'rider_type' => $riderType, 'rider_type_changes' => 0];
    }

    $stmt = $pdo->prepare(
        "INSERT INTO tour_de_glace_user_profiles (campaign_id, user_id, rider_type)
         VALUES (?, ?, ?)"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, $riderType]);
    return getTourDeGlaceProfile($pdo, $userId) ?: ['user_id' => $userId, 'rider_type' => $riderType];
}

function isTourDeGlaceActiveNow(): bool
{
    return getTourDeGlacePhase() === 'active';
}

function isTourDeGlaceShadowTestNow(?DateTimeImmutable $now = null): bool
{
    $reference = $now ?? getTourDeGlaceNow();
    $tz = tourDeGlaceTimezone();
    $shadowStart = new DateTimeImmutable(TOUR_DE_GLACE_SHADOW_TEST_START, $tz);
    $officialStart = new DateTimeImmutable(tourDeGlaceConfig()['start'], $tz);
    return $reference >= $shadowStart && $reference < $officialStart;
}

function isTourDeGlacePointCollectionActive(): bool
{
    return isTourDeGlaceActiveNow() || isTourDeGlaceShadowTestNow();
}

function getTourDeGlacePointScopeValue(): int
{
    return isTourDeGlaceShadowTestNow() ? 1 : 0;
}

function tourDeGlaceDailyLimitForAction(string $actionType): ?int
{
    $limits = [
        'like' => 20,
        'comment' => 5,
        'easter_egg' => 1,
        'daily_visit' => 1,
    ];
    return $limits[$actionType] ?? null;
}

function tourDeGlaceCampaignLimitForAction(string $actionType): ?int
{
    $limits = [
        'route' => 3,
        'review' => 10,
    ];
    return $limits[$actionType] ?? null;
}

function getTourDeGlaceActionCount(PDO $pdo, int $userId, string $actionType, string $scope): int
{
    $scopeValue = getTourDeGlacePointScopeValue();
    if ($scope === 'day') {
        $stmt = $pdo->prepare(
            "SELECT COUNT(*)
             FROM tour_de_glace_point_events
             WHERE campaign_id = ?
               AND user_id = ?
               AND action_type = ?
               AND is_shadow_test = ?
               AND DATE(created_at) = CURRENT_DATE()"
        );
        $stmt->execute([TOUR_DE_GLACE_ID, $userId, $actionType, $scopeValue]);
        return (int)$stmt->fetchColumn();
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM tour_de_glace_point_events
         WHERE campaign_id = ?
           AND user_id = ?
           AND action_type = ?
           AND is_shadow_test = ?"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, $actionType, $scopeValue]);
    return (int)$stmt->fetchColumn();
}

function getTourDeGlaceCheckinCountBeforeStart(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM checkins WHERE nutzer_id = ? AND datum < '2026-07-04 00:00:00'");
    $stmt->execute([$userId]);
    return (int)$stmt->fetchColumn();
}

function isTourDeGlaceWhiteEligible(PDO $pdo, int $userId): bool
{
    return getTourDeGlaceCheckinCountBeforeStart($pdo, $userId) < 5;
}

function applyTourDeGlaceMultiplier(array $basePoints, float $multiplier, bool $whiteEligible): array
{
    $result = [];
    foreach (['yellow', 'green', 'mountain', 'ice', 'white'] as $jersey) {
        $value = (int)($basePoints[$jersey] ?? 0);
        if ($jersey === 'white' && !$whiteEligible) {
            $result[$jersey] = 0;
        } else {
            $result[$jersey] = (int)round($value * $multiplier);
        }
    }
    return $result;
}

function recordTourDeGlacePointEvent(PDO $pdo, int $userId, string $actionType, string $category, string $sourceType, int $sourceId, array $basePoints, array $metadata = []): ?array
{
    try {
        if (!isset($GLOBALS['__tour_de_glace_schema_initialized']) && $pdo->inTransaction()) {
            return null;
        }

        ensureTourDeGlaceTables($pdo);
        if (!isTourDeGlacePointCollectionActive()) {
            return null;
        }

        $profile = getTourDeGlaceProfile($pdo, $userId);

        $dailyLimit = tourDeGlaceDailyLimitForAction($actionType);
        if ($dailyLimit !== null && getTourDeGlaceActionCount($pdo, $userId, $actionType, 'day') >= $dailyLimit) {
            return null;
        }

        $campaignLimit = tourDeGlaceCampaignLimitForAction($actionType);
        if ($campaignLimit !== null && getTourDeGlaceActionCount($pdo, $userId, $actionType, 'campaign') >= $campaignLimit) {
            return null;
        }

        $config = tourDeGlaceConfig();
        $riderType = (string)($profile['rider_type'] ?? '');
        $multiplier = (float)($config['rider_types'][$riderType]['multipliers'][$category] ?? 1.0);
        $points = applyTourDeGlaceMultiplier($basePoints, $multiplier, isTourDeGlaceWhiteEligible($pdo, $userId));

        if (array_sum($points) <= 0) {
            return null;
        }

        $stmt = $pdo->prepare(
            "INSERT IGNORE INTO tour_de_glace_point_events (
                campaign_id, user_id, action_type, action_category, source_type, source_id,
                points_yellow, points_green, points_mountain, points_ice, points_white, is_shadow_test, metadata_json
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $isShadowTest = getTourDeGlacePointScopeValue();
        $stmt->execute([
            TOUR_DE_GLACE_ID,
            $userId,
            $actionType,
            $category,
            $sourceType,
            $sourceId,
            $points['yellow'],
            $points['green'],
            $points['mountain'],
            $points['ice'],
            $points['white'],
            $isShadowTest,
            $metadata ? json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
        ]);

        return $stmt->rowCount() > 0 ? $points : null;
    } catch (Throwable $e) {
        error_log('Tour de Glace point event failed: ' . $e->getMessage());
        return null;
    }
}

function recordTourDeGlaceCheckin(PDO $pdo, int $userId, int $checkinId, array $context = []): array
{
    $type = (string)($context['type'] ?? '');
    $hasPhoto = !empty($context['has_photo']);
    $isBike = (($context['anreise'] ?? '') === 'Fahrrad');
    $isNewShopForUser = !empty($context['is_new_shop']);
    $hasGroup = !empty($context['group_id']);

    $iceBase = $type === 'Eisbecher' ? 25 : 20;
    $base = [
        'yellow' => 10 + ($hasPhoto ? 3 : 0) + ($hasGroup ? 8 : 0),
        'green' => 0,
        'mountain' => 0,
        'ice' => $iceBase + ($hasPhoto ? 10 : 0) + ($isNewShopForUser ? 15 : 0),
        'white' => 30 + ($hasPhoto ? 20 : 0),
    ];
    $events = [];
    $events[] = recordTourDeGlacePointEvent($pdo, $userId, 'checkin', 'checkins', 'checkin', $checkinId, $base, $context);

    if ($isBike) {
        $events[] = recordTourDeGlacePointEvent($pdo, $userId, 'bike_bonus', 'bike', 'checkin', $checkinId, [
            'yellow' => 5,
            'green' => 0,
            'mountain' => 25 + ($hasGroup ? 10 : 0) + ($isNewShopForUser ? 10 : 0),
            'ice' => 5,
            'white' => 0,
        ], $context);
    }

    return array_values(array_filter($events));
}

function recordTourDeGlaceReview(PDO $pdo, int $userId, int $reviewId, array $context = []): ?array
{
    return recordTourDeGlacePointEvent($pdo, $userId, 'review', 'reviews', 'review', $reviewId, [
        'yellow' => 8,
        'green' => 0,
        'mountain' => 0,
        'ice' => 8,
        'white' => 20,
    ], $context);
}

function recordTourDeGlaceComment(PDO $pdo, int $userId, int $commentId, array $context = []): ?array
{
    return recordTourDeGlacePointEvent($pdo, $userId, 'comment', 'comments', 'comment', $commentId, [
        'yellow' => 2,
        'green' => 5,
        'mountain' => 0,
        'ice' => 0,
        'white' => 10,
    ], $context);
}

function recordTourDeGlaceLike(PDO $pdo, int $userId, int $likeSourceId, array $context = []): ?array
{
    return recordTourDeGlacePointEvent($pdo, $userId, 'like', 'likes', 'like', $likeSourceId, [
        'yellow' => 0,
        'green' => 1,
        'mountain' => 0,
        'ice' => 0,
        'white' => 0,
    ], $context);
}

function recordTourDeGlaceRoute(PDO $pdo, int $userId, int $routeId, array $context = []): ?array
{
    return recordTourDeGlacePointEvent($pdo, $userId, 'route', 'routes', 'route', $routeId, [
        'yellow' => 10,
        'green' => 0,
        'mountain' => 30,
        'ice' => 0,
        'white' => 0,
    ], $context);
}

function recordTourDeGlaceDailyVisit(PDO $pdo, int $userId): ?array
{
    $dateKey = (int)getTourDeGlaceNow()->format('Ymd');
    return recordTourDeGlacePointEvent($pdo, $userId, 'daily_visit', 'profile', 'tour_day', $dateKey, [
        'yellow' => 0,
        'green' => 5,
        'mountain' => 0,
        'ice' => 0,
        'white' => 0,
    ]);
}

function userHasTourDeGlaceProfileImage(PDO $pdo, int $userId): bool
{
    $stmt = $pdo->prepare(
        "SELECT 1
         FROM user_profile_images
         WHERE user_id = ?
           AND avatar_path IS NOT NULL
           AND avatar_path <> ''
         LIMIT 1"
    );
    $stmt->execute([$userId]);
    return (bool)$stmt->fetchColumn();
}

function recordTourDeGlaceProfileImage(PDO $pdo, int $userId): ?array
{
    if (!userHasTourDeGlaceProfileImage($pdo, $userId)) {
        return null;
    }

    return recordTourDeGlacePointEvent($pdo, $userId, 'profile_image', 'profile', 'user', $userId, [
        'yellow' => 0,
        'green' => 10,
        'mountain' => 0,
        'ice' => 0,
        'white' => 0,
    ]);
}

function fetchTourDeGlaceTotals(PDO $pdo, ?int $userId = null): array
{
    ensureTourDeGlaceTables($pdo);
    $where = "campaign_id = ? AND is_shadow_test = ?";
    $params = [TOUR_DE_GLACE_ID, getTourDeGlacePointScopeValue()];
    if ($userId !== null) {
        $where .= " AND user_id = ?";
        $params[] = $userId;
    }

    $stmt = $pdo->prepare(
        "SELECT user_id,
                SUM(points_yellow) AS yellow,
                SUM(points_green) AS green,
                SUM(points_mountain) AS mountain,
                SUM(points_ice) AS ice,
                SUM(points_white) AS white
         FROM tour_de_glace_point_events
         WHERE {$where}
         GROUP BY user_id"
    );
    $stmt->execute($params);
    $totals = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $uid = (int)$row['user_id'];
        $totals[$uid] = [
            'user_id' => $uid,
            'yellow' => (int)$row['yellow'],
            'green' => (int)$row['green'],
            'mountain' => (int)$row['mountain'],
            'ice' => (int)$row['ice'],
            'white' => (int)$row['white'],
        ];
    }
    return $totals;
}

function getTourDeGlaceLeaderboard(PDO $pdo, string $jersey = 'yellow', int $limit = 50, bool $includeBreakdown = true): array
{
    ensureTourDeGlaceTables($pdo);
    $allowed = ['yellow', 'green', 'mountain', 'ice', 'white'];
    if (!in_array($jersey, $allowed, true)) {
        $jersey = 'yellow';
    }
    $column = 'points_' . $jersey;
    $stmt = $pdo->prepare(
        "SELECT p.user_id, n.username, up.avatar_path, SUM(p.{$column}) AS points
         FROM tour_de_glace_point_events p
         JOIN nutzer n ON n.id = p.user_id
         LEFT JOIN user_profile_images up ON up.user_id = p.user_id
         WHERE p.campaign_id = ?
           AND p.is_shadow_test = ?
         GROUP BY p.user_id, n.username, up.avatar_path
         HAVING points > 0
         ORDER BY points DESC, p.user_id ASC
         LIMIT ?"
    );
    $stmt->bindValue(1, TOUR_DE_GLACE_ID);
    $stmt->bindValue(2, getTourDeGlacePointScopeValue(), PDO::PARAM_INT);
    $stmt->bindValue(3, max(1, min(100, $limit)), PDO::PARAM_INT);
    $stmt->execute();

    $rank = 0;
    return array_map(function (array $row) use (&$rank, $pdo, $includeBreakdown): array {
        $rank++;
        $entry = [
            'rank' => $rank,
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'avatar_path' => $row['avatar_path'],
            'points' => (int)$row['points'],
        ];
        if ($includeBreakdown) {
            $entry['breakdown'] = getTourDeGlaceUserBreakdown($pdo, (int)$row['user_id']);
        }
        return $entry;
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getTourDeGlaceUserRank(PDO $pdo, string $jersey, int $userId): ?array
{
    ensureTourDeGlaceTables($pdo);
    $allowed = ['yellow', 'green', 'mountain', 'ice', 'white'];
    if (!in_array($jersey, $allowed, true)) {
        return null;
    }

    $column = 'points_' . $jersey;
    $stmt = $pdo->prepare(
        "SELECT p.user_id, n.username, up.avatar_path, SUM(p.{$column}) AS points
         FROM tour_de_glace_point_events p
         JOIN nutzer n ON n.id = p.user_id
         LEFT JOIN user_profile_images up ON up.user_id = p.user_id
         WHERE p.campaign_id = ?
           AND p.is_shadow_test = ?
         GROUP BY p.user_id, n.username, up.avatar_path
         HAVING points > 0
         ORDER BY points DESC, p.user_id ASC"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, getTourDeGlacePointScopeValue()]);

    $rank = 0;
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $rank++;
        if ((int)$row['user_id'] === $userId) {
            return [
                'rank' => $rank,
                'user_id' => (int)$row['user_id'],
                'username' => $row['username'],
                'avatar_path' => $row['avatar_path'],
                'points' => (int)$row['points'],
            ];
        }
    }

    return null;
}

function getTourDeGlaceUserRanks(PDO $pdo, int $userId): array
{
    $ranks = [];
    foreach (['yellow', 'green', 'mountain', 'ice', 'white'] as $jersey) {
        $ranks[$jersey] = getTourDeGlaceUserRank($pdo, $jersey, $userId);
    }
    return $ranks;
}

function getTourDeGlaceUserBreakdown(PDO $pdo, int $userId): array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT action_type,
                SUM(points_yellow) AS yellow,
                SUM(points_green) AS green,
                SUM(points_mountain) AS mountain,
                SUM(points_ice) AS ice,
                SUM(points_white) AS white
         FROM tour_de_glace_point_events
         WHERE campaign_id = ?
           AND user_id = ?
           AND is_shadow_test = ?
         GROUP BY action_type
         ORDER BY action_type ASC"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, getTourDeGlacePointScopeValue()]);

    $breakdown = [
        'yellow' => [],
        'green' => [],
        'mountain' => [],
        'ice' => [],
        'white' => [],
    ];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $actionType = (string)$row['action_type'];
        foreach (array_keys($breakdown) as $jersey) {
            $points = (int)$row[$jersey];
            if ($points > 0) {
                $breakdown[$jersey][$actionType] = $points;
            }
        }
    }

    return $breakdown;
}

function getTourDeGlaceCompactLeaderboards(PDO $pdo, int $limit = 5): array
{
    $leaderboards = [];
    foreach (['yellow', 'green', 'mountain', 'ice', 'white'] as $jersey) {
        $leaderboards[$jersey] = getTourDeGlaceLeaderboard($pdo, $jersey, $limit);
    }
    return $leaderboards;
}

function getTourDeGlaceOfficialLeaders(PDO $pdo): array
{
    $config = tourDeGlaceConfig();
    $leaders = [];
    $assignedUsers = [];
    $jerseys = array_keys($config['jerseys']);
    usort($jerseys, static fn($a, $b) => $config['jerseys'][$a]['priority'] <=> $config['jerseys'][$b]['priority']);

    foreach ($jerseys as $jersey) {
        $leaderboard = getTourDeGlaceLeaderboard($pdo, $jersey, 100, false);
        $rawLeader = $leaderboard[0] ?? null;
        $official = null;
        foreach ($leaderboard as $entry) {
            if (!isset($assignedUsers[(int)$entry['user_id']])) {
                $official = $entry;
                $assignedUsers[(int)$entry['user_id']] = true;
                break;
            }
        }
        $leaders[$jersey] = [
            'raw' => $rawLeader,
            'official' => $official,
        ];
    }
    return $leaders;
}

function getCurrentTourDeGlaceStage(?DateTimeImmutable $now = null): ?array
{
    $config = tourDeGlaceConfig();
    $reference = $now ?? getTourDeGlaceNow();
    if (isTourDeGlaceShadowTestNow($reference)) {
        $shadowStart = new DateTimeImmutable(TOUR_DE_GLACE_SHADOW_TEST_START, tourDeGlaceTimezone());
        $stageNumbers = array_keys($config['stages']);
        $daysSinceShadowStart = (int)$shadowStart->setTime(0, 0)->diff($reference->setTime(0, 0))->days;
        $stageNumber = (int)$stageNumbers[$daysSinceShadowStart % count($stageNumbers)];
        return ['stage_number' => $stageNumber] + array_merge($config['stages'][$stageNumber], ['date' => $reference->format('Y-m-d')]);
    }
    $today = $reference->format('Y-m-d');
    foreach ($config['stages'] as $number => $stage) {
        if ($stage['date'] === $today) {
            return ['stage_number' => $number] + $stage;
        }
    }
    return null;
}

function getTourDeGlaceTips(PDO $pdo, int $userId): ?array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare("SELECT * FROM tour_de_glace_tips WHERE campaign_id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([TOUR_DE_GLACE_ID, $userId]);
    $tips = $stmt->fetch(PDO::FETCH_ASSOC);
    return $tips ?: null;
}

function submitTourDeGlaceTips(PDO $pdo, int $userId, array $tips): array
{
    ensureTourDeGlaceTables($pdo);
    $now = getTourDeGlaceNow();
    $deadline = new DateTimeImmutable(TOUR_DE_GLACE_TIP_DEADLINE, tourDeGlaceTimezone());
    if ($now > $deadline) {
        throw new RuntimeException('Die Tippabgabe ist geschlossen.');
    }

    $clean = [];
    foreach (['tip_gc_winner', 'tip_gc_second', 'tip_gc_third', 'tip_green_winner', 'tip_mountain_winner', 'tip_white_winner'] as $key) {
        $value = trim((string)($tips[$key] ?? ''));
        $clean[$key] = $value !== '' ? substr($value, 0, 160) : null;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO tour_de_glace_tips (
            campaign_id, user_id, tip_gc_winner, tip_gc_second, tip_gc_third, tip_green_winner, tip_mountain_winner, tip_white_winner, submitted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
            tip_gc_winner = VALUES(tip_gc_winner),
            tip_gc_second = VALUES(tip_gc_second),
            tip_gc_third = VALUES(tip_gc_third),
            tip_green_winner = VALUES(tip_green_winner),
            tip_mountain_winner = VALUES(tip_mountain_winner),
            tip_white_winner = VALUES(tip_white_winner),
            updated_at = NOW()"
    );
    $stmt->execute([
        TOUR_DE_GLACE_ID,
        $userId,
        $clean['tip_gc_winner'],
        $clean['tip_gc_second'],
        $clean['tip_gc_third'],
        $clean['tip_green_winner'],
        $clean['tip_mountain_winner'],
        $clean['tip_white_winner'],
    ]);

    return getTourDeGlaceTips($pdo, $userId) ?: [];
}

function getTourDeGlaceAvailableEasterEgg(PDO $pdo, ?int $stageNumber = null): ?array
{
    ensureTourDeGlaceTables($pdo);
    $stage = null;
    if ($stageNumber !== null) {
        $config = tourDeGlaceConfig();
        if (!isset($config['stages'][$stageNumber])) {
            return null;
        }
        $stage = ['stage_number' => $stageNumber] + $config['stages'][$stageNumber];
    } else {
        $stage = getCurrentTourDeGlaceStage();
    }
    if (!$stage) {
        return null;
    }

    $now = getTourDeGlaceNow();
    if (isTourDeGlaceShadowTestNow($now)) {
        $shadowStage = getCurrentTourDeGlaceStage($now);
        if (!$shadowStage || (int)$stage['stage_number'] !== (int)$shadowStage['stage_number']) {
            return null;
        }
        $stage['date'] = $now->format('Y-m-d');
    }
    $stageDate = new DateTimeImmutable($stage['date'] . ' 00:00:00', tourDeGlaceTimezone());
    $expiresAt = $stageDate->modify('+2 days');
    if ($now < $stageDate || $now > $expiresAt) {
        return null;
    }

    $stmt = $pdo->prepare("SELECT * FROM tour_de_glace_easter_eggs WHERE campaign_id = ? AND stage_number = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([TOUR_DE_GLACE_ID, (int)$stage['stage_number']]);
    $egg = $stmt->fetch(PDO::FETCH_ASSOC);
    return $egg ? array_merge($egg, ['expires_at' => $expiresAt->format('Y-m-d H:i:s')]) : null;
}

function getTourDeGlaceFoundEggIds(PDO $pdo, int $userId): array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT easter_egg_id
         FROM tour_de_glace_user_easter_eggs
         WHERE campaign_id = ?
           AND user_id = ?
           AND is_shadow_test = ?"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, getTourDeGlacePointScopeValue()]);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function findTourDeGlaceEasterEgg(PDO $pdo, int $userId, int $stageNumber, string $secretCode): array
{
    ensureTourDeGlaceTables($pdo);
    if (!isTourDeGlacePointCollectionActive()) {
        throw new RuntimeException('Die Aktion ist aktuell nicht aktiv.');
    }
    $egg = getTourDeGlaceAvailableEasterEgg($pdo, $stageNumber);
    $submittedCode = trim($secretCode);
    if (!$egg || $submittedCode === '' || !hash_equals((string)$egg['secret_code'], $submittedCode)) {
        throw new RuntimeException('Dieses Etappen-Easter-Egg ist nicht verfuegbar.');
    }

    $stmt = $pdo->prepare(
        "INSERT IGNORE INTO tour_de_glace_user_easter_eggs (campaign_id, easter_egg_id, user_id, is_shadow_test)
         VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, (int)$egg['id'], $userId, getTourDeGlacePointScopeValue()]);
    $isNew = $stmt->rowCount() > 0;
    $points = null;
    if ($isNew) {
        $points = recordTourDeGlacePointEvent($pdo, $userId, 'easter_egg', 'easter', 'easter_egg', (int)$egg['id'], [
            'yellow' => 0,
            'green' => 8,
            'mountain' => 0,
            'ice' => 0,
            'white' => 0,
        ], ['stage_number' => (int)$egg['stage_number']]);
    }

    return [
        'found' => true,
        'is_new' => $isNew,
        'points' => $points,
        'egg' => [
            'id' => (int)$egg['id'],
            'stage_number' => (int)$egg['stage_number'],
            'stage_date' => $egg['stage_date'],
            'start_location' => $egg['start_location'],
            'finish_location' => $egg['finish_location'],
            'latitude' => isset($egg['latitude']) ? (float)$egg['latitude'] : null,
            'longitude' => isset($egg['longitude']) ? (float)$egg['longitude'] : null,
        ],
    ];
}

function buildTourDeGlaceProgress(PDO $pdo, ?int $userId = null): array
{
    ensureTourDeGlaceTables($pdo);
    $config = tourDeGlaceConfig();
    $phase = getTourDeGlacePhase();
    $isShadowTest = isTourDeGlaceShadowTestNow();
    $profile = $userId ? getTourDeGlaceProfile($pdo, $userId) : null;
    if ($userId && isTourDeGlacePointCollectionActive()) {
        recordTourDeGlaceDailyVisit($pdo, $userId);
        recordTourDeGlaceProfileImage($pdo, $userId);
    }
    $totals = $userId ? (fetchTourDeGlaceTotals($pdo, $userId)[$userId] ?? ['yellow' => 0, 'green' => 0, 'mountain' => 0, 'ice' => 0, 'white' => 0]) : null;
    $currentStage = getCurrentTourDeGlaceStage();
    $availableEgg = getTourDeGlaceAvailableEasterEgg($pdo);
    $foundEggIds = $userId ? getTourDeGlaceFoundEggIds($pdo, $userId) : [];

    return [
        'campaign' => [
            'id' => $config['id'],
            'title' => $config['title'],
            'phase' => $isShadowTest ? 'active' : $phase,
            'official_phase' => $phase,
            'shadow_test' => $isShadowTest,
            'point_collection_active' => isTourDeGlacePointCollectionActive(),
            'pre_start' => $config['pre_start'],
            'start' => $config['start'],
            'end' => $config['end'],
            'tip_deadline' => $config['tip_deadline'],
        ],
        'rider_types' => $config['rider_types'],
        'jerseys' => $config['jerseys'],
        'profile' => $profile ? [
            'rider_type' => $profile['rider_type'],
            'selected_at' => $profile['selected_at'],
            'rider_type_changes' => (int)($profile['rider_type_changes'] ?? 0),
            'rider_type_changes_remaining' => max(0, 3 - (int)($profile['rider_type_changes'] ?? 0)),
            'white_eligible' => $userId ? isTourDeGlaceWhiteEligible($pdo, $userId) : false,
        ] : null,
        'my_scores' => $totals,
        'my_breakdown' => $userId ? getTourDeGlaceUserBreakdown($pdo, $userId) : null,
        'my_ranks' => $userId ? getTourDeGlaceUserRanks($pdo, $userId) : null,
        'leaderboards' => getTourDeGlaceCompactLeaderboards($pdo, 5),
        'tips' => $userId ? getTourDeGlaceTips($pdo, $userId) : null,
        'stage' => $currentStage,
        'easter_egg' => $availableEgg ? [
            'id' => (int)$availableEgg['id'],
            'stage_number' => (int)$availableEgg['stage_number'],
            'stage_date' => $availableEgg['stage_date'],
            'start_location' => $availableEgg['start_location'],
            'finish_location' => $availableEgg['finish_location'],
            'latitude' => isset($availableEgg['latitude']) ? (float)$availableEgg['latitude'] : null,
            'longitude' => isset($availableEgg['longitude']) ? (float)$availableEgg['longitude'] : null,
            'hint_text' => $availableEgg['hint_text'],
            'map_secret_code' => $availableEgg['secret_code'],
            'expires_at' => $availableEgg['expires_at'],
            'found' => in_array((int)$availableEgg['id'], $foundEggIds, true),
        ] : null,
        'found_easter_eggs' => count($foundEggIds),
        'leaders' => getTourDeGlaceOfficialLeaders($pdo),
    ];
}

?>
