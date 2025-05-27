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
GROUP  BY ep.landkreis_id, l.name, b.name
ORDER  BY durchschnittlicher_kugelpreis ASC; 
");
$stmtPricePerLandkreis->execute();
$pricePerLandkreis = $stmtPricePerLandkreis->fetchAll(PDO::FETCH_ASSOC);

// Price per Bundesland
$stmtPricePerBundesland = $pdo->prepare("
    SELECT b.id AS bundesland_id,
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
GROUP  BY b.id
ORDER  BY durchschnittlicher_kugelpreis ASC;
");
$stmtPricePerBundesland->execute();
$pricePerBundesland = $stmtPricePerBundesland->fetchAll(PDO::FETCH_ASSOC);

// most active users
$stmtMostActiveUsers = $pdo->prepare("
    SELECT
  u.id AS user_id,
  u.username AS username,
  COALESCE(c.checkin_count, 0) AS checkins,
  COALESCE(b.review_count, 0) AS reviews,
  COALESCE(p.price_reports, 0) AS preismeldungen,
  COALESCE(r.route_count, 0) AS routen,
  COALESCE(e.eisdielen_count, 0) AS eisdielen,
  (
    COALESCE(c.checkin_count, 0) +
    COALESCE(b.review_count, 0) +
    COALESCE(p.price_reports, 0) +
    COALESCE(r.route_count, 0) +
    COALESCE(e.eisdielen_count, 0)
  ) AS gesamt_aktivitaet
FROM nutzer u
LEFT JOIN (
  SELECT nutzer_id, COUNT(*) AS checkin_count
  FROM checkins
  GROUP BY nutzer_id
) c ON u.id = c.nutzer_id
LEFT JOIN (
  SELECT nutzer_id, COUNT(*) AS review_count
  FROM bewertungen
  GROUP BY nutzer_id
) b ON u.id = b.nutzer_id
LEFT JOIN (
  SELECT gemeldet_von, COUNT(*) AS price_reports
  FROM preise
  GROUP BY gemeldet_von
) p ON u.id = p.gemeldet_von
LEFT JOIN (
  SELECT nutzer_id, COUNT(*) AS route_count
  FROM routen
  GROUP BY nutzer_id
) r ON u.id = r.nutzer_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS eisdielen_count
  FROM eisdielen
  GROUP BY user_id
) e ON u.id = e.user_id
ORDER BY gesamt_aktivitaet DESC
LIMIT 20;
");
$stmtMostActiveUsers->execute();
$mostActiveUsers = $stmtMostActiveUsers->fetchAll(PDO::FETCH_ASSOC);


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
    "pricePerBundesland" => $pricePerBundesland,
    "mostActiveUsers" => $mostActiveUsers,
    "reviews" => $reviews,
    "checkins" => $checkins
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>