<?php

require_once __DIR__ . '/opening_hours.php';

const SHOP_MAINTENANCE_DEFAULT_RADIUS_M = 25000;
const SHOP_MAINTENANCE_PRICE_STALE_MONTHS = 5;
const SHOP_MAINTENANCE_BONUS_EP = [
    'price_stale' => 20,
    'opening_hours_missing' => 20,
];

function ensureShopMaintenanceSchema(PDO $pdo): void
{
    if (isset($GLOBALS['__shop_maintenance_schema_initialized'])) {
        return;
    }
    $GLOBALS['__shop_maintenance_schema_initialized'] = true;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS shop_maintenance_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            shop_id INT NOT NULL,
            task_type ENUM('price_stale', 'opening_hours_missing') NOT NULL,
            status ENUM('active', 'resolved') NOT NULL DEFAULT 'active',
            reason_text VARCHAR(255) NULL DEFAULT NULL,
            triggered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME NULL DEFAULT NULL,
            resolved_by_user_id INT NULL DEFAULT NULL,
            bonus_ep_awarded INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_shop_maintenance_lookup (shop_id, task_type, status),
            KEY idx_shop_maintenance_status (status, triggered_at),
            KEY idx_shop_maintenance_resolver (resolved_by_user_id),
            CONSTRAINT fk_shop_maintenance_shop FOREIGN KEY (shop_id) REFERENCES eisdielen(id) ON DELETE CASCADE,
            CONSTRAINT fk_shop_maintenance_resolver FOREIGN KEY (resolved_by_user_id) REFERENCES nutzer(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $initialized = true;
}

function shopMaintenanceNow(): DateTimeImmutable
{
    static $tz = null;
    if (!$tz instanceof DateTimeZone) {
        $tz = new DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE);
    }
    return new DateTimeImmutable('now', $tz);
}

function shopMaintenanceNormalizeTaskType(string $taskType): ?string
{
    return in_array($taskType, ['price_stale', 'opening_hours_missing'], true) ? $taskType : null;
}

function shopMaintenanceGetTaskLabel(string $taskType): string
{
    if ($taskType === 'opening_hours_missing') {
        return 'Öffnungszeiten ergänzen';
    }
    return 'Preis aktualisieren';
}

function shopMaintenanceGetTaskDescription(string $taskType): string
{
    if ($taskType === 'opening_hours_missing') {
        return 'Für diese Eisdiele fehlen Öffnungszeiten.';
    }
    return 'Für diese Eisdiele sind die Preise veraltet.';
}

function shopMaintenanceGetBonusEp(string $taskType): int
{
    $normalized = shopMaintenanceNormalizeTaskType($taskType);
    if ($normalized === null) {
        return 0;
    }
    return (int)(SHOP_MAINTENANCE_BONUS_EP[$normalized] ?? 0);
}

function shopMaintenanceHasMeaningfulOpeningHours(array $shopRow, array $openingRows = []): bool
{
    if (!empty($openingRows)) {
        return true;
    }

    $legacyText = trim((string)($shopRow['openingHours'] ?? ''));
    return $legacyText !== '';
}

function shopMaintenanceBuildPriceReason(?string $lastPriceUpdate): string
{
    if (!$lastPriceUpdate) {
        return 'Für diese Eisdiele wurde noch kein Preis gemeldet.';
    }

    $formatted = date('d.m.Y', strtotime($lastPriceUpdate));
    return "Letztes Preisupdate am {$formatted}.";
}

function shopMaintenanceBuildOpeningHoursReason(): string
{
    return 'Für diese Eisdiele sind keine Öffnungszeiten eingetragen.';
}

function shopMaintenanceShouldTrackShop(array $shopRow): bool
{
    $status = (string)($shopRow['status'] ?? 'open');
    return $status !== 'permanent_closed';
}

