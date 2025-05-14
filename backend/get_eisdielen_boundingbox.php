<?php
require_once  __DIR__ . '/db_connect.php';

if (!isset($_GET["minLat"]) || !isset($_GET["maxLat"]) || !isset($_GET["minLon"]) || !isset($_GET["maxLon"])) {
    echo json_encode(["error" => "Bitte minLat, minLon, maxLat und maxLon als Parameter übergeben!"]);
    exit;
}
$minLat = (float) $_GET['minLat'];
$minLon = (float) $_GET['minLon'];
$maxLat = (float) $_GET['maxLat'];
$maxLon = (float) $_GET['maxLon'];
$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : null;

$sql = "SELECT  
    e.id AS eisdielen_id,
    e.name AS eisdielen_name,
    e.adresse,
    e.latitude,
    e.longitude,

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

    -- Favoritenstatus des Nutzers
    CASE 
        WHEN f.nutzer_id IS NOT NULL THEN 1 
        ELSE 0 
    END AS is_favorit,

    -- Kugelscore aus View
    ks.finaler_kugel_score,
    -- Softeisscore aus View
    ss.finaler_softeis_score,
    -- Eisbecherscore aus View
    es.finaler_eisbecher_score

FROM eisdielen e

-- Letzter Kugelpreis pro Eisdiele
LEFT JOIN preise p ON e.id = p.eisdiele_id 
AND p.typ = 'kugel'
AND p.gemeldet_am = (
    SELECT MAX(p2.gemeldet_am) 
    FROM preise p2 
    WHERE p2.eisdiele_id = p.eisdiele_id 
    AND p2.typ = 'kugel'
)

-- Favoriten des Nutzers
LEFT JOIN favoriten f ON e.id = f.eisdiele_id AND f.nutzer_id = :userId

-- Score-Views
LEFT JOIN kugel_scores ks ON ks.eisdiele_id = e.id
LEFT JOIN softeis_scores ss ON ss.eisdiele_id = e.id
LEFT JOIN eisbecher_scores es ON es.eisdiele_id = e.id

-- Geografischer Filter
WHERE e.latitude BETWEEN :minLat AND :maxLat 
AND e.longitude BETWEEN :minLon AND :maxLon;
ORDER BY finaler_kugel_score DESC, 
         finaler_softeis_score DESC, 
         finaler_eisbecher_score DESC;";
$stmt = $pdo->prepare($sql);
// Parameter binden
$stmt->bindParam(':minLat', $minLat);
$stmt->bindParam(':maxLat', $maxLat);
$stmt->bindParam(':minLon', $minLon);
$stmt->bindParam(':maxLon', $maxLon);
$stmt->bindParam(':userId', $userId);
$stmt->execute();
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

// JSON-Ausgabe
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE )
?>