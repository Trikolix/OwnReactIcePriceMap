<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
require_once 'db_connect.php';

$host = "localhost";
$dbname = "db_439770_2";
$username = "USER439770_wed";
$password = "K8RYTP23y8kWSdt";

// Verbindung zur Datenbank
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Datenbankverbindung fehlgeschlagen"]);
    exit();
}

if (!isset($_GET["minLat"]) || !isset($_GET["maxLat"]) || !isset($_GET["minLon"]) || !isset($_GET["maxLon"])) {
    echo json_encode(["error" => "Bitte minLat, minLon, maxLat und maxLon als Parameter übergeben!"]);
    exit;
}
$minLat = (float) $_GET['minLat'];
$minLon = (float) $_GET['minLon'];
$maxLat = (float) $_GET['maxLat'];
$maxLon = (float) $_GET['maxLon'];

$sql = "SELECT 
    e.id AS eisdielen_id,
    e.name AS eisdielen_name,
    e.adresse,
    e.latitude,
    e.longitude,
    b.avg_geschmack,
    b.avg_kugelgroesse,
    b.avg_waffel,
    -- Letzter gemeldeter Preis für Kugel-Eis
    (SELECT p1.preis 
     FROM preise p1 
     WHERE p1.eisdiele_id = eisdielen_id AND p1.typ = 'kugel' 
     ORDER BY p1.gemeldet_am DESC 
     LIMIT 1) AS kugel_preis,
    
    -- Letzter gemeldeter Preis für Softeis
    (SELECT p2.preis 
     FROM preise p2 
     WHERE p2.eisdiele_id = eisdielen_id AND p2.typ = 'softeis' 
     ORDER BY p2.gemeldet_am DESC 
     LIMIT 1) AS softeis_preis,
    (SELECT MIN(preis) FROM preise WHERE typ = 'kugel') AS min_preis,
    -- Preis-Leistungs-Verhältnis (PLV) berechnen
    ROUND(
        1 + 4 * (
            (3 * b.avg_geschmack + 2 * b.avg_kugelgroesse + 1 * b.avg_waffel) / 30
            * (0.75 + 0.25 * ( (SELECT MIN(preis) FROM preise WHERE typ = 'kugel') / p.preis ))
        ), 2
    ) AS PLV
FROM eisdielen e
-- Durchschnittliche Bewertungen pro Eisdiele berechnen
LEFT JOIN (
    SELECT 
        eisdiele_id,
        AVG(geschmack) AS avg_geschmack,
        AVG(kugelgroesse) AS avg_kugelgroesse,
        AVG(waffel) AS avg_waffel
    FROM bewertungen
    GROUP BY eisdiele_id
) b ON e.id = b.eisdiele_id
-- Aktuellsten Preis für Kugel pro Eisdiele finden
LEFT JOIN preise p ON e.id = p.eisdiele_id 
AND p.typ = 'kugel'
AND p.gemeldet_am = (
    SELECT MAX(p2.gemeldet_am) 
    FROM preise p2 
    WHERE p2.eisdiele_id = p.eisdiele_id 
    AND p2.typ = 'kugel'
)
WHERE e.latitude BETWEEN :minLat AND :maxLat 
AND e.longitude BETWEEN :minLon AND :maxLon
ORDER BY PLV DESC;
";
$stmt = $pdo->prepare($sql);
// Parameter binden
$stmt->bindParam(':minLat', $minLat);
$stmt->bindParam(':maxLat', $maxLat);
$stmt->bindParam(':minLon', $minLon);
$stmt->bindParam(':maxLon', $maxLon);
$stmt->execute();
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

// JSON-Ausgabe
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE )
?>