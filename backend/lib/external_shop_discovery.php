<?php

require_once __DIR__ . '/opening_hours.php';

if (!defined('EXTERNAL_SHOP_DISCOVERY_SLOT_LIMIT')) {
    define('EXTERNAL_SHOP_DISCOVERY_SLOT_LIMIT', 5);
}
if (!defined('EXTERNAL_SHOP_DISCOVERY_MIN_ZOOM')) {
    define('EXTERNAL_SHOP_DISCOVERY_MIN_ZOOM', 13);
}
if (!defined('EXTERNAL_SHOP_DISCOVERY_MAX_BBOX_DIAGONAL_M')) {
    define('EXTERNAL_SHOP_DISCOVERY_MAX_BBOX_DIAGONAL_M', 25000);
}
if (!defined('EXTERNAL_SHOP_DISCOVERY_MIN_SEARCH_INTERVAL_SECONDS')) {
    define('EXTERNAL_SHOP_DISCOVERY_MIN_SEARCH_INTERVAL_SECONDS', 10);
}
if (!defined('EXTERNAL_SHOP_DISCOVERY_FALSE_POSITIVE_THRESHOLD')) {
    define('EXTERNAL_SHOP_DISCOVERY_FALSE_POSITIVE_THRESHOLD', 2);
}
if (!defined('EXTERNAL_SHOP_DISCOVERY_MAX_RESULTS')) {
    define('EXTERNAL_SHOP_DISCOVERY_MAX_RESULTS', 60);
}

function externalShopTableHasColumn(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table_name
          AND COLUMN_NAME = :column_name
    ");
    $stmt->execute([
        'table_name' => $table,
        'column_name' => $column,
    ]);
    return (int)$stmt->fetchColumn() > 0;
}

