<?php
require_once 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['name']) || !isset($data['adresse']) || !isset($data['latitude']) || !isset($data['longitude']) || !isset($data['openingHours']) || !isset($data['komoot']) || !isset($data['userId'])) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter"]);
    exit;
}

function getLocationDetailsFromCoords($lat, $lon) {
    $url = "https://nominatim.openstreetmap.org/reverse?lat={$lat}&lon={$lon}&format=json&addressdetails=1";
    $opts = [
        "http" => [
            "header" => "User-Agent: Ice-App/0.1\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $json = file_get_contents($url, false, $context);
    $data = json_decode($json, true);

    if (!isset($data['address']['state'])) {
        return null;
    }
    // Verwende 'city', falls 'county' nicht vorhanden ist
    $landkreis = $data['address']['county'] ?? $data['address']['city'] ?? null;
    return [
        'bundesland' => $data['address']['state'],
        'bundesland_iso' => $data['address']['ISO3166-2-lvl4'] ?? null,
        'landkreis' => $landkreis,
        'landkreis_osm_id' => $data['osm_id'] ?? null  // beachte: ist meist die OSM-ID des Landkreises
    ];
    return null;
}

function getOrCreateBundeslandId($pdo, $bundeslandName, $iso = null) {
    $stmt = $pdo->prepare("SELECT id FROM bundeslaender WHERE name = ?");
    $stmt->execute([$bundeslandName]);
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $insert = $pdo->prepare("INSERT INTO bundeslaender (name, iso_code) VALUES (?, ?)");
    $insert->execute([$bundeslandName, $iso]);
    return $pdo->lastInsertId();
}

function getOrCreateLandkreisId($pdo, $landkreisName, $bundeslandId, $osmId = null) {
    $stmt = $pdo->prepare("SELECT id FROM landkreise WHERE name = ? AND bundesland_id = ?");
    $stmt->execute([$landkreisName, $bundeslandId]);
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $insert = $pdo->prepare("INSERT INTO landkreise (name, bundesland_id, osm_id) VALUES (?, ?, ?)");
    $insert->execute([$landkreisName, $bundeslandId, $osmId]);
    return $pdo->lastInsertId();
}

$sql = "INSERT INTO eisdielen (name, adresse, latitude, longitude, openingHours, komoot, user_id, landkreis_id, bundesland_id) VALUES (:name, :adresse, :latitude, :longitude, :openingHours, :komoot, :userId, :landkreisId, :bundeslandId)";
$stmt = $pdo->prepare($sql);

$lat = $data['latitude'];
$lon = $data['longitude'];
$location = getLocationDetailsFromCoords($lat, $lon);
if ($location) {
    $bundeslandId = getOrCreateBundeslandId($pdo, $location['bundesland'], $location['bundesland_iso']);
    $landkreisId = getOrCreateLandkreisId($pdo, $location['landkreis'], $bundeslandId, $location['landkreis_osm_id']);
    try {
        $stmt->execute([
            ':name' => $data['name'],
            ':adresse' => $data['adresse'],
            ':latitude' => floatval($data['latitude']),
            ':longitude' => floatval($data['longitude']),
            ':openingHours' => $data['openingHours'],
            ':komoot' => $data['komoot'],
            ':userId' => intval($data['userId']),
            ':landkreisId' => $landkreisId,
            ':bundeslandId' => $bundeslandId
        ]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Konnte Bundesland/Landkreis nicht bestimmen."]);
}

?>