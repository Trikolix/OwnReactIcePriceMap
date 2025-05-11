<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/checkin.php';


// Price Per Landkreis
$stmtPricePerLandkreis = $pdo->prepare("
    SELECT l.id AS landkreis_id,
       l.name AS landkreis_name,
       b.name AS bundesland_name,
       Count(ep.eisdiele_id) AS anzahl_eisdielen,
       Round(Avg(ep.kugel_preis), 2) AS durchschnittlicher_kugelpreis
FROM   (SELECT e.id AS eisdiele_id,
               e.landkreis_id,
               (SELECT p1.preis
                FROM   preise p1
                WHERE  p1.eisdiele_id = e.id
                       AND p1.typ = 'kugel'
                ORDER  BY p1.gemeldet_am DESC
                LIMIT  1) AS kugel_preis
        FROM   eisdielen e
        WHERE  e.landkreis_id IS NOT NULL) ep
       JOIN landkreise l
         ON ep.landkreis_id = l.id
       JOIN bundeslaender b
         ON l.bundesland_id = b.id
WHERE  ep.kugel_preis IS NOT NULL
GROUP  BY ep.landkreis_id
ORDER  BY durchschnittlicher_kugelpreis ASC; 
");
$stmtPricePerLandkreis->execute();
$pricePerLandkreis = $stmtPricePerLandkreis->fetchAll(PDO::FETCH_ASSOC);


// Latest Reviews
$stmtReviews = $pdo->prepare("SELECT b.*,
                                     e.name AS eisdiele_name,
                                     n.username AS nutzer_name,
                                     n.id AS nutzer_id                            
                              FROM bewertungen b
                              JOIN eisdielen e ON b.eisdiele_id = e.id
                              JOIN nutzer n ON b.nutzer_id = n.id
                              ORDER BY b.erstellt_am DESC
                              LIMIT 10
                            ");
$stmtReviews->execute();
$reviews = $stmtReviews->fetchAll(PDO::FETCH_ASSOC);

// Bewertungen durchgehen und Attribute anhängen
foreach ($reviews as &$review) { // ACHTUNG: Referenz verwenden (&$review)
    $stmtAttr = $pdo->prepare("
        SELECT a.name 
        FROM bewertung_attribute ba 
        JOIN attribute a ON ba.attribut_id = a.id 
        WHERE ba.bewertung_id = :bewertungId
    ");
    $stmtAttr->execute(['bewertungId' => $review['id']]);
    $attributes = $stmtAttr->fetchAll(PDO::FETCH_COLUMN);
    $review['bewertung_attribute'] = $attributes;
}
// Referenz wieder auflösen
unset($review);


$checkins = getCheckins(pdo: $pdo, limit: 10);
// JSON ausgeben
echo json_encode([
    "pricePerLandkreis" => $pricePerLandkreis,
    "reviews" => $reviews,
    "checkins" => $checkins
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>