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

$stmtUsersByLevel = $pdo->prepare("SELECT 
    n.id AS nutzer_id,
    n.username,    
    -- Anzahl Checkins
    COALESCE(ci_ohne_bild.count, 0) + COALESCE(ci_mit_bild.count, 0) AS anzahl_checkins,
    -- EP durch Check-ins ohne Bild
    COALESCE(ci_ohne_bild.count, 0) * 30 AS ep_checkins_ohne_bild,    
    -- EP durch Check-ins mit Bild
    COALESCE(ci_mit_bild.count, 0) * 45 AS ep_checkins_mit_bild,
    -- Anzahl Bewertungen
    COALESCE(bw.count, 0) AS anzahl_bewertungen,    
    -- EP durch Bewertungen
    COALESCE(bw.count, 0) * 20 AS ep_bewertungen, 
    -- Anzahl Preismeldungen
    COALESCE(pm.count, 0) AS anzahl_preismeldungen,   
    -- EP durch Preismeldungen
    COALESCE(pm.count, 0) * 15 AS ep_preismeldungen,
    -- Anzahl Routen
    COALESCE(r.count, 0) AS anzahl_routen,
    -- EP durch Routen
    COALESCE(r.count, 0) * 20 AS ep_routen,    
    -- EP durch Awards
    COALESCE(a.ep, 0) AS ep_awards,    
    -- EP durch eingetragene Eisdielen (mit und ohne Check-ins)
    COALESCE(e.ep, 0) AS ep_eisdielen,
    -- EP durch geworbene Nutzer
    COALESCE(gw.ep, 0) AS ep_geworbene_nutzer,    
    -- EP gesamt
    (
        COALESCE(ci_ohne_bild.count, 0) * 30 +
        COALESCE(ci_mit_bild.count, 0) * 45 +
        COALESCE(bw.count, 0) * 20 +
        COALESCE(pm.count, 0) * 15 +
        COALESCE(r.count, 0) * 20 +
        COALESCE(a.ep, 0) +
        COALESCE(e.ep, 0) +
        COALESCE(gw.ep, 0)
    ) AS ep_gesamt

FROM nutzer n

-- Check-ins ohne Bild
LEFT JOIN (
    SELECT c.nutzer_id, COUNT(*) AS count
    FROM checkins c
    LEFT JOIN bilder b ON b.checkin_id = c.id
    WHERE b.id IS NULL
    GROUP BY c.nutzer_id
) ci_ohne_bild ON ci_ohne_bild.nutzer_id = n.id

-- Check-ins mit mindestens einem Bild
LEFT JOIN (
    SELECT c.nutzer_id, COUNT(DISTINCT c.id) AS count
    FROM checkins c
    JOIN bilder b ON b.checkin_id = c.id
    GROUP BY c.nutzer_id
) ci_mit_bild ON ci_mit_bild.nutzer_id = n.id

-- Bewertungen
LEFT JOIN (
    SELECT nutzer_id, COUNT(*) AS count
    FROM bewertungen
    GROUP BY nutzer_id
) bw ON bw.nutzer_id = n.id

-- Preismeldungen
LEFT JOIN (
    SELECT gemeldet_von, COUNT(*) AS count
    FROM preise
    GROUP BY gemeldet_von
) pm ON pm.gemeldet_von = n.id

-- Routen
LEFT JOIN (
    SELECT nutzer_id, COUNT(*) AS count
    FROM routen
    GROUP BY nutzer_id
) r ON r.nutzer_id = n.id

-- Awards (Sonder-EP)
LEFT JOIN (
    SELECT ua.user_id, SUM(al.ep) AS ep
    FROM user_awards ua
    JOIN award_levels al 
        ON ua.award_id = al.award_id AND ua.level = al.level
    GROUP BY ua.user_id
) a ON a.user_id = n.id  

-- Eisdielen-EP (mit oder ohne Check-ins)
LEFT JOIN (
    SELECT 
        e.user_id,
        SUM(
            CASE 
                WHEN c.id IS NULL THEN 5  -- keine Check-ins
                ELSE 25                   -- mindestens ein Check-in
            END
        ) AS ep
    FROM eisdielen e
    LEFT JOIN checkins c ON c.eisdiele_id = e.id
    GROUP BY e.user_id
) e ON e.user_id = n.id

-- EP durch geworbene Nutzer (10 oder 250 je nach Aktivität)
    LEFT JOIN (
        SELECT 
            n.invited_by AS nutzer_id,
            SUM(
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM checkins c WHERE c.nutzer_id = n.id
                    ) THEN 250
                    ELSE 10
                END
            ) AS ep
        FROM nutzer n
        WHERE n.is_verified = 1 AND n.invited_by IS NOT NULL
        GROUP BY n.invited_by
    ) gw ON gw.nutzer_id = n.id

ORDER BY `ep_gesamt`  DESC;");
$stmtUsersByLevel->execute();
$usersByLevel = $stmtUsersByLevel->fetchAll(PDO::FETCH_ASSOC);

$stmtMostEatenFlavours = $pdo->prepare("
SELECT 
checkin_sorten.`sortenname`,
checkins.typ,
AVG(checkin_sorten.bewertung) AS bewertung,
COUNT(checkin_sorten.id) as anzahl
FROM checkin_sorten
JOIN checkins ON checkins.id = checkin_sorten.checkin_id
GROUP BY checkin_sorten.`sortenname`, checkins.typ
ORDER BY anzahl DESC, bewertung DESC;
");
$stmtMostEatenFlavours->execute();
$mostEatenFlavours = $stmtMostEatenFlavours->fetchAll(PDO::FETCH_ASSOC);

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
    "mostEatenFlavours" => $mostEatenFlavours,
    "reviews" => $reviews,
    "checkins" => $checkins,
    "usersByLevel" => $usersByLevel
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>