function shopMaintenanceGetShopStates(PDO $pdo, array $shopIds): array
{
    $shopIds = array_values(array_unique(array_filter(array_map('intval', $shopIds), static function ($id) {
        return $id > 0;
    })));
    if (empty($shopIds)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($shopIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            e.id,
            e.name,
            e.status,
            e.openingHours,
            e.opening_hours_note,
            latest_price.latest_price_update
        FROM eisdielen e
        LEFT JOIN (
            SELECT eisdiele_id, MAX(gemeldet_am) AS latest_price_update
            FROM preise
            GROUP BY eisdiele_id
        ) latest_price ON latest_price.eisdiele_id = e.id
        WHERE e.id IN ($placeholders)
    ");
    $stmt->execute($shopIds);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $openingHoursMap = fetch_opening_hours_map($pdo, $shopIds);
    $cutoff = shopMaintenanceNow()->modify('-' . SHOP_MAINTENANCE_PRICE_STALE_MONTHS . ' months');

    $states = [];
    foreach ($rows as $row) {
        $shopId = (int)$row['id'];
        $openingRows = $openingHoursMap[$shopId] ?? [];
        $lastPriceUpdate = !empty($row['latest_price_update']) ? (string)$row['latest_price_update'] : null;
        $priceIsStale = false;
        if ($lastPriceUpdate === null) {
            $priceIsStale = true;
        } else {
            $priceDate = new DateTimeImmutable($lastPriceUpdate, new DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));
            $priceIsStale = $priceDate < $cutoff;
        }

        $states[$shopId] = [
            'shop' => $row,
            'opening_rows' => $openingRows,
            'needs' => [
                'price_stale' => shopMaintenanceShouldTrackShop($row) && $priceIsStale,
                'opening_hours_missing' => shopMaintenanceShouldTrackShop($row) && !shopMaintenanceHasMeaningfulOpeningHours($row, $openingRows),
            ],
            'reasons' => [
                'price_stale' => shopMaintenanceBuildPriceReason($lastPriceUpdate),
                'opening_hours_missing' => shopMaintenanceBuildOpeningHoursReason(),
            ],
        ];
    }

    return $states;
}

function shopMaintenanceFetchActiveTasksByShops(PDO $pdo, array $shopIds): array
{
    $shopIds = array_values(array_unique(array_filter(array_map('intval', $shopIds), static function ($id) {
        return $id > 0;
    })));
    if (empty($shopIds)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($shopIds), '?'));
    $stmt = $pdo->prepare("
        SELECT *
        FROM shop_maintenance_tasks
        WHERE status = 'active' AND shop_id IN ($placeholders)
        ORDER BY triggered_at DESC, id DESC
    ");
    $stmt->execute($shopIds);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $map = [];
    foreach ($rows as $row) {
        $shopId = (int)$row['shop_id'];
        $taskType = (string)$row['task_type'];
        if (!isset($map[$shopId])) {
            $map[$shopId] = [];
        }
        if (!isset($map[$shopId][$taskType])) {
            $map[$shopId][$taskType] = $row;
        }
    }
    return $map;
}

function shopMaintenanceSyncTasksForShops(PDO $pdo, array $shopIds): void
{
    ensureShopMaintenanceSchema($pdo);

    $states = shopMaintenanceGetShopStates($pdo, $shopIds);
    if (empty($states)) {
        return;
    }

    $activeTasks = shopMaintenanceFetchActiveTasksByShops($pdo, array_keys($states));
    $insert = $pdo->prepare("
        INSERT INTO shop_maintenance_tasks (shop_id, task_type, status, reason_text, triggered_at)
        VALUES (:shop_id, :task_type, 'active', :reason_text, NOW())
    ");
    $resolve = $pdo->prepare("
        UPDATE shop_maintenance_tasks
        SET status = 'resolved',
            resolved_at = NOW(),
            resolved_by_user_id = NULL,
            bonus_ep_awarded = 0
        WHERE id = :id AND status = 'active'
    ");

    foreach ($states as $shopId => $state) {
        foreach (['price_stale', 'opening_hours_missing'] as $taskType) {
            $needsTask = !empty($state['needs'][$taskType]);
            $existingActiveTask = $activeTasks[$shopId][$taskType] ?? null;

            if ($needsTask && !$existingActiveTask) {
                $insert->execute([
                    'shop_id' => $shopId,
                    'task_type' => $taskType,
                    'reason_text' => $state['reasons'][$taskType] ?? null,
                ]);
                continue;
            }

            if (!$needsTask && $existingActiveTask) {
                $resolve->execute(['id' => (int)$existingActiveTask['id']]);
            }
        }
    }
}

function shopMaintenanceSyncTaskForShop(PDO $pdo, int $shopId): void
{
    shopMaintenanceSyncTasksForShops($pdo, [$shopId]);
}

function shopMaintenanceResolveActiveTask(PDO $pdo, int $shopId, string $taskType, ?int $userId = null): ?array
{
    ensureShopMaintenanceSchema($pdo);
    $normalizedTaskType = shopMaintenanceNormalizeTaskType($taskType);
    if ($normalizedTaskType === null) {
        return null;
    }

    $stmt = $pdo->prepare("
        SELECT *
        FROM shop_maintenance_tasks
        WHERE shop_id = :shop_id
          AND task_type = :task_type
          AND status = 'active'
        ORDER BY triggered_at DESC, id DESC
        LIMIT 1
    ");
    $stmt->execute([
        'shop_id' => $shopId,
        'task_type' => $normalizedTaskType,
    ]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$task) {
        return null;
    }

    $bonusEp = $userId ? shopMaintenanceGetBonusEp($normalizedTaskType) : 0;
    $update = $pdo->prepare("
        UPDATE shop_maintenance_tasks
        SET status = 'resolved',
            resolved_at = NOW(),
            resolved_by_user_id = :resolved_by_user_id,
            bonus_ep_awarded = :bonus_ep_awarded
        WHERE id = :id AND status = 'active'
    ");
    $update->execute([
        'resolved_by_user_id' => $userId,
        'bonus_ep_awarded' => $bonusEp,
        'id' => (int)$task['id'],
    ]);

    $task['status'] = 'resolved';
    $task['resolved_by_user_id'] = $userId;
    $task['bonus_ep_awarded'] = $bonusEp;
    $task['task_label'] = shopMaintenanceGetTaskLabel($normalizedTaskType);
    return $task;
}

function shopMaintenanceFetchNearbyTasks(PDO $pdo, float $lat, float $lon, int $radiusMeters = SHOP_MAINTENANCE_DEFAULT_RADIUS_M): array
{
    ensureShopMaintenanceSchema($pdo);

    $earthRadius = 6371000;
    $radiusMeters = max(1000, min(100000, $radiusMeters));
    $minLat = $lat - rad2deg($radiusMeters / $earthRadius);
    $maxLat = $lat + rad2deg($radiusMeters / $earthRadius);
    $lonDivisor = cos(deg2rad($lat));
    if (abs($lonDivisor) < 0.000001) {
        $lonDivisor = 0.000001;
    }
    $minLon = $lon - rad2deg($radiusMeters / $earthRadius / $lonDivisor);
    $maxLon = $lon + rad2deg($radiusMeters / $earthRadius / $lonDivisor);

    $shopStmt = $pdo->prepare("
        SELECT e.id
        FROM eisdielen e
        WHERE e.latitude BETWEEN :min_lat AND :max_lat
          AND e.longitude BETWEEN :min_lon AND :max_lon
          AND e.status <> 'permanent_closed'
    ");
    $shopStmt->execute([
        'min_lat' => $minLat,
        'max_lat' => $maxLat,
        'min_lon' => $minLon,
        'max_lon' => $maxLon,
    ]);
    $shopIds = array_map('intval', $shopStmt->fetchAll(PDO::FETCH_COLUMN) ?: []);
    if (!empty($shopIds)) {
        shopMaintenanceSyncTasksForShops($pdo, $shopIds);
    }

    $stmt = $pdo->prepare("
        SELECT
            t.id,
            t.shop_id,
            t.task_type,
            t.reason_text,
            t.triggered_at,
            e.name AS shop_name,
            e.adresse AS shop_address,
            e.website AS shop_website,
            e.latitude AS shop_lat,
            e.longitude AS shop_lon,
            e.openingHours AS shop_opening_hours,
            e.opening_hours_note AS shop_opening_hours_note,
            e.status AS shop_status,
            latest_price.latest_price_update,
            (6371000 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(e.latitude)) *
                COS(RADIANS(e.longitude) - RADIANS(:lon)) +
                SIN(RADIANS(:lat)) * SIN(RADIANS(e.latitude))
            )) AS distance_m
        FROM shop_maintenance_tasks t
        JOIN eisdielen e ON e.id = t.shop_id
        LEFT JOIN (
            SELECT eisdiele_id, MAX(gemeldet_am) AS latest_price_update
            FROM preise
            GROUP BY eisdiele_id
        ) latest_price ON latest_price.eisdiele_id = e.id
        WHERE t.status = 'active'
          AND e.latitude BETWEEN :min_lat AND :max_lat
          AND e.longitude BETWEEN :min_lon AND :max_lon
          AND e.status <> 'permanent_closed'
        HAVING distance_m <= :radius_m
        ORDER BY distance_m ASC, t.triggered_at ASC
    ");
    $stmt->execute([
        'lat' => $lat,
        'lon' => $lon,
        'min_lat' => $minLat,
        'max_lat' => $maxLat,
        'min_lon' => $minLon,
        'max_lon' => $maxLon,
        'radius_m' => $radiusMeters,
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $openingMap = fetch_opening_hours_map($pdo, array_map(static function (array $row) {
        return (int)$row['shop_id'];
    }, $rows));

    return array_map(static function (array $row) use ($openingMap): array {
        $taskType = (string)$row['task_type'];
        $shopId = (int)$row['shop_id'];
        $hasOpeningHours = shopMaintenanceHasMeaningfulOpeningHours(
            ['openingHours' => $row['shop_opening_hours']],
            $openingMap[$shopId] ?? []
        );

        return [
            'id' => (int)$row['id'],
            'shop_id' => $shopId,
            'task_type' => $taskType,
            'task_label' => shopMaintenanceGetTaskLabel($taskType),
            'task_description' => shopMaintenanceGetTaskDescription($taskType),
            'reason_text' => $row['reason_text'],
            'triggered_at' => $row['triggered_at'],
            'bonus_ep' => shopMaintenanceGetBonusEp($taskType),
            'distance_m' => isset($row['distance_m']) ? (float)$row['distance_m'] : null,
            'shop' => [
                'id' => $shopId,
                'name' => $row['shop_name'],
                'address' => $row['shop_address'],
                'website' => $row['shop_website'],
                'lat' => $row['shop_lat'] !== null ? (float)$row['shop_lat'] : null,
                'lon' => $row['shop_lon'] !== null ? (float)$row['shop_lon'] : null,
                'status' => $row['shop_status'],
                'latest_price_update' => $row['latest_price_update'],
                'has_opening_hours' => $hasOpeningHours,
            ],
        ];
    }, $rows);
}
