<?php

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../evaluators/SecretClickAwardEvaluator.php';

function getSeasonalCampaignConfig(string $campaignId): ?array
{
    $configs = [
        'easter_2026' => [
            'id' => 'easter_2026',
            'period_start' => '2026-04-02 00:00:00',
            'period_end' => '2026-04-13 23:59:59',
            'bunny_min_zoom' => 11,
            'workshop_min_zoom' => 6,
            'award_action_key' => 'hideout_found',
            'award_level' => 2,
            'visible_spawn_probability' => 64,
            'workshop_location' => [
                'name' => 'Osterhasenwerkstatt auf der Osterinsel',
                'lat' => -27.1219,
                'lng' => -109.3663,
            ],
        ],
    ];

    return $configs[$campaignId] ?? null;
}

function getSeasonalCampaignPhase(array $config, ?DateTimeImmutable $now = null): string
{
    $reference = $now ?? new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
    $start = new DateTimeImmutable($config['period_start'], new DateTimeZone('Europe/Berlin'));
    $end = new DateTimeImmutable($config['period_end'], new DateTimeZone('Europe/Berlin'));

    if ($reference < $start) {
        return 'upcoming';
    }
    if ($reference > $end) {
        return 'results';
    }

    return 'active';
}

function ensureTableColumn(PDO $pdo, string $tableName, string $columnName, string $definition): void
{
    $stmt = $pdo->prepare("SHOW COLUMNS FROM {$tableName} LIKE :column_name");
    $stmt->execute(['column_name' => $columnName]);
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec("ALTER TABLE {$tableName} ADD COLUMN {$columnName} {$definition}");
    }
}

function ensureEasterCampaignTables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS easter_bunny_progress (
            user_id INT NOT NULL PRIMARY KEY,
            path_json LONGTEXT DEFAULT NULL,
            current_location_json LONGTEXT DEFAULT NULL,
            current_index INT NOT NULL DEFAULT 0,
            hop_count INT NOT NULL DEFAULT 0,
            total_hops INT NOT NULL DEFAULT 5,
            workshop_hint_claims INT NOT NULL DEFAULT 0,
            daily_hint_claims INT NOT NULL DEFAULT 0,
            last_hint_claimed_on DATE DEFAULT NULL,
            completed_at DATETIME DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_easter_bunny_progress_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    ensureTableColumn($pdo, 'easter_bunny_progress', 'current_location_json', 'LONGTEXT DEFAULT NULL');
    ensureTableColumn($pdo, 'easter_bunny_progress', 'hop_count', 'INT NOT NULL DEFAULT 0');
    ensureTableColumn($pdo, 'easter_bunny_progress', 'workshop_hint_claims', 'INT NOT NULL DEFAULT 0');
}

