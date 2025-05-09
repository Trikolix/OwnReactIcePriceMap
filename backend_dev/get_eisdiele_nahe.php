<?php
require_once  __DIR__ . '/db_connect.php';

$latitude = (float) $_GET['latitude'];
$longitude = (float) $_GET['longitude'];
$radius = (float) $_GET['radius']; // Radius in km

$sql = "SELECT e.id, e.name, e.adresse, e.latitude, e.longitude, 
           -- Letzter gemeldeter Preis für Kugel-Eis
           (SELECT p1.preis 
            FROM preise p1 
            WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel' 
            ORDER BY p1.gemeldet_am DESC 
            LIMIT 1) AS kugel_preis,
           
           -- Letzter gemeldeter Preis für Softeis
           (SELECT p2.preis 
            FROM preise p2 
            WHERE p2.eisdiele_id = e.id AND p2.typ = 'softeis' 
            ORDER BY p2.gemeldet_am DESC 
            LIMIT 1) AS softeis_preis,

            -- Entfernung zur Suchposition
           (6371 * ACOS(
               COS(RADIANS(:latitude)) * COS(RADIANS(e.latitude)) * 
               COS(RADIANS(e.longitude) - RADIANS(:longitude)) + 
               SIN(RADIANS(:latitude)) * SIN(RADIANS(e.latitude))
           )) AS entfernung_km
    FROM eisdielen e
    LEFT JOIN preise p ON e.id = p.eisdiele_id
    WHERE (
        6371 * ACOS(
            COS(RADIANS(:latitude)) * COS(RADIANS(e.latitude)) * 
            COS(RADIANS(e.longitude) - RADIANS(:longitude)) + 
            SIN(RADIANS(:latitude)) * SIN(RADIANS(e.latitude))
        )
    ) <= :radius
    GROUP BY e.id
    ORDER BY entfernung_km ASC;";

$stmt = $pdo->prepare($sql);
$stmt->execute(["latitude" => $latitude, "longitude" => $longitude, "radius" => $radius]);
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($eisdielen as &$eisdiele) {
    $eisdiele['latitude'] = floatval($eisdiele['latitude']);
    $eisdiele['longitude'] = floatval($eisdiele['longitude']);
    $eisdiele['kugel_preis'] = isset($eisdiele['kugel_preis']) ? floatval($eisdiele['kugel_preis']) : null;
    $eisdiele['softeis_preis'] = isset($eisdiele['softeis_preis']) ? floatval($eisdiele['softeis_preis']) : null;
    $eisdiele['entfernung_km'] = floatval($eisdiele['entfernung_km']);
}
unset($eisdiele); // Wichtiger Schritt, um Referenz-Probleme zu vermeiden


echo json_encode(["eisdielen" => $eisdielen], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
