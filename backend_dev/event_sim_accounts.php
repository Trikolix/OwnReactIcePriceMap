<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run via CLI.\n");
    exit(1);
}

const DEFAULT_BATCH = 'eventsim';
const DEFAULT_COUNT = 25;
const DEFAULT_PREFIX = 'eventsim';
const DEFAULT_PASSWORD = 'IceSim2026!';
const DEFAULT_ROUTE_PATTERN = 'family_2,classic_3,epic_4';
const DEFAULT_API_BASE_URL = 'http://localhost/ice-app/backend';
const DEFAULT_ENTRY_FEE = 15.0;

try {
    main($argv);
} catch (Throwable $e) {
    fwrite(STDERR, '[' . date('Y-m-d H:i:s') . '] event sim accounts failed: ' . $e->getMessage() . "\n");
    exit(1);
}

function main(array $argv): void
{
    [$command, $options] = parseCli($argv);
    if ($command === 'help') {
        printHelp();
        return;
    }

    $projectRoot = dirname(__DIR__);
    $devConfig = extractDbConfigFromPhpFile($projectRoot . '/backend_dev/db_connect.php');
    $pdo = createPdo($devConfig);
    $pdo->exec("SET NAMES utf8mb4");

    ensureMetadataTable($pdo);

    switch ($command) {
        case 'seed':
            runSeed($pdo, $projectRoot, $options);
            return;
        case 'list':
            runList($pdo, $projectRoot, $options);
            return;
        case 'cleanup':
            runCleanup($pdo, $options);
            return;
        case 'disable':
            runDisable($pdo, $options);
            return;
        default:
            throw new InvalidArgumentException('Unknown command: ' . $command);
    }
}

function printHelp(): void
{
    echo "Event simulator account manager (dev only)\n\n";
    echo "Usage:\n";
    echo "  php backend_dev/event_sim_accounts.php seed [options]\n";
    echo "  php backend_dev/event_sim_accounts.php list [options]\n";
    echo "  php backend_dev/event_sim_accounts.php cleanup [options]\n";
    echo "  php backend_dev/event_sim_accounts.php disable [options]\n\n";
    echo "Common options:\n";
    echo "  --batch <name>           Batch name (default: " . DEFAULT_BATCH . ")\n";
    echo "  --write-config <path>    Write simulator config JSON\n";
    echo "  --admin-username <name>  Admin username for written config\n";
    echo "  --admin-password <pass>  Admin password for written config\n";
    echo "  --api-base-url <url>     API base URL for written config\n\n";
    echo "Seed options:\n";
    echo "  --count <n>              Number of managed users to ensure (default: " . DEFAULT_COUNT . ")\n";
    echo "  --prefix <value>         Username prefix (default: " . DEFAULT_PREFIX . ")\n";
    echo "  --password <value>       Shared password for created users (default: " . DEFAULT_PASSWORD . ")\n";
    echo "  --route-pattern <csv>    Route rotation, e.g. family_2,classic_3,epic_4\n";
    echo "  --verify-only            Ensure users/slots, do not write config\n\n";
    echo "Cleanup options:\n";
    echo "  --all                    Apply to all managed batches\n";
}

function parseCli(array $argv): array
{
    $command = $argv[1] ?? 'help';
    if (in_array($command, ['--help', '-h'], true)) {
        return ['help', []];
    }

    $options = [];
    for ($index = 2; $index < count($argv); $index += 1) {
        $arg = $argv[$index];
        if (!str_starts_with($arg, '--')) {
            throw new InvalidArgumentException('Unknown positional argument: ' . $arg);
        }

        $name = substr($arg, 2);
        if (in_array($name, ['all', 'verify-only'], true)) {
            $options[$name] = true;
            continue;
        }

        $value = $argv[$index + 1] ?? null;
        if ($value === null || str_starts_with($value, '--')) {
            throw new InvalidArgumentException('Missing value for --' . $name);
        }
        $options[$name] = $value;
        $index += 1;
    }

    return [$command, $options];
}

function extractDbConfigFromPhpFile(string $filePath): array
{
    if (!is_file($filePath)) {
        throw new RuntimeException('Config file not found: ' . $filePath);
    }

    $content = file_get_contents($filePath);
    if ($content === false) {
        throw new RuntimeException('Failed to read config file: ' . $filePath);
    }

    $keys = ['host', 'dbname', 'username', 'password'];
    $config = [];
    foreach ($keys as $key) {
        $pattern = '/\\$' . preg_quote($key, '/') . '\\s*=\\s*([\'"])(.*?)\\1\\s*;/s';
        if (!preg_match($pattern, $content, $matches)) {
            throw new RuntimeException('Could not extract $' . $key . ' from ' . $filePath);
        }
        $config[$key] = $matches[2];
    }

    return $config;
}