function ensureExternalShopDiscoverySchema(PDO $pdo): void
{
    static $initialized = false;
    if ($initialized) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS external_shop_mappings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            provider VARCHAR(32) NOT NULL,
            external_id VARCHAR(191) NOT NULL,
            osm_type VARCHAR(16) NULL DEFAULT NULL,
            osm_numeric_id BIGINT NULL DEFAULT NULL,
            shop_id INT NULL DEFAULT NULL,
            status ENUM('unmapped', 'matched_existing', 'imported_as_shop', 'dismissed_false_positive', 'dismissed_duplicate') NOT NULL DEFAULT 'unmapped',
            external_name VARCHAR(255) NOT NULL,
            external_address VARCHAR(255) NULL DEFAULT NULL,
            normalized_name VARCHAR(255) NULL DEFAULT NULL,
            external_lat DECIMAL(10, 7) NULL DEFAULT NULL,
            external_lon DECIMAL(10, 7) NULL DEFAULT NULL,
            website VARCHAR(255) NULL DEFAULT NULL,
            tags_json LONGTEXT NULL,
            payload_json LONGTEXT NULL,
            feedback_false_positive_count INT NOT NULL DEFAULT 0,
            feedback_confirmed_valid_count INT NOT NULL DEFAULT 0,
            created_by_user_id INT NULL DEFAULT NULL,
            first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_fetched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_external_shop_mapping (provider, external_id),
            KEY idx_external_shop_shop (shop_id),
            KEY idx_external_shop_status (status),
            KEY idx_external_shop_last_seen (last_seen_at),
            CONSTRAINT fk_external_shop_mapping_shop FOREIGN KEY (shop_id) REFERENCES eisdielen(id) ON DELETE SET NULL,
            CONSTRAINT fk_external_shop_mapping_user FOREIGN KEY (created_by_user_id) REFERENCES nutzer(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $columnsToAdd = [
        'osm_type' => "ALTER TABLE external_shop_mappings ADD COLUMN osm_type VARCHAR(16) NULL DEFAULT NULL AFTER external_id",
        'osm_numeric_id' => "ALTER TABLE external_shop_mappings ADD COLUMN osm_numeric_id BIGINT NULL DEFAULT NULL AFTER osm_type",
        'tags_json' => "ALTER TABLE external_shop_mappings ADD COLUMN tags_json LONGTEXT NULL AFTER website",
        'feedback_false_positive_count' => "ALTER TABLE external_shop_mappings ADD COLUMN feedback_false_positive_count INT NOT NULL DEFAULT 0 AFTER payload_json",
        'feedback_confirmed_valid_count' => "ALTER TABLE external_shop_mappings ADD COLUMN feedback_confirmed_valid_count INT NOT NULL DEFAULT 0 AFTER feedback_false_positive_count",
        'first_seen_at' => "ALTER TABLE external_shop_mappings ADD COLUMN first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER created_by_user_id",
        'last_seen_at' => "ALTER TABLE external_shop_mappings ADD COLUMN last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER first_seen_at",
        'last_fetched_at' => "ALTER TABLE external_shop_mappings ADD COLUMN last_fetched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER last_seen_at",
    ];
    foreach ($columnsToAdd as $column => $sql) {
        if (!externalShopTableHasColumn($pdo, 'external_shop_mappings', $column)) {
            $pdo->exec($sql);
        }
    }

    $pdo->exec("
        ALTER TABLE external_shop_mappings
        MODIFY COLUMN status ENUM('unmapped', 'matched_existing', 'imported_as_shop', 'dismissed_false_positive', 'dismissed_duplicate') NOT NULL DEFAULT 'unmapped'
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS external_shop_feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            external_shop_mapping_id INT NOT NULL,
            user_id INT NOT NULL,
            feedback_type ENUM('false_positive', 'duplicate', 'bad_location', 'not_ice_cream', 'confirmed_valid') NOT NULL,
            note VARCHAR(255) NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_external_shop_feedback (external_shop_mapping_id, user_id, feedback_type),
            KEY idx_external_shop_feedback_entry (external_shop_mapping_id),
            KEY idx_external_shop_feedback_user (user_id),
            CONSTRAINT fk_external_shop_feedback_entry FOREIGN KEY (external_shop_mapping_id) REFERENCES external_shop_mappings(id) ON DELETE CASCADE,
            CONSTRAINT fk_external_shop_feedback_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS shop_discovery_origins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            shop_id INT NOT NULL,
            created_by_user_id INT NOT NULL,
            external_shop_mapping_id INT NULL DEFAULT NULL,
            origin_type ENUM('external_discovery') NOT NULL DEFAULT 'external_discovery',
            counts_against_limit TINYINT(1) NOT NULL DEFAULT 1,
            released_at DATETIME NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_shop_discovery_origin_shop (shop_id),
            KEY idx_shop_discovery_slots (created_by_user_id, counts_against_limit, released_at),
            CONSTRAINT fk_shop_discovery_origin_shop FOREIGN KEY (shop_id) REFERENCES eisdielen(id) ON DELETE CASCADE,
            CONSTRAINT fk_shop_discovery_origin_user FOREIGN KEY (created_by_user_id) REFERENCES nutzer(id) ON DELETE CASCADE,
            CONSTRAINT fk_shop_discovery_origin_external_entry FOREIGN KEY (external_shop_mapping_id) REFERENCES external_shop_mappings(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS external_shop_search_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            north DECIMAL(10, 7) NOT NULL,
            south DECIMAL(10, 7) NOT NULL,
            east DECIMAL(10, 7) NOT NULL,
            west DECIMAL(10, 7) NOT NULL,
            zoom_level INT NOT NULL,
            requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_external_shop_search_user_time (user_id, requested_at),
            CONSTRAINT fk_external_shop_search_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $initialized = true;
}

function normalizeExternalShopName(?string $value): string
{
    $raw = trim((string)$value);
    if ($raw === '') {
        return '';
    }

    $raw = mb_strtolower($raw, 'UTF-8');
    $raw = preg_replace('/[^\p{L}\p{N}]+/u', ' ', $raw);
    return trim(preg_replace('/\s+/u', ' ', $raw));
}

function externalShopFormatCoordinate(float $value): string
{
    return sprintf('%.7F', $value);
}

function externalShopDistanceMeters(float $latA, float $lonA, float $latB, float $lonB): float
{
    $earthRadius = 6371000;
    $latA = deg2rad($latA);
    $lonA = deg2rad($lonA);
    $latB = deg2rad($latB);
    $lonB = deg2rad($lonB);

    $deltaLat = $latB - $latA;
    $deltaLon = $lonB - $lonA;
    $a = sin($deltaLat / 2) ** 2 + cos($latA) * cos($latB) * sin($deltaLon / 2) ** 2;
    $c = 2 * atan2(sqrt($a), sqrt(max(0.0, 1 - $a)));

    return $earthRadius * $c;
}

function externalShopCreateHttpContext(array $options = [])
{
    $defaults = [
        'method' => 'POST',
        'header' => "User-Agent: Ice-App/0.1\r\nAccept: application/json\r\nContent-Type: application/x-www-form-urlencoded\r\n",
        'timeout' => 16,
    ];

    return stream_context_create([
        'http' => array_merge($defaults, $options),
    ]);
}

function externalShopBuildExternalUrl(string $provider, ?string $osmType, ?int $osmNumericId, float $lat, float $lon): ?string
{
    if ($provider !== 'osm') {
        return null;
    }

    if ($osmType && $osmNumericId) {
        return sprintf(
            'https://www.openstreetmap.org/%s/%d',
            rawurlencode($osmType),
            $osmNumericId
        );
    }

    return sprintf(
        'https://www.openstreetmap.org/?mlat=%s&mlon=%s#map=18/%s/%s',
        rawurlencode(externalShopFormatCoordinate($lat)),
        rawurlencode(externalShopFormatCoordinate($lon)),
        rawurlencode(externalShopFormatCoordinate($lat)),
        rawurlencode(externalShopFormatCoordinate($lon))
    );
}

function externalShopBuildStructuredOpeningHours(?string $openingHoursValue): ?array
{
    $raw = trim((string)$openingHoursValue);
    if ($raw === '') {
        return null;
    }

    $segments = preg_split('/\s*;\s*/', $raw);
    $convertedSegments = [];

    foreach ($segments ?: [] as $segment) {
        $segment = trim((string)$segment);
        if ($segment === '') {
            continue;
        }

        if (preg_match('/^((?:Mo|Tu|We|Th|Fr|Sa|Su|PH|Mo-Fr|Mo-Su|Sa-Su|Tu-Fr|We-Su|[A-Za-z,-]+\s*)+)\s+(.+)$/u', $segment, $matches)) {
            $dayPart = trim((string)$matches[1]);
            $timePart = trim((string)$matches[2]);
            $dayPart = str_replace(
                ['Tu', 'We', 'Th', 'Su'],
                ['Di', 'Mi', 'Do', 'So'],
                $dayPart
            );
            $convertedSegments[] = $dayPart . ': ' . $timePart;
        } else {
            $convertedSegments[] = $segment;
        }
    }

    $parsed = parse_legacy_opening_hours(implode("\n", $convertedSegments));
    if (empty($parsed['rows']) && empty($parsed['note'])) {
        return null;
    }

    return build_structured_opening_hours($parsed['rows'], $parsed['note'] ?? null);
}

function externalShopFetchBoundsOverpassResults(float $north, float $south, float $east, float $west): array
{
    $bbox = implode(',', [
        externalShopFormatCoordinate($south),
        externalShopFormatCoordinate($west),
        externalShopFormatCoordinate($north),
        externalShopFormatCoordinate($east),
    ]);

    $query = <<<OVERPASS
[out:json][timeout:25];
(
  node["amenity"="ice_cream"]($bbox);
  way["amenity"="ice_cream"]($bbox);
  relation["amenity"="ice_cream"]($bbox);
  node["shop"="ice_cream"]($bbox);
  way["shop"="ice_cream"]($bbox);
  relation["shop"="ice_cream"]($bbox);
);
out center tags;
OVERPASS;

    $endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
    ];
    $lastErrorMessage = null;

    foreach ($endpoints as $endpoint) {
        $json = @file_get_contents(
            $endpoint,
            false,
            externalShopCreateHttpContext([
                'content' => http_build_query(['data' => $query]),
            ])
        );
        if ($json === false) {
            $lastErrorMessage = "Abruf fehlgeschlagen: {$endpoint}";
            continue;
        }

        $data = json_decode($json, true);
        if (!is_array($data)) {
            $lastErrorMessage = "Ungueltige Antwort von {$endpoint}";
            continue;
        }

        if (!empty($data['remark'])) {
            $lastErrorMessage = (string)$data['remark'];
            continue;
        }

        if (!is_array($data['elements'] ?? null)) {
            $lastErrorMessage = "Keine gueltigen Elemente in Antwort von {$endpoint}";
            continue;
        }

        return $data['elements'];
    }

    throw new RuntimeException($lastErrorMessage ?: 'Die externe Eisdielen-Suche ist gerade voruebergehend nicht erreichbar.');
}

function externalShopComposeAddressFromTags(array $tags): string
{
    $street = trim(implode(' ', array_filter([
        $tags['addr:street'] ?? null,
        $tags['addr:housenumber'] ?? null,
    ], static function ($value) {
        return trim((string)$value) !== '';
    })));
    $locality = trim(implode(' ', array_filter([
        $tags['addr:postcode'] ?? null,
        $tags['addr:city'] ?? ($tags['addr:town'] ?? ($tags['addr:village'] ?? null)),
    ], static function ($value) {
        return trim((string)$value) !== '';
    })));
    $country = trim((string)($tags['addr:country'] ?? ''));

    return trim(implode(', ', array_filter([$street, $locality, $country], static function ($value) {
        return trim((string)$value) !== '';
    })));
}

function externalShopMatchesFilter(array $entry, string $query): bool
{
    $normalizedQuery = normalizeExternalShopName($query);
    if ($normalizedQuery === '') {
        return true;
    }

    $haystack = normalizeExternalShopName(implode(' ', array_filter([
        $entry['name'] ?? '',
        $entry['address'] ?? '',
        $entry['website'] ?? '',
    ])));

    return $haystack !== '' && str_contains($haystack, $normalizedQuery);
}

function externalShopFindExistingMatch(PDO $pdo, string $name, float $lat, float $lon): ?array
{
    $earthRadius = 6371000;
    $radiusMeters = 500;
    $minLat = $lat - rad2deg($radiusMeters / $earthRadius);
    $maxLat = $lat + rad2deg($radiusMeters / $earthRadius);
    $lonDivisor = cos(deg2rad($lat));
    if (abs($lonDivisor) < 0.000001) {
        $lonDivisor = 0.000001;
    }
    $minLon = $lon - rad2deg($radiusMeters / $earthRadius / $lonDivisor);
    $maxLon = $lon + rad2deg($radiusMeters / $earthRadius / $lonDivisor);
    $normalizedName = normalizeExternalShopName($name);

    $stmt = $pdo->prepare("
        SELECT
            e.id,
            e.name,
            e.adresse,
            e.latitude,
            e.longitude,
            (6371000 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(e.latitude)) *
                COS(RADIANS(e.longitude) - RADIANS(:lon)) +
                SIN(RADIANS(:lat)) * SIN(RADIANS(e.latitude))
            )) AS distance_m
        FROM eisdielen e
        WHERE e.latitude BETWEEN :min_lat AND :max_lat
          AND e.longitude BETWEEN :min_lon AND :max_lon
        HAVING distance_m <= :radius_m
        ORDER BY distance_m ASC, e.name ASC
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
    if (empty($rows)) {
        return null;
    }

    foreach ($rows as $row) {
        $candidateName = normalizeExternalShopName($row['name'] ?? '');
        if ($candidateName !== '' && $candidateName === $normalizedName) {
            $row['match_type'] = 'existing';
            return $row;
        }
    }

    foreach ($rows as $row) {
        $candidateName = normalizeExternalShopName($row['name'] ?? '');
        similar_text($normalizedName, $candidateName, $similarity);
        if ($similarity >= 72.0 || (float)$row['distance_m'] <= 175.0) {
            $row['match_type'] = 'probable_duplicate';
            return $row;
        }
    }

    return null;
}

function externalShopLoadStoredMapping(PDO $pdo, string $provider, string $externalId): ?array
{
    ensureExternalShopDiscoverySchema($pdo);
    $stmt = $pdo->prepare("
        SELECT
            m.*,
            e.name AS shop_name,
            e.adresse AS shop_address
        FROM external_shop_mappings m
        LEFT JOIN eisdielen e ON e.id = m.shop_id
        WHERE m.provider = :provider AND m.external_id = :external_id
        LIMIT 1
    ");
    $stmt->execute([
        'provider' => $provider,
        'external_id' => $externalId,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function externalShopLoadEntryById(PDO $pdo, int $entryId): ?array
{
    ensureExternalShopDiscoverySchema($pdo);
    $stmt = $pdo->prepare("
        SELECT
            m.*,
            e.name AS shop_name,
            e.adresse AS shop_address
        FROM external_shop_mappings m
        LEFT JOIN eisdielen e ON e.id = m.shop_id
        WHERE m.id = :entry_id
        LIMIT 1
    ");
    $stmt->execute(['entry_id' => $entryId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function externalShopStoreMapping(PDO $pdo, array $payload): void
{
    ensureExternalShopDiscoverySchema($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO external_shop_mappings (
            provider,
            external_id,
            osm_type,
            osm_numeric_id,
            shop_id,
            status,
            external_name,
            external_address,
            normalized_name,
            external_lat,
            external_lon,
            website,
            tags_json,
            payload_json,
            created_by_user_id,
            first_seen_at,
            last_seen_at,
            last_fetched_at
        ) VALUES (
            :provider,
            :external_id,
            :osm_type,
            :osm_numeric_id,
            :shop_id,
            :status,
            :external_name,
            :external_address,
            :normalized_name,
            :external_lat,
            :external_lon,
            :website,
            :tags_json,
            :payload_json,
            :created_by_user_id,
            NOW(),
            NOW(),
            NOW()
        )
        ON DUPLICATE KEY UPDATE
            osm_type = VALUES(osm_type),
            osm_numeric_id = VALUES(osm_numeric_id),
            shop_id = VALUES(shop_id),
            status = VALUES(status),
            external_name = VALUES(external_name),
            external_address = VALUES(external_address),
            normalized_name = VALUES(normalized_name),
            external_lat = VALUES(external_lat),
            external_lon = VALUES(external_lon),
            website = VALUES(website),
            tags_json = VALUES(tags_json),
            payload_json = VALUES(payload_json),
            created_by_user_id = COALESCE(VALUES(created_by_user_id), created_by_user_id),
            last_seen_at = NOW(),
            last_fetched_at = NOW()
    ");
    $stmt->execute([
        'provider' => $payload['provider'],
        'external_id' => $payload['external_id'],
        'osm_type' => $payload['osm_type'] ?? null,
        'osm_numeric_id' => $payload['osm_numeric_id'] ?? null,
        'shop_id' => $payload['shop_id'] ?? null,
        'status' => $payload['status'] ?? 'unmapped',
        'external_name' => $payload['external_name'],
        'external_address' => $payload['external_address'] ?? null,
        'normalized_name' => normalizeExternalShopName($payload['external_name'] ?? ''),
        'external_lat' => $payload['external_lat'] ?? null,
        'external_lon' => $payload['external_lon'] ?? null,
        'website' => $payload['website'] ?? null,
        'tags_json' => $payload['tags_json'] ?? null,
        'payload_json' => $payload['payload_json'] ?? null,
        'created_by_user_id' => $payload['created_by_user_id'] ?? null,
    ]);
}

function externalShopBuildFeaturePayload(array $feature): ?array
{
    $tags = is_array($feature['tags'] ?? null) ? $feature['tags'] : [];
    $lon = isset($feature['lon']) ? (float)$feature['lon'] : (isset($feature['center']['lon']) ? (float)$feature['center']['lon'] : null);
    $lat = isset($feature['lat']) ? (float)$feature['lat'] : (isset($feature['center']['lat']) ? (float)$feature['center']['lat'] : null);
    $name = trim((string)($tags['name'] ?? ''));
    if ($name === '' || $lat === null || $lon === null) {
        return null;
    }

    $elementType = (string)($feature['type'] ?? 'node');
    $numericId = isset($feature['id']) ? (int)$feature['id'] : null;

    return [
        'provider' => 'osm',
        'external_id' => $elementType . ':' . (string)($numericId ?? (externalShopFormatCoordinate($lat) . ':' . externalShopFormatCoordinate($lon))),
        'osm_type' => $elementType,
        'osm_numeric_id' => $numericId,
        'name' => $name,
        'address' => externalShopComposeAddressFromTags($tags),
        'website' => trim((string)($tags['website'] ?? ($tags['contact:website'] ?? ''))),
        'opening_hours_note' => trim((string)($tags['opening_hours'] ?? '')),
        'opening_hours_structured' => externalShopBuildStructuredOpeningHours($tags['opening_hours'] ?? null),
        'external_url' => externalShopBuildExternalUrl('osm', $elementType, $numericId, $lat, $lon),
        'lat' => $lat,
        'lon' => $lon,
        'tags' => $tags,
        'raw_payload' => $feature,
    ];
}

function externalShopStatusToClassification(string $status): string
{
    switch ($status) {
        case 'matched_existing':
        case 'imported_as_shop':
            return 'existing';
        case 'dismissed_false_positive':
            return 'false_positive';
        case 'dismissed_duplicate':
            return 'duplicate';
        default:
            return 'new';
    }
}

function externalShopBuildExistingShopData(?array $row): ?array
{
    if (!$row) {
        return null;
    }

    $shopId = null;
    if (!empty($row['shop_id'])) {
        $shopId = (int)$row['shop_id'];
    } elseif (array_key_exists('adresse', $row) || array_key_exists('distance_m', $row)) {
        $shopId = !empty($row['id']) ? (int)$row['id'] : null;
    }
    if (!$shopId) {
        return null;
    }

    return [
        'id' => $shopId,
        'name' => $row['shop_name'] ?? ($row['name'] ?? null),
        'address' => $row['shop_address'] ?? ($row['adresse'] ?? null),
        'distance_m' => isset($row['distance_m']) ? (float)$row['distance_m'] : null,
    ];
}

function externalShopUpsertEntryFromFeature(PDO $pdo, array $feature, ?int $currentUserId = null): ?array
{
    $payload = externalShopBuildFeaturePayload($feature);
    if (!$payload) {
        return null;
    }

    $storedMapping = externalShopLoadStoredMapping($pdo, $payload['provider'], $payload['external_id']);
    $status = (string)($storedMapping['status'] ?? 'unmapped');
    $shopId = isset($storedMapping['shop_id']) ? (int)$storedMapping['shop_id'] : null;
    $existingShop = $storedMapping ? externalShopBuildExistingShopData($storedMapping) : null;
    $transientDuplicateCandidate = null;

    if (!in_array($status, ['matched_existing', 'imported_as_shop', 'dismissed_false_positive', 'dismissed_duplicate'], true)) {
        $match = externalShopFindExistingMatch($pdo, $payload['name'], $payload['lat'], $payload['lon']);
        if ($match && ($match['match_type'] ?? '') === 'existing') {
            $status = 'matched_existing';
            $shopId = (int)$match['id'];
            $existingShop = externalShopBuildExistingShopData($match);
        } elseif ($match && ($match['match_type'] ?? '') === 'probable_duplicate') {
            $transientDuplicateCandidate = externalShopBuildExistingShopData($match);
        }
    }

    externalShopStoreMapping($pdo, [
        'provider' => $payload['provider'],
        'external_id' => $payload['external_id'],
        'osm_type' => $payload['osm_type'],
        'osm_numeric_id' => $payload['osm_numeric_id'],
        'shop_id' => $shopId,
        'status' => $status,
        'external_name' => $payload['name'],
        'external_address' => $payload['address'],
        'external_lat' => $payload['lat'],
        'external_lon' => $payload['lon'],
        'website' => $payload['website'] !== '' ? $payload['website'] : null,
        'tags_json' => json_encode($payload['tags'], JSON_UNESCAPED_UNICODE),
        'payload_json' => json_encode($payload['raw_payload'], JSON_UNESCAPED_UNICODE),
        'created_by_user_id' => $currentUserId,
    ]);

    $entry = externalShopLoadStoredMapping($pdo, $payload['provider'], $payload['external_id']);
    if (!$entry) {
        return null;
    }

    $classification = externalShopStatusToClassification((string)$entry['status']);
    $falsePositiveCount = (int)($entry['feedback_false_positive_count'] ?? 0);
    $confirmedValidCount = (int)($entry['feedback_confirmed_valid_count'] ?? 0);

    if ($classification === 'new' && $falsePositiveCount > 0 && $falsePositiveCount > $confirmedValidCount) {
        $classification = 'flagged_false_positive';
    }
    if ($classification === 'new' && $transientDuplicateCandidate) {
        $classification = 'probable_duplicate';
        $existingShop = $transientDuplicateCandidate;
    } elseif (($classification === 'existing' || $classification === 'duplicate') && !$existingShop) {
        $existingShop = externalShopBuildExistingShopData($entry);
    }

    return [
        'entry_id' => (int)$entry['id'],
        'provider' => (string)$entry['provider'],
        'external_id' => (string)$entry['external_id'],
        'name' => $payload['name'],
        'address' => $payload['address'],
        'website' => $payload['website'] !== '' ? $payload['website'] : null,
        'opening_hours_note' => $payload['opening_hours_note'] !== '' ? $payload['opening_hours_note'] : null,
        'opening_hours_structured' => $payload['opening_hours_structured'],
        'external_url' => $payload['external_url'],
        'lat' => $payload['lat'],
        'lon' => $payload['lon'],
        'classification' => $classification,
        'mapping_status' => (string)$entry['status'],
        'existing_shop' => $existingShop,
        'feedback_false_positive_count' => $falsePositiveCount,
        'feedback_confirmed_valid_count' => $confirmedValidCount,
    ];
}

function externalShopGetDiscoverySlotStatus(PDO $pdo, int $userId): array
{
    ensureExternalShopDiscoverySchema($pdo);
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM shop_discovery_origins
        WHERE created_by_user_id = :user_id
          AND origin_type = 'external_discovery'
          AND counts_against_limit = 1
          AND released_at IS NULL
    ");
    $stmt->execute(['user_id' => $userId]);
    $activeSlots = (int)$stmt->fetchColumn();
    $remainingSlots = max(0, EXTERNAL_SHOP_DISCOVERY_SLOT_LIMIT - $activeSlots);

    return [
        'active_slots' => $activeSlots,
        'max_slots' => EXTERNAL_SHOP_DISCOVERY_SLOT_LIMIT,
        'remaining_slots' => $remainingSlots,
    ];
}

function externalShopAssertDiscoverySlotsAvailable(PDO $pdo, int $userId): array
{
    $slotStatus = externalShopGetDiscoverySlotStatus($pdo, $userId);
    if (($slotStatus['remaining_slots'] ?? 0) <= 0) {
        throw new RuntimeException('Deine 5 Discovery-Slots sind aktuell belegt. Sobald bei einem dieser Shops ein erster Check-in erfolgt, wird wieder ein Slot frei.');
    }
    return $slotStatus;
}

function externalShopRecordSearchRequest(PDO $pdo, int $userId, float $north, float $south, float $east, float $west, int $zoom): void
{
    $stmt = $pdo->prepare("
        INSERT INTO external_shop_search_requests (user_id, north, south, east, west, zoom_level)
        VALUES (:user_id, :north, :south, :east, :west, :zoom_level)
    ");
    $stmt->execute([
        'user_id' => $userId,
        'north' => $north,
        'south' => $south,
        'east' => $east,
        'west' => $west,
        'zoom_level' => $zoom,
    ]);
}

function externalShopAssertSearchAllowed(PDO $pdo, int $userId, float $north, float $south, float $east, float $west, int $zoom): void
{
    ensureExternalShopDiscoverySchema($pdo);

    if ($zoom < EXTERNAL_SHOP_DISCOVERY_MIN_ZOOM) {
        throw new RuntimeException('Bitte zoome weiter hinein, bevor du im Kartenausschnitt nach Eisdielen suchst.');
    }

    $diagonalMeters = externalShopDistanceMeters($north, $west, $south, $east);
    if ($diagonalMeters > EXTERNAL_SHOP_DISCOVERY_MAX_BBOX_DIAGONAL_M) {
        throw new RuntimeException('Der Kartenausschnitt ist noch zu groß. Bitte zoome etwas näher heran.');
    }

    $slotStatus = externalShopGetDiscoverySlotStatus($pdo, $userId);
    if (($slotStatus['remaining_slots'] ?? 0) <= 0) {
        throw new RuntimeException('Aktuell sind keine freien Discovery-Slots verfügbar.');
    }

    $stmt = $pdo->prepare("
        SELECT requested_at
        FROM external_shop_search_requests
        WHERE user_id = :user_id
        ORDER BY requested_at DESC
        LIMIT 1
    ");
    $stmt->execute(['user_id' => $userId]);
    $lastRequestedAt = $stmt->fetchColumn();
    if ($lastRequestedAt) {
        $secondsSinceLastRequest = time() - strtotime((string)$lastRequestedAt);
        if ($secondsSinceLastRequest < EXTERNAL_SHOP_DISCOVERY_MIN_SEARCH_INTERVAL_SECONDS) {
            $remainingSeconds = EXTERNAL_SHOP_DISCOVERY_MIN_SEARCH_INTERVAL_SECONDS - $secondsSinceLastRequest;
            throw new RuntimeException("Bitte warte noch {$remainingSeconds} Sekunden bis zur nächsten Discovery-Suche.");
        }
    }
}

function externalShopSearchBounds(
    PDO $pdo,
    float $north,
    float $south,
    float $east,
    float $west,
    int $zoom,
    int $userId,
    string $query = ''
): array {
    ensureExternalShopDiscoverySchema($pdo);
    externalShopAssertSearchAllowed($pdo, $userId, $north, $south, $east, $west, $zoom);
    externalShopRecordSearchRequest($pdo, $userId, $north, $south, $east, $west, $zoom);

    $features = externalShopFetchBoundsOverpassResults($north, $south, $east, $west);
    $centerLat = ($north + $south) / 2;
    $centerLon = ($east + $west) / 2;

    $results = [];
    $seen = [];
    $hiddenCounts = [
        'existing' => 0,
        'duplicate' => 0,
        'false_positive' => 0,
    ];

    foreach ($features as $feature) {
        $entry = externalShopUpsertEntryFromFeature($pdo, $feature, $userId);
        if (!$entry) {
            continue;
        }

        $dedupeKey = $entry['provider'] . ':' . $entry['external_id'];
        if (isset($seen[$dedupeKey])) {
            continue;
        }
        $seen[$dedupeKey] = true;

        if (!externalShopMatchesFilter($entry, $query)) {
            continue;
        }

        $entry['distance_m'] = externalShopDistanceMeters($centerLat, $centerLon, (float)$entry['lat'], (float)$entry['lon']);

        switch ($entry['classification']) {
            case 'existing':
                $hiddenCounts['existing'] += 1;
                continue 2;
            case 'probable_duplicate':
            case 'duplicate':
                $hiddenCounts['duplicate'] += 1;
                continue 2;
            case 'false_positive':
                $hiddenCounts['false_positive'] += 1;
                continue 2;
            default:
                $results[] = $entry;
        }
    }

    usort($results, static function (array $left, array $right): int {
        $distanceCompare = ((float)($left['distance_m'] ?? 0)) <=> ((float)($right['distance_m'] ?? 0));
        if ($distanceCompare !== 0) {
            return $distanceCompare;
        }
        return strcasecmp((string)($left['name'] ?? ''), (string)($right['name'] ?? ''));
    });

    $truncated = false;
    if (count($results) > EXTERNAL_SHOP_DISCOVERY_MAX_RESULTS) {
        $results = array_slice($results, 0, EXTERNAL_SHOP_DISCOVERY_MAX_RESULTS);
        $truncated = true;
    }

    return [
        'results' => $results,
        'meta' => [
            'hidden_existing' => $hiddenCounts['existing'],
            'hidden_duplicate' => $hiddenCounts['duplicate'],
            'hidden_false_positive' => $hiddenCounts['false_positive'],
            'truncated' => $truncated,
            'total_external_hits' => count($features),
            'slots' => externalShopGetDiscoverySlotStatus($pdo, $userId),
        ],
    ];
}

function externalShopCreateDiscoveryOrigin(PDO $pdo, int $shopId, int $userId, ?int $externalShopMappingId): void
{
    ensureExternalShopDiscoverySchema($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO shop_discovery_origins (
            shop_id,
            created_by_user_id,
            external_shop_mapping_id,
            origin_type,
            counts_against_limit
        ) VALUES (
            :shop_id,
            :created_by_user_id,
            :external_shop_mapping_id,
            'external_discovery',
            1
        )
        ON DUPLICATE KEY UPDATE
            created_by_user_id = VALUES(created_by_user_id),
            external_shop_mapping_id = VALUES(external_shop_mapping_id),
            counts_against_limit = VALUES(counts_against_limit),
            released_at = NULL
    ");
    $stmt->execute([
        'shop_id' => $shopId,
        'created_by_user_id' => $userId,
        'external_shop_mapping_id' => $externalShopMappingId,
    ]);
}

function externalShopReleaseDiscoverySlotForShop(PDO $pdo, int $shopId): void
{
    ensureExternalShopDiscoverySchema($pdo);
    $stmt = $pdo->prepare("
        UPDATE shop_discovery_origins
        SET counts_against_limit = 0,
            released_at = COALESCE(released_at, NOW())
        WHERE shop_id = :shop_id
          AND origin_type = 'external_discovery'
          AND counts_against_limit = 1
          AND released_at IS NULL
    ");
    $stmt->execute(['shop_id' => $shopId]);
}

function externalShopRecordFeedback(PDO $pdo, int $entryId, int $userId, string $feedbackType, ?string $note = null): array
{
    ensureExternalShopDiscoverySchema($pdo);
    $entry = externalShopLoadEntryById($pdo, $entryId);
    if (!$entry) {
        throw new RuntimeException('Discovery-Treffer wurde nicht gefunden.');
    }

    $allowedFeedbackTypes = ['false_positive', 'duplicate', 'bad_location', 'not_ice_cream', 'confirmed_valid'];
    if (!in_array($feedbackType, $allowedFeedbackTypes, true)) {
        throw new RuntimeException('Unbekannter Feedback-Typ.');
    }

    $stmt = $pdo->prepare("
        INSERT INTO external_shop_feedback (external_shop_mapping_id, user_id, feedback_type, note)
        VALUES (:entry_id, :user_id, :feedback_type, :note)
        ON DUPLICATE KEY UPDATE note = VALUES(note)
    ");
    $stmt->execute([
        'entry_id' => $entryId,
        'user_id' => $userId,
        'feedback_type' => $feedbackType,
        'note' => $note,
    ]);

    $countStmt = $pdo->prepare("
        SELECT feedback_type, COUNT(*) AS total
        FROM external_shop_feedback
        WHERE external_shop_mapping_id = :entry_id
        GROUP BY feedback_type
    ");
    $countStmt->execute(['entry_id' => $entryId]);
    $counts = [];
    foreach ($countStmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $counts[(string)$row['feedback_type']] = (int)$row['total'];
    }

    $falsePositiveCount = (int)($counts['false_positive'] ?? 0) + (int)($counts['not_ice_cream'] ?? 0);
    $confirmedValidCount = (int)($counts['confirmed_valid'] ?? 0);
    $newStatus = (string)$entry['status'];

    if (
        in_array($newStatus, ['unmapped', 'dismissed_false_positive'], true)
        && $falsePositiveCount >= EXTERNAL_SHOP_DISCOVERY_FALSE_POSITIVE_THRESHOLD
        && $falsePositiveCount > $confirmedValidCount
    ) {
        $newStatus = 'dismissed_false_positive';
    } elseif ($newStatus === 'dismissed_false_positive' && $falsePositiveCount < EXTERNAL_SHOP_DISCOVERY_FALSE_POSITIVE_THRESHOLD) {
        $newStatus = 'unmapped';
    } elseif ($newStatus === 'dismissed_false_positive' && $falsePositiveCount <= $confirmedValidCount) {
        $newStatus = 'unmapped';
    }

    $updateStmt = $pdo->prepare("
        UPDATE external_shop_mappings
        SET feedback_false_positive_count = :false_positive_count,
            feedback_confirmed_valid_count = :confirmed_valid_count,
            status = :status
        WHERE id = :entry_id
    ");
    $updateStmt->execute([
        'false_positive_count' => $falsePositiveCount,
        'confirmed_valid_count' => $confirmedValidCount,
        'status' => $newStatus,
        'entry_id' => $entryId,
    ]);

    $updatedEntry = externalShopLoadEntryById($pdo, $entryId);
    return [
        'entry' => $updatedEntry,
        'false_positive_count' => $falsePositiveCount,
        'confirmed_valid_count' => $confirmedValidCount,
    ];
}

function externalShopSearchNearby(PDO $pdo, float $lat, float $lon, int $radiusMeters, string $query = '', ?int $userId = null): array
{
    $radiusMeters = max(500, min(50000, $radiusMeters));
    $earthRadius = 6371000;
    $latDelta = rad2deg($radiusMeters / $earthRadius);
    $lonDivisor = cos(deg2rad($lat));
    if (abs($lonDivisor) < 0.000001) {
        $lonDivisor = 0.000001;
    }
    $lonDelta = rad2deg($radiusMeters / $earthRadius / $lonDivisor);

    $north = $lat + $latDelta;
    $south = $lat - $latDelta;
    $east = $lon + $lonDelta;
    $west = $lon - $lonDelta;

    if ($userId !== null && $userId > 0) {
        return externalShopSearchBounds(
            $pdo,
            $north,
            $south,
            $east,
            $west,
            EXTERNAL_SHOP_DISCOVERY_MIN_ZOOM,
            $userId,
            $query
        );
    }

    $features = externalShopFetchBoundsOverpassResults($north, $south, $east, $west);
    $results = [];
    foreach ($features as $feature) {
        $entry = externalShopUpsertEntryFromFeature($pdo, $feature, null);
        if (!$entry || !externalShopMatchesFilter($entry, $query)) {
            continue;
        }
        if (($entry['classification'] ?? 'new') !== 'new') {
            continue;
        }
        $entry['distance_m'] = externalShopDistanceMeters($lat, $lon, (float)$entry['lat'], (float)$entry['lon']);
        $results[] = $entry;
    }

    usort($results, static function (array $left, array $right): int {
        return ((float)($left['distance_m'] ?? 0)) <=> ((float)($right['distance_m'] ?? 0));
    });

    return [
        'results' => array_slice($results, 0, EXTERNAL_SHOP_DISCOVERY_MAX_RESULTS),
        'meta' => [
            'hidden_existing' => 0,
            'hidden_duplicate' => 0,
            'hidden_false_positive' => 0,
            'truncated' => count($results) > EXTERNAL_SHOP_DISCOVERY_MAX_RESULTS,
        ],
    ];
}
