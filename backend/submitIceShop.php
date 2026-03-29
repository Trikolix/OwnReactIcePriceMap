<?php
require_once  __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/levelsystem.php';
require_once  __DIR__ . '/evaluators/IceShopSubmitCountEvaluator.php';
require_once __DIR__ . '/lib/opening_hours.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/currency.php';
require_once __DIR__ . '/lib/shop_maintenance.php';
require_once __DIR__ . '/lib/external_shop_discovery.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['name']) || !isset($data['adresse']) || !isset($data['latitude']) || !isset($data['longitude'])) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter"]);
    exit;
}

$checkStmt = $pdo->prepare("
    SELECT id FROM eisdielen
    WHERE name = :name
    AND (
        6371 * acos(
            cos(radians(:lat)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(latitude))
        )
    ) < 0.2
");
$checkStmt->execute([
    ':name' => $data['name'],
    ':lat' => floatval($data['latitude']),
    ':lon' => floatval($data['longitude'])
]);

if ($checkStmt->fetch()) {
    echo json_encode([
        "status" => "error",
        "message" => "Eine Eisdiele mit diesem Namen ist bereits in der Nähe vorhanden."
    ]);
    exit;
}

function getLocationDetailsFromCoords($lat, $lon) {
    $url = "https://nominatim.openstreetmap.org/reverse?lat={$lat}&lon={$lon}&format=json&addressdetails=1&accept-language=de";
    $opts = [
        "http" => [
            "header" => "User-Agent: Ice-App/0.1\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $json = file_get_contents($url, false, $context);
    $data = json_decode($json, true);

    if (!isset($data['address']['country'])) {
        return null; // abbrechen, wenn nichts Brauchbares da ist
    }
    
     $address = $data['address'];

     // Bundesland / Region fallback
    $bundesland = $address['state']
        ?? $address['region']
        ?? $address['state_district']
        ?? $address['county']
        ?? $address['municipality']
        ?? $address['town']
        ?? $address['city']
        ?? $address['village']
        ?? $address['postcode']
        ?? 'Unbekannt';

    // 'county' -> fallback 'city' -> fallback 'town' -> fallback 'village'
    $landkreis = $address['county']
        ?? $address['city']
        ?? $address['town']
        ?? $address['village']
        ?? null;

    // ISO-Level automatisch bestimmen
    $iso = null;
    foreach ($address as $key => $value) {
        if (strpos($key, 'ISO3166-2') !== false) {
            $iso = $value;
            break;
        }
    }

    return [
        'land' => $address['country'],
        'country_code' => $address['country_code'],
        'bundesland' => $bundesland,
        'bundesland_iso' => $iso,
        'landkreis' => $landkreis,
    ];
}

function getOrCreateLandId($pdo, $land, $country_code = null) {
    $normalizedCountryCode = normalizeCountryCode($country_code);
    $resolvedCurrency = ensureCountryCurrencyAndRates($pdo, $normalizedCountryCode);
    $currencyId = $resolvedCurrency['currency_id'] ?? null;

    if ($normalizedCountryCode !== null && $currencyId === null) {
        throw new RuntimeException("Keine Waehrung fuer Land '{$land}' ({$normalizedCountryCode}) gefunden.");
    }

    $stmt = $pdo->prepare("SELECT id, country_code, waehrung_id FROM laender WHERE name = ?");
    $stmt->execute([$land]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $updates = [];
        $params = [];

        if ($normalizedCountryCode !== null && empty($row['country_code'])) {
            $updates[] = "country_code = ?";
            $params[] = $normalizedCountryCode;
        }

        if ($currencyId !== null && empty($row['waehrung_id'])) {
            $updates[] = "waehrung_id = ?";
            $params[] = $currencyId;
        }

        if ($updates) {
            $params[] = $row['id'];
            $update = $pdo->prepare("UPDATE laender SET " . implode(', ', $updates) . " WHERE id = ?");
            $update->execute($params);
        }

        return (int)$row['id'];
    }

    $insert = $pdo->prepare("INSERT INTO laender (name, country_code, waehrung_id) VALUES (?, ?, ?)");
    $insert->execute([$land, $normalizedCountryCode, $currencyId]);
    return $pdo->lastInsertId();
}

function getOrCreateBundeslandId($pdo, $bundeslandName, $iso = null, $landId) {
    $stmt = $pdo->prepare("SELECT id FROM bundeslaender WHERE name = ? AND land_id = ?");
    $stmt->execute([$bundeslandName, $landId]);
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $insert = $pdo->prepare("INSERT INTO bundeslaender (name, iso_code, land_id) VALUES (?, ?, ?)");
    $insert->execute([$bundeslandName, $iso, $landId]);
    return $pdo->lastInsertId();
}

function getOrCreateLandkreisId($pdo, $landkreisName, $bundeslandId) {
    $stmt = $pdo->prepare("SELECT id FROM landkreise WHERE name = ? AND bundesland_id = ?");
    $stmt->execute([$landkreisName, $bundeslandId]);
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $insert = $pdo->prepare("INSERT INTO landkreise (name, bundesland_id) VALUES (?, ?)");
    $insert->execute([$landkreisName, $bundeslandId]);
    return $pdo->lastInsertId();
}

$structuredPayload = $data['openingHoursStructured'] ?? null;
if (!is_array($structuredPayload) && array_key_exists('openingHours', $data)) {
    $legacyText = trim((string)$data['openingHours']);
    $structuredPayload = [
        'timezone' => OPENING_HOURS_DEFAULT_TIMEZONE,
        'note' => $legacyText !== '' ? $legacyText : null,
        'days' => []
    ];
}
$normalizedHours = normalize_structured_opening_hours($structuredPayload);
$openingHoursText = build_opening_hours_display($normalizedHours['rows'], $normalizedHours['note']);
$externalSource = is_array($data['external_source'] ?? null) ? $data['external_source'] : null;
$externalEntry = null;

if ($externalSource && !empty($externalSource['provider']) && !empty($externalSource['external_id'])) {
    $externalEntry = externalShopLoadStoredMapping(
        $pdo,
        (string)$externalSource['provider'],
        (string)$externalSource['external_id']
    );
    if ($externalEntry && in_array((string)$externalEntry['status'], ['matched_existing', 'imported_as_shop'], true) && !empty($externalEntry['shop_id'])) {
        echo json_encode([
            "status" => "error",
            "message" => "Dieser Discovery-Treffer ist bereits einer bestehenden Eisdiele zugeordnet."
        ]);
        exit;
    }
    externalShopAssertDiscoverySlotsAvailable($pdo, $currentUserId);
}

$sql = "INSERT INTO eisdielen (name, adresse, latitude, longitude, website, openingHours, opening_hours_note, user_id, landkreis_id, bundesland_id, land_id) VALUES (:name, :adresse, :latitude, :longitude, :website, :openingHours, :openingHoursNote, :userId, :landkreisId, :bundeslandId, :landId)";
$stmt = $pdo->prepare($sql);

$lat = $data['latitude'];
$lon = $data['longitude'];
$location = getLocationDetailsFromCoords($lat, $lon);
if ($location) {
    try {
        $landId = getOrCreateLandId($pdo, $location['land'], $location['country_code']);

        $bundeslandId = null;
        $landkreisId = null;
        if (!empty($location['bundesland'])) {
            $bundeslandId = getOrCreateBundeslandId($pdo, $location['bundesland'], $location['bundesland_iso'] ?? null, $landId);
        }

        if (!empty($location['landkreis']) && $bundeslandId !== null) {
            $landkreisId = getOrCreateLandkreisId($pdo, $location['landkreis'], $bundeslandId);
        }

        $pdo->beginTransaction();
        $stmt->execute([
            ':name' => $data['name'],
            ':adresse' => $data['adresse'],
            ':latitude' => floatval($data['latitude']),
            ':longitude' => floatval($data['longitude']),
            ':website' => $data['website'] ?? null,
            ':openingHours' => $openingHoursText,
            ':openingHoursNote' => $normalizedHours['note'] ?? null,
            ':userId' => $currentUserId,
            ':landkreisId' => $landkreisId,
            ':bundeslandId' => $bundeslandId,
            ':landId' => $landId
        ]);
        $newShopId = (int)$pdo->lastInsertId();
        replace_opening_hours($pdo, $newShopId, $normalizedHours['rows']);
        if ($externalSource && !empty($externalSource['provider']) && !empty($externalSource['external_id'])) {
            externalShopStoreMapping($pdo, [
                'provider' => (string)$externalSource['provider'],
                'external_id' => (string)$externalSource['external_id'],
                'osm_type' => $externalEntry['osm_type'] ?? null,
                'osm_numeric_id' => $externalEntry['osm_numeric_id'] ?? null,
                'shop_id' => $newShopId,
                'status' => 'imported_as_shop',
                'external_name' => (string)($externalSource['name'] ?? $data['name']),
                'external_address' => (string)($externalSource['address'] ?? $data['adresse']),
                'external_lat' => isset($externalSource['lat']) ? (float)$externalSource['lat'] : (float)$data['latitude'],
                'external_lon' => isset($externalSource['lon']) ? (float)$externalSource['lon'] : (float)$data['longitude'],
                'website' => (string)($externalSource['website'] ?? ($data['website'] ?? '')),
                'tags_json' => $externalEntry['tags_json'] ?? null,
                'payload_json' => json_encode($externalSource, JSON_UNESCAPED_UNICODE),
                'created_by_user_id' => $currentUserId,
            ]);
            $storedEntry = externalShopLoadStoredMapping(
                $pdo,
                (string)$externalSource['provider'],
                (string)$externalSource['external_id']
            );
            externalShopCreateDiscoveryOrigin(
                $pdo,
                $newShopId,
                $currentUserId,
                $storedEntry ? (int)$storedEntry['id'] : null
            );
        }
        $pdo->commit();
        shopMaintenanceSyncTaskForShop($pdo, $newShopId);
        // Evaluate Awards
        $evaluators = [
            new IceShopSubmitCountEvaluator()
        ];
        
        $newAwards = [];
        foreach ($evaluators as $evaluator) {
            $newAwards = array_merge($newAwards, $evaluator->evaluate($currentUserId));
        }

        $levelChange = updateUserLevelIfChanged($pdo, $currentUserId);

        echo json_encode([
            "status" => "success",
            'new_awards' => $newAwards,
            'level_up' => $levelChange['level_up'] ?? false,
            'new_level' => $levelChange['level_up'] ? $levelChange['new_level'] : null,
            'level_name' => $levelChange['level_up'] ? $levelChange['level_name'] : null,
            'discovery_slots' => $externalSource ? externalShopGetDiscoverySlotStatus($pdo, $currentUserId) : null
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Konnte Land/Bundesland/Landkreis nicht bestimmen."]);
}

?>
