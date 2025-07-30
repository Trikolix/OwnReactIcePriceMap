<?php
require_once  __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/levelsystem.php';
require_once  __DIR__ . '/evaluators/IceShopSubmitCountEvaluator.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['name']) || !isset($data['adresse']) || !isset($data['latitude']) || !isset($data['longitude']) || !isset($data['openingHours']) || !isset($data['userId'])) {
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
    $stmt = $pdo->prepare("SELECT id FROM laender WHERE name = ?");
    $stmt->execute([$land]);
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $insert = $pdo->prepare("INSERT INTO laender (name, country_code) VALUES (?, ?)");
    $insert->execute([$land, $country_code]);
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

$sql = "INSERT INTO eisdielen (name, adresse, latitude, longitude, website, openingHours, user_id, landkreis_id, bundesland_id, land_id) VALUES (:name, :adresse, :latitude, :longitude, :website, :openingHours, :userId, :landkreisId, :bundeslandId, :landId)";
$stmt = $pdo->prepare($sql);

$lat = $data['latitude'];
$lon = $data['longitude'];
$location = getLocationDetailsFromCoords($lat, $lon);
if ($location) {
    $landId = getOrCreateLandId($pdo, $location['land'], $location['country_code']);

    $bundeslandId = null;
    $landkreisId = null;
    if (!empty($location['bundesland'])) {
        $bundeslandId = getOrCreateBundeslandId($pdo, $location['bundesland'], $location['bundesland_iso'] ?? null, $landId);
    }

    if (!empty($location['landkreis']) && $bundeslandId !== null) {
        $landkreisId = getOrCreateLandkreisId($pdo, $location['landkreis'], $bundeslandId);
    }
    try {
        $stmt->execute([
            ':name' => $data['name'],
            ':adresse' => $data['adresse'],
            ':latitude' => floatval($data['latitude']),
            ':longitude' => floatval($data['longitude']),
            ':website' => $data['website'] ?? null,
            ':openingHours' => $data['openingHours'] ?? null,
            ':userId' => intval($data['userId']),
            ':landkreisId' => $landkreisId,
            ':bundeslandId' => $bundeslandId,
            ':landId' => $landId
        ]);
        // Evaluate Awards
        $evaluators = [
            new IceShopSubmitCountEvaluator()
        ];
        
        $newAwards = [];
        foreach ($evaluators as $evaluator) {
            $newAwards = array_merge($newAwards, $evaluator->evaluate($data['userId']));
        }

        $levelChange = updateUserLevelIfChanged($pdo, $data['userId']);

        echo json_encode([
            "status" => "success",
            'new_awards' => $newAwards,
            'level_up' => $levelChange['level_up'] ?? false,
            'new_level' => $levelChange['level_up'] ? $levelChange['new_level'] : null,
            'level_name' => $levelChange['level_up'] ? $levelChange['level_name'] : null
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Konnte Land/Bundesland/Landkreis nicht bestimmen."]);
}

?>