function getEasterProgressRow(PDO $pdo, int $userId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM easter_bunny_progress WHERE user_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function createEasterProgressRow(PDO $pdo, int $userId, array $config): array
{
    $stmt = $pdo->prepare(
        "INSERT INTO easter_bunny_progress (user_id, current_index, hop_count, total_hops)
         VALUES (:user_id, 0, 0, :total_hops)
         ON DUPLICATE KEY UPDATE total_hops = VALUES(total_hops)"
    );
    $stmt->execute([
        'user_id' => $userId,
        'total_hops' => 5,
    ]);

    return getEasterProgressRow($pdo, $userId) ?? [
        'user_id' => $userId,
        'path_json' => null,
        'current_location_json' => null,
        'current_index' => 0,
        'hop_count' => 0,
        'total_hops' => 5,
        'workshop_hint_claims' => 0,
        'daily_hint_claims' => 0,
        'last_hint_claimed_on' => null,
        'completed_at' => null,
    ];
}

function decodeJsonArray(?string $json): array
{
    if (!$json) {
        return [];
    }

    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function decodeLocation(?string $json): ?array
{
    if (!$json) {
        return null;
    }

    $decoded = json_decode($json, true);
    if (!is_array($decoded)) {
        return null;
    }

    return sanitizeShopCandidate($decoded);
}

function encodeJsonValue($value): ?string
{
    if ($value === null) {
        return null;
    }

    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function readSeasonalJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    if (!$rawBody) {
        return [];
    }

    $decoded = json_decode($rawBody, true);
    return is_array($decoded) ? $decoded : [];
}

function sanitizeShopCandidate(array $shop): ?array
{
    $shopId = $shop['shop_id'] ?? $shop['id'] ?? null;
    $name = $shop['name'] ?? 'Eisdiele';
    $lat = $shop['lat'] ?? $shop['latitude'] ?? null;
    $lng = $shop['lng'] ?? $shop['longitude'] ?? null;

    if ($shopId === null || $lat === null || $lng === null || !is_numeric($lat) || !is_numeric($lng)) {
        return null;
    }

    return [
        'shop_id' => (int)$shopId,
        'name' => (string)$name,
        'lat' => (float)$lat,
        'lng' => (float)$lng,
    ];
}

function sanitizeShopPool(array $pool, int $limit = 80): array
{
    $result = [];
    $seen = [];

    foreach ($pool as $candidate) {
        if (!is_array($candidate)) {
            continue;
        }
        $normalized = sanitizeShopCandidate($candidate);
        if (!$normalized) {
            continue;
        }
        if (isset($seen[$normalized['shop_id']])) {
            continue;
        }
        $seen[$normalized['shop_id']] = true;
        $result[] = $normalized;
        if (count($result) >= $limit) {
            break;
        }
    }

    return $result;
}

function getEasterMapContextFromPayload(?array $payload = null): array
{
    $data = is_array($payload) ? $payload : readSeasonalJsonBody();
    $center = null;

    if (isset($data['center']) && is_array($data['center'])) {
        $centerLat = $data['center']['lat'] ?? null;
        $centerLng = $data['center']['lng'] ?? null;
        if ($centerLat !== null && $centerLng !== null && is_numeric($centerLat) && is_numeric($centerLng)) {
            $center = [
                'lat' => (float)$centerLat,
                'lng' => (float)$centerLng,
            ];
        }
    }

    return [
        'center' => $center,
        'visible_shops' => sanitizeShopPool($data['visible_shops'] ?? []),
        'nearby_shops' => sanitizeShopPool($data['nearby_shops'] ?? []),
    ];
}

function getEasterMapContextFromRequest(): array
{
    return getEasterMapContextFromPayload();
}

function approximateDistanceKm(float $latA, float $lngA, float $latB, float $lngB): float
{
    $earthRadiusKm = 6371.0;
    $latDelta = deg2rad($latB - $latA);
    $lngDelta = deg2rad($lngB - $lngA);
    $latAInRad = deg2rad($latA);
    $latBInRad = deg2rad($latB);

    $a = sin($latDelta / 2) ** 2
        + cos($latAInRad) * cos($latBInRad) * sin($lngDelta / 2) ** 2;

    return 2 * $earthRadiusKm * asin(min(1, sqrt($a)));
}

function loadFallbackCandidatePool(PDO $pdo, ?array $origin = null, int $limit = 36): array
{
    if ($origin && isset($origin['lat'], $origin['lng'])) {
        $stmt = $pdo->prepare(
            "SELECT id, name, latitude, longitude
             FROM eisdielen
             WHERE latitude IS NOT NULL
               AND longitude IS NOT NULL
               AND status <> 'permanent_closed'
               AND latitude BETWEEN :lat_min AND :lat_max
               AND longitude BETWEEN :lng_min AND :lng_max
             ORDER BY RAND()
             LIMIT 180"
        );
        $stmt->execute([
            'lat_min' => (float)$origin['lat'] - 5.8,
            'lat_max' => (float)$origin['lat'] + 5.8,
            'lng_min' => (float)$origin['lng'] - 7.6,
            'lng_max' => (float)$origin['lng'] + 7.6,
        ]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $stmt = $pdo->query(
            "SELECT id, name, latitude, longitude
             FROM eisdielen
             WHERE latitude IS NOT NULL
               AND longitude IS NOT NULL
               AND status <> 'permanent_closed'
             ORDER BY RAND()
             LIMIT 60"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $normalized = sanitizeShopPool($rows, 120);
    if ($origin && isset($origin['lat'], $origin['lng'])) {
        usort($normalized, static function (array $left, array $right) use ($origin): int {
            $leftDistance = approximateDistanceKm($origin['lat'], $origin['lng'], $left['lat'], $left['lng']);
            $rightDistance = approximateDistanceKm($origin['lat'], $origin['lng'], $right['lat'], $right['lng']);
            return $leftDistance <=> $rightDistance;
        });
    }

    return array_slice($normalized, 0, $limit);
}

function randomPoolEntry(array $pool): ?array
{
    if (!$pool) {
        return null;
    }

    return $pool[array_rand($pool)];
}

function poolIds(array $pool): array
{
    return array_map(static fn(array $candidate): int => (int)$candidate['shop_id'], $pool);
}

function filterPoolWithoutIds(array $pool, array $excludedIds): array
{
    if (!$excludedIds) {
        return $pool;
    }

    $lookup = array_fill_keys(array_map('intval', $excludedIds), true);
    return array_values(array_filter($pool, static fn(array $candidate): bool => !isset($lookup[(int)$candidate['shop_id']])));
}

function chooseInitialBunnyLocation(array $visibleShops, array $nearbyShops, array $fallbackShops, array $config): ?array
{
    $visibleIds = poolIds($visibleShops);
    $nearbyButHidden = filterPoolWithoutIds($nearbyShops, $visibleIds);
    $preferVisible = random_int(1, 100) <= (int)($config['visible_spawn_probability'] ?? 64);

    if ($preferVisible && $visibleShops) {
        return randomPoolEntry($visibleShops);
    }
    if ($nearbyButHidden) {
        return randomPoolEntry($nearbyButHidden);
    }
    if ($visibleShops) {
        return randomPoolEntry($visibleShops);
    }
    if ($nearbyShops) {
        return randomPoolEntry($nearbyShops);
    }

    return randomPoolEntry($fallbackShops);
}

function choosePreferredDirectionKey(): string
{
    $weightedDirections = [
        'west', 'west', 'west',
        'east', 'east',
        'north', 'north',
        'south', 'south',
        'northwest',
        'southwest',
        'northeast',
        'southeast',
    ];

    return $weightedDirections[array_rand($weightedDirections)];
}

function doesCandidateMatchDirection(array $origin, array $candidate, string $directionKey): bool
{
    $latDelta = (float)$candidate['lat'] - (float)$origin['lat'];
    $lngDelta = (float)$candidate['lng'] - (float)$origin['lng'];
    $majorThreshold = 0.01;
    $minorThreshold = 0.004;

    switch ($directionKey) {
        case 'west':
            return $lngDelta <= -$majorThreshold;
        case 'east':
            return $lngDelta >= $majorThreshold;
        case 'north':
            return $latDelta >= $majorThreshold;
        case 'south':
            return $latDelta <= -$majorThreshold;
        case 'northwest':
            return $latDelta >= $minorThreshold && $lngDelta <= -$minorThreshold;
        case 'southwest':
            return $latDelta <= -$minorThreshold && $lngDelta <= -$minorThreshold;
        case 'northeast':
            return $latDelta >= $minorThreshold && $lngDelta >= $minorThreshold;
        case 'southeast':
            return $latDelta <= -$minorThreshold && $lngDelta >= $minorThreshold;
        default:
            return true;
    }
}

function describeDirectionFromTo(array $origin, array $target): array
{
    $latDelta = (float)$target['lat'] - (float)$origin['lat'];
    $lngDelta = (float)$target['lng'] - (float)$origin['lng'];
    $absLat = abs($latDelta);
    $absLng = abs($lngDelta);

    if ($absLng > $absLat * 1.35) {
        $key = $lngDelta < 0 ? 'west' : 'east';
    } elseif ($absLat > $absLng * 1.35) {
        $key = $latDelta < 0 ? 'south' : 'north';
    } elseif ($latDelta >= 0 && $lngDelta >= 0) {
        $key = 'northeast';
    } elseif ($latDelta >= 0 && $lngDelta < 0) {
        $key = 'northwest';
    } elseif ($latDelta < 0 && $lngDelta >= 0) {
        $key = 'southeast';
    } else {
        $key = 'southwest';
    }

    $labels = [
        'west' => ['label' => 'Westen', 'phrase' => 'nach Westen'],
        'east' => ['label' => 'Osten', 'phrase' => 'nach Osten'],
        'north' => ['label' => 'Norden', 'phrase' => 'nach Norden'],
        'south' => ['label' => 'Süden', 'phrase' => 'nach Süden'],
        'northwest' => ['label' => 'Nordwesten', 'phrase' => 'nach Nordwesten'],
        'northeast' => ['label' => 'Nordosten', 'phrase' => 'nach Nordosten'],
        'southwest' => ['label' => 'Südwesten', 'phrase' => 'nach Südwesten'],
        'southeast' => ['label' => 'Südosten', 'phrase' => 'nach Südosten'],
    ];

    return array_merge(['key' => $key], $labels[$key]);
}

function filterDirectionalCandidates(array $pool, array $origin, string $directionKey, array $excludedIds): array
{
    $lookup = array_fill_keys(array_map('intval', $excludedIds), true);

    return array_values(array_filter($pool, static function (array $candidate) use ($origin, $directionKey, $lookup): bool {
        if (isset($lookup[(int)$candidate['shop_id']])) {
            return false;
        }
        if ((int)$candidate['shop_id'] === (int)$origin['shop_id']) {
            return false;
        }

        return doesCandidateMatchDirection($origin, $candidate, $directionKey);
    }));
}

function filterDistantCandidates(array $pool, array $origin, float $minimumDistanceKm): array
{
    return array_values(array_filter($pool, static function (array $candidate) use ($origin, $minimumDistanceKm): bool {
        return approximateDistanceKm(
            (float)$origin['lat'],
            (float)$origin['lng'],
            (float)$candidate['lat'],
            (float)$candidate['lng']
        ) >= $minimumDistanceKm;
    }));
}

function chooseNextBunnyLocation(
    array $currentTarget,
    array $visibleShops,
    array $nearbyShops,
    array $fallbackShops,
    array $history
): ?array {
    $recentIds = [];
    foreach (array_slice($history, -4) as $entry) {
        if (isset($entry['shop_id'])) {
            $recentIds[] = (int)$entry['shop_id'];
        }
    }
    $recentIds[] = (int)$currentTarget['shop_id'];
    $directionKey = choosePreferredDirectionKey();

    $directionalNearby = filterDirectionalCandidates($nearbyShops, $currentTarget, $directionKey, $recentIds);
    $directionalVisible = filterDirectionalCandidates($visibleShops, $currentTarget, $directionKey, $recentIds);
    $directionalFallback = filterDirectionalCandidates($fallbackShops, $currentTarget, $directionKey, $recentIds);
    $nearbyPool = filterPoolWithoutIds($nearbyShops, $recentIds);
    $visiblePool = filterPoolWithoutIds($visibleShops, $recentIds);
    $fallbackPool = filterPoolWithoutIds($fallbackShops, $recentIds);

    $candidatePools = [
        filterDistantCandidates($directionalFallback, $currentTarget, 18),
        filterDistantCandidates($directionalNearby, $currentTarget, 10),
        filterDistantCandidates($directionalVisible, $currentTarget, 8),
        $directionalFallback,
        $directionalNearby,
        $directionalVisible,
        filterDistantCandidates($fallbackPool, $currentTarget, 24),
        filterDistantCandidates($nearbyPool, $currentTarget, 12),
        $fallbackPool,
        $nearbyPool,
        $visiblePool,
    ];

    $nextTarget = null;
    foreach ($candidatePools as $pool) {
        if ($pool) {
            $nextTarget = randomPoolEntry($pool);
            break;
        }
    }

    if (!$nextTarget) {
        return null;
    }

    return [
        'target' => $nextTarget,
        'direction' => describeDirectionFromTo($currentTarget, $nextTarget),
    ];
}

function appendEasterHistory(array $history, array $location, int $maxEntries = 18): array
{
    $history[] = $location;
    if (count($history) > $maxEntries) {
        $history = array_slice($history, -$maxEntries);
    }

    return array_values($history);
}

function getCollectedHintCountFromRow(array $row): int
{
    return max(0, (int)($row['workshop_hint_claims'] ?? 0)) + max(0, (int)($row['daily_hint_claims'] ?? 0));
}

function getWorkshopHintChanceForHopCount(int $hopCount): int
{
    if ($hopCount >= 10) {
        return 54;
    }
    if ($hopCount >= 7) {
        return 44;
    }
    if ($hopCount >= 5) {
        return 34;
    }
    if ($hopCount >= 3) {
        return 26;
    }
    if ($hopCount >= 1) {
        return 18;
    }

    return 12;
}

function chooseHintStrength(int $totalHints, ?string $seedKey = null): string
{
    $roll = $seedKey === null
        ? random_int(1, 100)
        : (abs(crc32($seedKey)) % 100) + 1;

    if ($totalHints >= 8) {
        if ($roll <= 30) {
            return 'very_strong';
        }
        if ($roll <= 70) {
            return 'strong';
        }
        if ($roll <= 92) {
            return 'medium';
        }
        return 'soft';
    }

    if ($totalHints >= 5) {
        if ($roll <= 14) {
            return 'very_strong';
        }
        if ($roll <= 46) {
            return 'strong';
        }
        if ($roll <= 80) {
            return 'medium';
        }
        return 'soft';
    }

    if ($totalHints >= 3) {
        if ($roll <= 6) {
            return 'very_strong';
        }
        if ($roll <= 26) {
            return 'strong';
        }
        if ($roll <= 61) {
            return 'medium';
        }
        return 'soft';
    }

    if ($roll <= 2) {
        return 'very_strong';
    }
    if ($roll <= 11) {
        return 'strong';
    }
    if ($roll <= 34) {
        return 'medium';
    }
    return 'soft';
}

function pickHintFromPool(array $pool, ?string $seedKey = null): string
{
    if (!$pool) {
        return '';
    }

    if ($seedKey === null) {
        return $pool[array_rand($pool)];
    }

    $index = abs(crc32($seedKey)) % count($pool);
    return $pool[$index];
}

function buildHopDirectionHint(array $direction, ?string $seedKey = null): array
{
    $pool = [
        "Das muss der Osterhase gewesen sein. Er ist dir entwischt und hoppelt weiter %s.",
        "Knapp daneben. Zwischen zwei Haken ist er weiter %s verschwunden.",
        "Ein Rascheln, ein Kichern, dann war er weg. Die Spur führt jetzt %s.",
        "Zu langsam. Der Hase hat die Kurve gekriegt und hoppelt nun %s weiter.",
        "Du warst nah dran. Der nächste Hasensprung führt %s.",
    ];

    $template = pickHintFromPool($pool, $seedKey ? $seedKey . '|direction-text' : null);

    return [
        'tone' => 'direction',
        'text' => sprintf($template, $direction['phrase']),
        'strength' => 'direction',
    ];
}

function getWorkshopRiddlePool(): array
{
    return [
        'Augenzeugen berichten, dass der Osterhase die Nähe zum Ozean mag.',
        'Gerüchten zufolge wurde die Osterhasenwerkstatt weit im Westen gesichtet.',
        'Man sagt, der Hase versteckt seine Werkstatt lieber auf einer Insel als mitten im Festland.',
        'Ein Flüstern geht um: Für seine Eierproduktion mag der Hase salzige Luft und viel Abstand zum Alltag.',
        'Vielleicht führt die Spur nicht zur nächsten Stadt, sondern deutlich näher ans Meer.',
        'Einige Spuren deuten darauf hin, dass der Hase große Wasserflächen nicht scheut, sondern sucht.',
    ];
}

function getWorkshopHintPools(): array
{
    return [
        'soft' => getWorkshopRiddlePool(),
        'medium' => [
            'Die Werkstatt liegt nicht im nächsten Viertel. Denke an eine entlegene Insel im Pazifik.',
            'Die Werkstatt liegt eher an einer abgelegenen Küste als im Binnenland.',
            'Der Hase arbeitet auf einer Insel, die nach Ostern benannt ist.',
            'Seine Werkstatt liegt weit im Südpazifik, nicht in Europa.',
            'Suche auf einer Pazifikinsel westlich von Chile weiter.',
        ],
        'strong' => [
            'Die Werkstatt liegt auf der Osterinsel im südöstlichen Pazifik.',
            'Rapa Nui und Osterinsel meinen dasselbe Ziel.',
            'Wenn du nach der Werkstatt suchst, bist du auf der Osterinsel deutlich näher dran als irgendwo in Deutschland.',
        ],
        'very_strong' => [
            'Die Werkstatt steht auf der Osterinsel, auch Rapa Nui genannt, weit westlich von Chile.',
            'Suche die Werkstatt auf der Osterinsel bei den Moai im südöstlichen Pazifik.',
            'Das Ziel ist die Osterinsel bei etwa 27 Grad südlicher Breite und 109 Grad westlicher Länge.',
        ],
    ];
}

function buildWorkshopHint(int $totalHints = 0, ?string $seedKey = null): array
{
    $strength = chooseHintStrength($totalHints, $seedKey ? $seedKey . '|workshop-strength' : null);
    $pools = getWorkshopHintPools();
    $text = pickHintFromPool($pools[$strength] ?? $pools['soft'], $seedKey ? $seedKey . '|workshop-text' : null);

    return [
        'tone' => $strength,
        'text' => $text,
        'strength' => $strength,
    ];
}

function buildAmbientHint(?array $currentTarget, int $hopCount = 0, int $totalHints = 0, bool $completed = false): ?array
{
    if ($completed) {
        return [
            'tone' => 'success',
            'text' => 'Die Werkstatt ist gefunden. Der Hase kann seine Eier jetzt wieder in Ruhe lackieren.',
        ];
    }

    if ($totalHints >= 2 && $hopCount >= 4 && $hopCount % 3 === 0) {
        return buildWorkshopHint($totalHints, 'ambient|' . $hopCount . '|' . $totalHints);
    }

    if (!$currentTarget) {
        return [
            'tone' => 'soft',
            'text' => 'Zoome etwas naeher heran und halte an den Shop-Markern nach einer Hasensilhouette Ausschau.',
        ];
    }

    return [
        'tone' => 'soft',
        'text' => 'Der Hase sitzt nie lange still. Suche im aktuellen Kartenumfeld hinter einem Osterei-Marker.',
    ];
}

function getDailyHintForUser(int $userId, string $today, int $hopCount = 0, int $totalHints = 0): array
{
    $seedKey = $userId . '|' . $today . '|' . $hopCount . '|' . $totalHints;

    if ($totalHints >= 2) {
        return buildWorkshopHint($totalHints, 'daily|' . $seedKey);
    }

    $pool = [
        'Nicht jeder Klick bringt dich direkt ans Ziel. Manchmal ist die Richtung der groessere Hinweis.',
        'Je naeher du an den Marker zoomst, desto eher bemerkst du, wo sich etwas hinter dem Ei bewegt.',
        'Der Hase mag keine geraden Linien. Folge der Bewegung, nicht nur deinem ersten Bauchgefuehl.',
        'Wenn dir alles zu nah an Deutschland wirkt, denk groesser. Viel groesser. Sehr pazifisch.',
    ];

    return [
        'tone' => 'soft',
        'text' => pickHintFromPool($pool, 'daily|generic|' . $seedKey),
        'strength' => 'soft',
    ];
}

function persistCurrentEasterLocation(PDO $pdo, int $userId, array $location, array $history, int $hopCount): void
{
    $stmt = $pdo->prepare(
        "UPDATE easter_bunny_progress
         SET current_location_json = :current_location_json,
             path_json = :path_json,
             current_index = :current_index,
             hop_count = :hop_count
         WHERE user_id = :user_id"
    );
    $stmt->execute([
        'current_location_json' => encodeJsonValue($location),
        'path_json' => encodeJsonValue($history),
        'current_index' => $hopCount,
        'hop_count' => $hopCount,
        'user_id' => $userId,
    ]);
}

function normalizeEasterProgressRow(
    PDO $pdo,
    int $userId,
    array $config,
    bool $allowReset = false,
    ?array $context = null
): array {
    ensureEasterCampaignTables($pdo);
    $row = getEasterProgressRow($pdo, $userId);

    if (!$row) {
        $row = createEasterProgressRow($pdo, $userId, $config);
    }

    if ($allowReset && !empty($row['completed_at'])) {
        $stmt = $pdo->prepare(
            "UPDATE easter_bunny_progress
             SET current_location_json = NULL,
                 path_json = NULL,
                 current_index = 0,
                 hop_count = 0,
                 workshop_hint_claims = 0,
                 daily_hint_claims = 0,
                 last_hint_claimed_on = NULL,
                 completed_at = NULL
             WHERE user_id = :user_id"
        );
        $stmt->execute(['user_id' => $userId]);
        $row = getEasterProgressRow($pdo, $userId) ?: $row;
    }

    $completed = !empty($row['completed_at']);
    $effectiveContext = $context ?? ['center' => null, 'visible_shops' => [], 'nearby_shops' => []];
    $history = sanitizeShopPool(decodeJsonArray($row['path_json'] ?? null), 40);
    $currentTarget = !$completed ? decodeLocation($row['current_location_json'] ?? null) : null;

    $hasSpawnContext = !empty($effectiveContext['center'])
        || !empty($effectiveContext['visible_shops'])
        || !empty($effectiveContext['nearby_shops']);

    if (!$completed && !$currentTarget && $hasSpawnContext) {
        $fallbackShops = loadFallbackCandidatePool($pdo, $effectiveContext['center'] ?? null, 40);
        $spawnLocation = chooseInitialBunnyLocation(
            $effectiveContext['visible_shops'] ?? [],
            $effectiveContext['nearby_shops'] ?? [],
            $fallbackShops,
            $config
        );

        if ($spawnLocation) {
            $history = appendEasterHistory($history, $spawnLocation);
            persistCurrentEasterLocation($pdo, $userId, $spawnLocation, $history, (int)($row['hop_count'] ?? 0));
            $row = getEasterProgressRow($pdo, $userId) ?: $row;
            $currentTarget = $spawnLocation;
        }
    }

    $today = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');
    $hopCount = (int)($row['hop_count'] ?? 0);
    $workshopHintCount = (int)($row['workshop_hint_claims'] ?? 0);
    $dailyHintCount = (int)($row['daily_hint_claims'] ?? 0);
    $totalHints = getCollectedHintCountFromRow($row);
    $hint = buildAmbientHint($currentTarget, $hopCount, $totalHints, $completed);

    return [
        'row' => $row,
        'path' => $history,
        'progress' => [
            'completed' => $completed,
            'hop_count' => $hopCount,
            'workshop_hint_claims' => $workshopHintCount,
            'daily_hint_claims' => $dailyHintCount,
            'total_hints_found' => $totalHints,
            'current_target' => $currentTarget,
            'daily_hint_available' => ($row['last_hint_claimed_on'] ?? null) !== $today,
            'hint' => $hint,
            'workshop' => array_merge($config['workshop_location'], ['found' => $completed]),
        ],
        'rules' => [
            'bunny_min_zoom' => (int)($config['bunny_min_zoom'] ?? 9),
            'workshop_min_zoom' => (int)($config['workshop_min_zoom'] ?? 6),
        ],
    ];
}

function grantSeasonalActionAward(PDO $pdo, string $campaignId, string $actionKey, int $userId): array
{
    if ($campaignId === 'easter_2026' && $actionKey === 'hideout_found') {
        $evaluator = new SecretClickAwardEvaluator();
        return $evaluator->evaluate($userId, 2);
    }

    return [];
}
