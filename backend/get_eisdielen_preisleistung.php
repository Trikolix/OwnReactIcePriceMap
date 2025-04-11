<?php
require_once 'db_connect.php';

$sql = "SELECT 
    e.id AS eisdielen_id,
    e.name AS eisdielen_name,
    b.avg_geschmack,
    b.avg_kugelgroesse,
    b.avg_waffel,
    b.avg_auswahl,
    p.preis AS aktueller_preis,
    (SELECT MAX(preis) AS preis FROM preise WHERE typ = 'kugel' GROUP BY eisdiele_id ORDER BY preis LIMIT 1) AS min_preis,
    -- Preis-Leistungs-Verhältnis (PLV) berechnen
    ROUND(
        1 + 4 * (
            (3 * b.avg_geschmack + 2 * b.avg_kugelgroesse + 1 * b.avg_waffel) / 30
            * (0.65 + 0.35 * ( ( SELECT MAX(preis) AS preis FROM preise WHERE typ = 'kugel' GROUP BY eisdiele_id ORDER BY preis LIMIT 1) / p.preis ))
        ), 2
    ) AS PLV
FROM eisdielen e
-- Durchschnittliche Bewertungen pro Eisdiele berechnen
JOIN (
    SELECT 
        eisdiele_id,
        AVG(geschmack) AS avg_geschmack,
        AVG(kugelgroesse) AS avg_kugelgroesse,
        AVG(waffel) AS avg_waffel,
        AVG(auswahl) AS avg_auswahl
    FROM bewertungen
    GROUP BY eisdiele_id
) b ON e.id = b.eisdiele_id
-- Aktuellsten Preis für Kugel pro Eisdiele finden
JOIN preise p ON e.id = p.eisdiele_id 
WHERE p.typ = 'kugel'
AND p.gemeldet_am = (
    SELECT MAX(p2.gemeldet_am) 
    FROM preise p2 
    WHERE p2.eisdiele_id = p.eisdiele_id 
    AND p2.typ = 'kugel'
)
HAVING PLV IS NOT NULL
ORDER BY PLV DESC;";

// SQL ausführen
$stmt = $pdo->query($sql);
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

// JSON-Ausgabe
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE )
?>