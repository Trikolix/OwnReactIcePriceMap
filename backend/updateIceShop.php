<?php
require_once  __DIR__ . '/db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['shopId']) || !isset($data['name']) || !isset($data['adresse']) || !isset($data['latitude']) || !isset($data['longitude']) || !isset($data['userId'])) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter"]);
    exit;
}

$eisdieleId = intval($data['shopId']);
$userId = intval($data['userId']);

// Hole ursprünglichen Eintrag
$stmt = $pdo->prepare("SELECT user_id, erstellt_am FROM eisdielen WHERE id = ?");
$stmt->execute([$eisdieleId]);
$eisdiele = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$eisdiele) {
    echo json_encode(["status" => "error", "message" => "Eisdiele nicht gefunden"]);
    exit;
}

// Berechtigungsprüfung
$isAdmin = $userId === 1;
$isOwner = $userId === intval($eisdiele['user_id']);
$createdAt = strtotime($eisdiele['erstellt_am']);
$isRecent = (time() - $createdAt) <= 6 * 3600; // 6 Stunden

if (!$isAdmin && !($isOwner && $isRecent)) {
    echo json_encode(["status" => "error", "message" => "Keine Berechtigung zum Bearbeiten"]);
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

$lat = $data['latitude'];
$lon = $data['longitude'];
$location = getLocationDetailsFromCoords($lat, $lon);

if ($location) {
    $landId = getOrCreateLandId($pdo, $location['land'], $location['country_code']);
    $bundeslandId = getOrCreateBundeslandId($pdo, $location['bundesland'], $location['bundesland_iso'], $landId);
    $landkreisId = getOrCreateLandkreisId($pdo, $location['landkreis'], $bundeslandId);

    $sql = "UPDATE eisdielen 
            SET name = :name, adresse = :adresse, latitude = :latitude, longitude = :longitude, website = :website, openingHours = :openingHours, 
                landkreis_id = :landkreisId, bundesland_id = :bundeslandId, land_id = :landId
            WHERE id = :id";
    $stmt = $pdo->prepare($sql);

    try {
        $stmt->execute([
            ':name' => $data['name'],
            ':adresse' => $data['adresse'],
            ':latitude' => floatval($data['latitude']),
            ':longitude' => floatval($data['longitude']),
            ':website' => $data['website'],
            ':openingHours' => $data['openingHours'],
            ':landkreisId' => $landkreisId,
            ':bundeslandId' => $bundeslandId,
            ':landId' => $landId,
            ':id' => intval($data['shopId'])
        ]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Konnte Land/Bundesland/Landkreis nicht bestimmen."]);
}
?>