function createPdo(array $config): PDO
{
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['host'], $config['dbname']);
    return new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function ensureMetadataTable(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS dev_event_sim_users (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            batch_name VARCHAR(64) NOT NULL,
            user_id INT NOT NULL,
            username VARCHAR(64) NOT NULL,
            email VARCHAR(255) NOT NULL,
            plain_password VARCHAR(255) NOT NULL,
            route_key VARCHAR(32) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            disabled_at DATETIME DEFAULT NULL,
            UNIQUE KEY uniq_dev_event_sim_user (batch_name, user_id),
            UNIQUE KEY uniq_dev_event_sim_username (username),
            KEY idx_dev_event_sim_batch (batch_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}

function runSeed(PDO $pdo, string $projectRoot, array $options): void
{
    $batch = sanitizeBatchName($options['batch'] ?? DEFAULT_BATCH);
    $count = max(1, (int) ($options['count'] ?? DEFAULT_COUNT));
    $prefix = sanitizePrefix($options['prefix'] ?? DEFAULT_PREFIX);
    $password = (string) ($options['password'] ?? DEFAULT_PASSWORD);
    $routePattern = parseRoutePattern($options['route-pattern'] ?? DEFAULT_ROUTE_PATTERN);

    $event = fetchCurrentEvent($pdo);
    $legal = fetchActiveLegal($pdo, (int) $event['id']);
    $existing = fetchManagedUsers($pdo, $batch);

    $pdo->beginTransaction();
    try {
        $createdCount = 0;
        for ($index = 1; $index <= $count; $index += 1) {
            $routeKey = $routePattern[($index - 1) % count($routePattern)];
            $username = buildUsername($prefix, $batch, $index);
            $fullName = sprintf('Event Sim %s %03d', strtoupper(substr($batch, 0, 6)), $index);
            $email = sprintf('%s@example.invalid', $username);

            $metadata = $existing[$username] ?? null;
            if ($metadata) {
                ensureManagedUserState($pdo, $metadata, $password, $routeKey, $fullName, $email, $event, $legal);
                continue;
            }

            $userId = createManagedUser($pdo, $username, $email, $password);
            createManagedRegistration($pdo, $userId, $fullName, $email, $routeKey, $event, $legal, $batch, $index);
            insertManagedMetadata($pdo, $batch, $userId, $username, $email, $password, $routeKey, $fullName);
            $createdCount++;
        }
        $pdo->commit();

        echo "Batch {$batch} ensured.\n";
        echo "Managed users requested: {$count}\n";
        echo "New users created: {$createdCount}\n";

        if (!isset($options['verify-only'])) {
            maybeWriteSimulatorConfig($pdo, $projectRoot, $batch, $options);
        }
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function runList(PDO $pdo, string $projectRoot, array $options): void
{
    $batch = isset($options['batch']) ? sanitizeBatchName($options['batch']) : null;
    $rows = fetchManagedUsersFlat($pdo, $batch);
    if (!$rows) {
        echo "No managed event simulator users found.\n";
        return;
    }

    foreach ($rows as $row) {
        echo sprintf(
            "[%s] %s | user_id=%d | route=%s | disabled=%s\n",
            $row['batch_name'],
            $row['username'],
            (int) $row['user_id'],
            $row['route_key'],
            $row['disabled_at'] ?: 'no'
        );
    }

    maybeWriteSimulatorConfig($pdo, $projectRoot, $batch ?? $rows[0]['batch_name'], $options);
}

function runDisable(PDO $pdo, array $options): void
{
    [$batch, $rows] = resolveCleanupSelection($pdo, $options);
    if (!$rows) {
      echo "No managed users matched.\n";
      return;
    }

    $userIds = array_map(static fn(array $row): int => (int) $row['user_id'], $rows);
    $placeholders = implode(',', array_fill(0, count($userIds), '?'));

    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE user_api_tokens SET revoked_at = NOW() WHERE user_id IN ({$placeholders}) AND revoked_at IS NULL")
            ->execute($userIds);
        $pdo->prepare("UPDATE nutzer SET is_verified = 0 WHERE id IN ({$placeholders})")
            ->execute($userIds);

        if ($batch === null) {
            $pdo->exec("UPDATE dev_event_sim_users SET disabled_at = NOW()");
        } else {
            $stmt = $pdo->prepare("UPDATE dev_event_sim_users SET disabled_at = NOW() WHERE batch_name = ?");
            $stmt->execute([$batch]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    echo "Disabled " . count($rows) . " managed users.\n";
}

function runCleanup(PDO $pdo, array $options): void
{
    [$batch, $rows] = resolveCleanupSelection($pdo, $options);
    if (!$rows) {
        echo "No managed users matched.\n";
        return;
    }

    $userIds = array_values(array_unique(array_map(static fn(array $row): int => (int) $row['user_id'], $rows)));
    $userPlaceholders = implode(',', array_fill(0, count($userIds), '?'));
    $checkinIds = fetchIds($pdo, "SELECT id FROM checkins WHERE nutzer_id IN ({$userPlaceholders})", $userIds);
    $registrationIds = fetchIds($pdo, "SELECT id FROM event2026_registrations WHERE registered_by_user_id IN ({$userPlaceholders})", $userIds);

    $pdo->beginTransaction();
    try {
        if ($checkinIds) {
            $checkinPlaceholders = implode(',', array_fill(0, count($checkinIds), '?'));
            executeDelete($pdo, "DELETE FROM checkin_mentions WHERE checkin_id IN ({$checkinPlaceholders}) OR responded_checkin_id IN ({$checkinPlaceholders})", array_merge($checkinIds, $checkinIds));
            executeDelete($pdo, "DELETE FROM kommentare WHERE checkin_id IN ({$checkinPlaceholders})", $checkinIds);
            executeDelete($pdo, "DELETE FROM bilder WHERE checkin_id IN ({$checkinPlaceholders})", $checkinIds);
            executeDelete($pdo, "DELETE FROM checkin_sorten WHERE checkin_id IN ({$checkinPlaceholders})", $checkinIds);
        }

        executeDelete($pdo, "DELETE FROM checkin_mentions WHERE mentioned_user_id IN ({$userPlaceholders})", $userIds);
        executeDelete($pdo, "DELETE FROM kommentare WHERE nutzer_id IN ({$userPlaceholders}) OR user_registration_id IN ({$userPlaceholders})", array_merge($userIds, $userIds));
        executeDelete($pdo, "DELETE FROM benachrichtigungen WHERE empfaenger_id IN ({$userPlaceholders})", $userIds);
        executeDelete($pdo, "DELETE FROM user_awards WHERE user_id IN ({$userPlaceholders})", $userIds);
        executeDelete($pdo, "DELETE FROM birthday_user_progress WHERE user_id IN ({$userPlaceholders})", $userIds);
        executeDelete($pdo, "DELETE FROM olympics_user_progress WHERE user_id IN ({$userPlaceholders})", $userIds);
        executeDelete($pdo, "DELETE FROM user_api_tokens WHERE user_id IN ({$userPlaceholders})", $userIds);

        if ($registrationIds) {
            $registrationPlaceholders = implode(',', array_fill(0, count($registrationIds), '?'));
            executeDelete($pdo, "DELETE FROM event2026_registrations WHERE id IN ({$registrationPlaceholders})", $registrationIds);
        }

        executeDelete($pdo, "DELETE FROM checkins WHERE nutzer_id IN ({$userPlaceholders})", $userIds);
        $pdo->exec("DELETE cg FROM checkin_groups cg LEFT JOIN checkins c ON c.group_id = cg.id WHERE c.id IS NULL");
        executeDelete($pdo, "DELETE FROM nutzer WHERE id IN ({$userPlaceholders})", $userIds);

        if ($batch === null) {
            $pdo->exec("DELETE FROM dev_event_sim_users");
        } else {
            $stmt = $pdo->prepare("DELETE FROM dev_event_sim_users WHERE batch_name = ?");
            $stmt->execute([$batch]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    echo "Cleaned up " . count($rows) . " managed users.\n";
}

function resolveCleanupSelection(PDO $pdo, array $options): array
{
    $all = !empty($options['all']);
    $batch = $all ? null : sanitizeBatchName($options['batch'] ?? DEFAULT_BATCH);
    $rows = fetchManagedUsersFlat($pdo, $batch);
    return [$batch, $rows];
}

function fetchManagedUsers(PDO $pdo, string $batch): array
{
    $stmt = $pdo->prepare("SELECT * FROM dev_event_sim_users WHERE batch_name = ? ORDER BY username ASC");
    $stmt->execute([$batch]);
    $rows = [];
    foreach ($stmt->fetchAll() as $row) {
        $rows[$row['username']] = $row;
    }
    return $rows;
}

function fetchManagedUsersFlat(PDO $pdo, ?string $batch): array
{
    if ($batch === null) {
        $stmt = $pdo->query("SELECT * FROM dev_event_sim_users ORDER BY batch_name ASC, username ASC");
        return $stmt->fetchAll();
    }
    $stmt = $pdo->prepare("SELECT * FROM dev_event_sim_users WHERE batch_name = ? ORDER BY username ASC");
    $stmt->execute([$batch]);
    return $stmt->fetchAll();
}

function fetchCurrentEvent(PDO $pdo): array
{
    $stmt = $pdo->query("SELECT * FROM event2026_seasons WHERE slug = 'event-2026' LIMIT 1");
    $event = $stmt->fetch();
    if (!$event) {
        throw new RuntimeException('Event 2026 could not be loaded.');
    }
    return $event;
}

function fetchActiveLegal(PDO $pdo, int $eventId): array
{
    $stmt = $pdo->prepare("SELECT * FROM event2026_legal_versions WHERE event_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1");
    $stmt->execute([$eventId]);
    $legal = $stmt->fetch();
    if (!$legal) {
        throw new RuntimeException('Active legal version missing for event 2026.');
    }
    return $legal;
}

function createManagedUser(PDO $pdo, string $username, string $email, string $password): int
{
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $inviteCode = substr(bin2hex(random_bytes(8)), 0, 10);
    $stmt = $pdo->prepare(
        "INSERT INTO nutzer (username, email, password_hash, current_level, invite_code, invited_by, is_verified, verification_token)
         VALUES (?, ?, ?, 1, ?, NULL, 1, NULL)"
    );
    $stmt->execute([$username, $email, $passwordHash, $inviteCode]);
    return (int) $pdo->lastInsertId();
}

function ensureManagedUserState(PDO $pdo, array $metadata, string $password, string $routeKey, string $fullName, string $email, array $event, array $legal): void
{
    $userId = (int) $metadata['user_id'];
    $userStmt = $pdo->prepare("SELECT id FROM nutzer WHERE id = ? LIMIT 1");
    $userStmt->execute([$userId]);
    if (!$userStmt->fetch()) {
        $newUserId = createManagedUser($pdo, $metadata['username'], $email, $password);
        createManagedRegistration($pdo, $newUserId, $fullName, $email, $routeKey, $event, $legal, $metadata['batch_name'], 0);
        $updateStmt = $pdo->prepare(
            "UPDATE dev_event_sim_users
             SET user_id = ?, email = ?, plain_password = ?, route_key = ?, full_name = ?, disabled_at = NULL
             WHERE id = ?"
        );
        $updateStmt->execute([$newUserId, $email, $password, $routeKey, $fullName, $metadata['id']]);
        return;
    }

    $pdo->prepare("UPDATE nutzer SET email = ?, password_hash = ?, is_verified = 1, verification_token = NULL WHERE id = ?")
        ->execute([$email, password_hash($password, PASSWORD_DEFAULT), $userId]);

    ensureManagedRegistration($pdo, $userId, $fullName, $email, $routeKey, $event, $legal, $metadata['batch_name']);
    $pdo->prepare(
        "UPDATE dev_event_sim_users
         SET email = ?, plain_password = ?, route_key = ?, full_name = ?, disabled_at = NULL
         WHERE id = ?"
    )->execute([$email, $password, $routeKey, $fullName, $metadata['id']]);
}

function createManagedRegistration(PDO $pdo, int $userId, string $fullName, string $email, string $routeKey, array $event, array $legal, string $batch, int $index): void
{
    $paymentReference = buildPaymentReference($batch, $userId, $index);
    $registrationStmt = $pdo->prepare(
        "INSERT INTO event2026_registrations (
            event_id, registered_by_user_id, team_name, payment_reference_code, entry_fee_amount, gift_voucher_quantity,
            gift_voucher_purchase_amount, donation_amount, voucher_discount_amount, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 'paid', ?)"
    );
    $registrationStmt->execute([
        (int) $event['id'],
        $userId,
        'Event Simulator',
        $paymentReference,
        DEFAULT_ENTRY_FEE,
        'event simulator batch ' . $batch,
    ]);
    $registrationId = (int) $pdo->lastInsertId();

    $paymentStmt = $pdo->prepare(
        "INSERT INTO event2026_payments (registration_id, method, expected_amount, paid_amount, status, confirmed_at)
         VALUES (?, 'paypal_friends', ?, ?, 'paid', NOW())"
    );
    $paymentStmt->execute([$registrationId, DEFAULT_ENTRY_FEE, DEFAULT_ENTRY_FEE]);

    $distanceKm = routeDistance($routeKey);
    $paceGroup = defaultPaceGroup($routeKey);
    $acceptedAt = date('Y-m-d H:i:s');
    $slotStmt = $pdo->prepare(
        "INSERT INTO event2026_participant_slots (
            registration_id, event_id, user_id, full_name, email, route_key, distance_km, pace_group,
            women_wave_opt_in, public_name_consent, jersey_interest, clothing_interest, license_status,
            legal_version_id, legal_accepted_at, legal_ip_hash, legal_user_agent_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0, 'none', 'licensed', ?, ?, ?, ?)"
    );
    $slotStmt->execute([
        $registrationId,
        (int) $event['id'],
        $userId,
        $fullName,
        $email,
        $routeKey,
        $distanceKm,
        $paceGroup,
        (int) $legal['id'],
        $acceptedAt,
        hashNullable('event-sim-dev'),
        hashNullable('event-sim-cli'),
    ]);
    $slotId = (int) $pdo->lastInsertId();

    $acceptStmt = $pdo->prepare(
        "INSERT INTO event2026_legal_acceptances (slot_id, legal_version_id, accepted_at, ip_hash, user_agent_hash)
         VALUES (?, ?, ?, ?, ?)"
    );
    $acceptStmt->execute([
        $slotId,
        (int) $legal['id'],
        $acceptedAt,
        hashNullable('event-sim-dev'),
        hashNullable('event-sim-cli'),
    ]);
}

function ensureManagedRegistration(PDO $pdo, int $userId, string $fullName, string $email, string $routeKey, array $event, array $legal, string $batch): void
{
    $stmt = $pdo->prepare(
        "SELECT r.id AS registration_id, s.id AS slot_id
         FROM event2026_registrations r
         LEFT JOIN event2026_participant_slots s ON s.registration_id = r.id
         WHERE r.event_id = ? AND r.registered_by_user_id = ?
         ORDER BY r.id DESC
         LIMIT 1"
    );
    $stmt->execute([(int) $event['id'], $userId]);
    $row = $stmt->fetch();

    if (!$row) {
        createManagedRegistration($pdo, $userId, $fullName, $email, $routeKey, $event, $legal, $batch, 0);
        return;
    }

    $registrationId = (int) $row['registration_id'];
    $pdo->prepare(
        "UPDATE event2026_registrations
         SET payment_status = 'paid', entry_fee_amount = ?, notes = ?
         WHERE id = ?"
    )->execute([DEFAULT_ENTRY_FEE, 'event simulator batch ' . $batch, $registrationId]);

    $paymentCountStmt = $pdo->prepare("SELECT COUNT(*) FROM event2026_payments WHERE registration_id = ?");
    $paymentCountStmt->execute([$registrationId]);
    if ((int) $paymentCountStmt->fetchColumn() === 0) {
        $pdo->prepare(
            "INSERT INTO event2026_payments (registration_id, method, expected_amount, paid_amount, status, confirmed_at)
             VALUES (?, 'paypal_friends', ?, ?, 'paid', NOW())"
        )->execute([$registrationId, DEFAULT_ENTRY_FEE, DEFAULT_ENTRY_FEE]);
    } else {
        $pdo->prepare(
            "UPDATE event2026_payments
             SET expected_amount = ?, paid_amount = ?, status = 'paid', confirmed_at = COALESCE(confirmed_at, NOW())
             WHERE registration_id = ?"
        )->execute([DEFAULT_ENTRY_FEE, DEFAULT_ENTRY_FEE, $registrationId]);
    }

    if (!empty($row['slot_id'])) {
        $slotId = (int) $row['slot_id'];
        $pdo->prepare(
            "UPDATE event2026_participant_slots
             SET user_id = ?, full_name = ?, email = ?, route_key = ?, distance_km = ?, pace_group = ?, public_name_consent = 1,
                 clothing_interest = 'none', license_status = 'licensed', legal_version_id = ?, legal_accepted_at = COALESCE(legal_accepted_at, NOW())
             WHERE id = ?"
        )->execute([
            $userId,
            $fullName,
            $email,
            $routeKey,
            routeDistance($routeKey),
            defaultPaceGroup($routeKey),
            (int) $legal['id'],
            $slotId,
        ]);
        return;
    }

    createManagedRegistration($pdo, $userId, $fullName, $email, $routeKey, $event, $legal, $batch, 0);
}

function insertManagedMetadata(PDO $pdo, string $batch, int $userId, string $username, string $email, string $password, string $routeKey, string $fullName): void
{
    $stmt = $pdo->prepare(
        "INSERT INTO dev_event_sim_users (batch_name, user_id, username, email, plain_password, route_key, full_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$batch, $userId, $username, $email, $password, $routeKey, $fullName]);
}

function maybeWriteSimulatorConfig(PDO $pdo, string $projectRoot, string $batch, array $options): void
{
    if (empty($options['write-config'])) {
        return;
    }

    $rows = fetchManagedUsersFlat($pdo, $batch);
    if (!$rows) {
        throw new RuntimeException('No managed users found for config export.');
    }

    $configPath = str_starts_with($options['write-config'], DIRECTORY_SEPARATOR)
        ? $options['write-config']
        : $projectRoot . DIRECTORY_SEPARATOR . $options['write-config'];

    $config = [
        'apiBaseUrl' => $options['api-base-url'] ?? DEFAULT_API_BASE_URL,
        'admin' => [
            'username' => $options['admin-username'] ?? 'admin',
            'password' => $options['admin-password'] ?? 'bitte-anpassen',
        ],
        'simulation' => [
            'durationMinutes' => 10,
            'minStopsPerParticipant' => 2,
            'maxStopsPerParticipant' => 3,
            'checkinShare' => 0.8,
            'seed' => 20260319,
            'flavours' => ['Vanille', 'Schoko', 'Erdbeere', 'Haselnuss', 'Joghurt', 'Mango', 'Pistazie'],
            'commentTemplates' => [
                'Kurzer Stopp auf der Runde.',
                'Alles entspannt auf der Strecke.',
                'Gute Pause, jetzt geht es weiter.',
            ],
        ],
        'participants' => array_map(static function (array $row): array {
            return [
                'label' => $row['full_name'],
                'username' => $row['username'],
                'password' => $row['plain_password'],
            ];
        }, $rows),
    ];

    $dir = dirname($configPath);
    if (!is_dir($dir)) {
        throw new RuntimeException('Config directory does not exist: ' . $dir);
    }

    file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
    echo "Wrote simulator config: {$configPath}\n";
}

function fetchIds(PDO $pdo, string $sql, array $params): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function executeDelete(PDO $pdo, string $sql, array $params): void
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
}

function sanitizeBatchName(string $batch): string
{
    $batch = strtolower(trim($batch));
    $batch = preg_replace('/[^a-z0-9_-]+/', '-', $batch) ?: DEFAULT_BATCH;
    return substr($batch, 0, 32);
}

function sanitizePrefix(string $prefix): string
{
    $prefix = strtolower(trim($prefix));
    $prefix = preg_replace('/[^a-z0-9_-]+/', '', $prefix) ?: DEFAULT_PREFIX;
    return substr($prefix, 0, 20);
}

function parseRoutePattern(string $routePattern): array
{
    $allowed = ['family_2', 'classic_3', 'epic_4'];
    $routes = array_values(array_filter(array_map('trim', explode(',', $routePattern))));
    $routes = array_values(array_filter($routes, static fn(string $route): bool => in_array($route, $allowed, true)));
    return $routes ?: ['family_2', 'classic_3', 'epic_4'];
}

function buildUsername(string $prefix, string $batch, int $index): string
{
    $suffix = sprintf('%03d', $index);
    $base = substr($prefix . '_' . substr($batch, 0, 10), 0, 40);
    return substr($base . '_' . $suffix, 0, 50);
}

function buildPaymentReference(string $batch, int $userId, int $index): string
{
    $random = substr(bin2hex(random_bytes(4)), 0, 8);
    $safeBatch = strtoupper(substr(preg_replace('/[^A-Z0-9]+/i', '', $batch) ?: 'SIM', 0, 8));
    return sprintf('SIM-%s-%d-%d-%s', $safeBatch, $userId, $index, $random);
}

function routeDistance(string $routeKey): int
{
    return match ($routeKey) {
        'family_2' => 75,
        'epic_4' => 175,
        default => 140,
    };
}

function defaultPaceGroup(string $routeKey): string
{
    return $routeKey === 'family_2' ? 'family' : '24_27';
}

function hashNullable(?string $value): ?string
{
    $value = trim((string) $value);
    return $value === '' ? null : hash('sha256', $value);
}
