<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
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
if (!isset($_GET["latitude"]) || !isset($_GET["longitude"]) || !isset($_GET["radius"])) {
    echo json_encode(["error" => "Bitte latitude, longitude und radius als Parameter übergeben"]);
    exit;
}

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


echo json_encode(["eisdielen" => $eisdielen], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
