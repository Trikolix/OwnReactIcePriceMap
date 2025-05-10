<?php
// DB-Verbindung herstellen
require_once  __DIR__ . '/db_connect.php';

// Funktionen
function getLocationDetailsFromCoords($lat, $lon) {
    $url = "https://nominatim.openstreetmap.org/reverse?lat={$lat}&lon={$lon}&format=json&addressdetails=1";
    $opts = ["http" => ["header" => "User-Agent: EisdielenApp/1.0\r\n"]];
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
        'bundesland_iso' => $data['address']['state_code'] ?? null,
        'landkreis' => $landkreis,
        'landkreis_osm_id' => $data['osm_id'] ?? null
    ];
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

function getOrCreateLandkreisId($pdo, $name, $bundeslandId, $osmId = null) {
    $stmt = $pdo->prepare("SELECT id FROM landkreise WHERE name = ? AND bundesland_id = ?");
    $stmt->execute([$name, $bundeslandId]);
    $id = $stmt->fetchColumn();

    if ($id) {
        return $id;
    }

    $insert = $pdo->prepare("INSERT INTO landkreise (name, bundesland_id, osm_id) VALUES (?, ?, ?)");
    $insert->execute([$name, $bundeslandId, $osmId]);
    return $pdo->lastInsertId();
}

// Alle Eisdielen ohne Bundesland oder Landkreis
$stmt = $pdo->query("SELECT id, latitude, longitude FROM eisdielen WHERE bundesland_id IS NULL OR landkreis_id IS NULL");
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($eisdielen as $eisdiele) {
    $id = $eisdiele['id'];
    $lat = $eisdiele['latitude'];
    $lon = $eisdiele['longitude'];

    if (!$lat || !$lon) {
        echo "Eisdiele $id hat keine Koordinaten – übersprungen.\n";
        continue;
    }

    echo "🔄 Verarbeite Eisdiele $id ($lat, $lon)...\n";
    $location = getLocationDetailsFromCoords($lat, $lon);

    if (!$location) {
        echo "⚠️ Keine Geodaten gefunden für Eisdiele $id – übersprungen.\n";
        continue;
    }

    $bundeslandId = getOrCreateBundeslandId($pdo, $location['bundesland'], $location['bundesland_iso'] ?? null, null);
    $landkreisId = getOrCreateLandkreisId($pdo, $location['landkreis'], $bundeslandId, $location['landkreis_osm_id'] ?? null);

    $update = $pdo->prepare("UPDATE eisdielen SET bundesland_id = ?, landkreis_id = ? WHERE id = ?");
    $update->execute([$bundeslandId, $landkreisId, $id]);

    echo "✅ Eisdiele $id aktualisiert mit Bundesland-ID $bundeslandId und Landkreis-ID $landkreisId\n";
    sleep(1);
}

echo "\n🎉 Fertig!\n";
?>
