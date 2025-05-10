<?php
require_once  __DIR__ . '/db_connect.php';

$sql = "WITH bewertete_checkins AS (
    SELECT
        nutzer_id,
        eisdiele_id,
        geschmackbewertung,
        waffelbewertung,
        preisleistungsbewertung,
        ROUND(
            1 + 4 * (
                (
                    0.7 * ((4 * geschmackbewertung + waffelbewertung) / 25)
                    + 0.3 * preisleistungsbewertung
                ) / 2.2
            ), 4
        ) AS score
    FROM checkins
    WHERE
        typ = 'Softeis'
        AND geschmackbewertung IS NOT NULL
        AND waffelbewertung IS NOT NULL
        AND preisleistungsbewertung IS NOT NULL
),
nutzer_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        COUNT(*) AS checkin_count,
        AVG(score) AS durchschnitt_score,
        AVG(geschmackbewertung) AS durchschnitt_geschmack,
        AVG(waffelbewertung) AS durchschnitt_waffel,
        AVG(preisleistungsbewertung) AS durchschnitt_preisleistung
    FROM bewertete_checkins
    GROUP BY eisdiele_id, nutzer_id
),
gewichtete_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        SQRT(checkin_count) AS gewicht,
        durchschnitt_score * SQRT(checkin_count) AS gewichteter_score,
        durchschnitt_geschmack * SQRT(checkin_count) AS gewichteter_geschmack,
        durchschnitt_waffel * SQRT(checkin_count) AS gewichteter_waffel,
        durchschnitt_preisleistung * SQRT(checkin_count) AS gewichteter_preisleistung
    FROM nutzer_scores
)
SELECT
    g.eisdiele_id,
    e.name,
    e.adresse,
    e.openingHours,
    ROUND(SUM(g.gewichteter_score) / NULLIF(SUM(g.gewicht), 0), 2) AS finaler_softeis_score,
    ROUND(SUM(g.gewichteter_geschmack) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmack,
    ROUND(SUM(g.gewichteter_waffel) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_waffel,
    ROUND(SUM(g.gewichteter_preisleistung) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_preisleistung
FROM gewichtete_scores g
JOIN eisdielen e ON e.id = g.eisdiele_id
GROUP BY g.eisdiele_id, e.name
ORDER BY finaler_softeis_score DESC;";

// SQL ausführen
$stmt = $pdo->query($sql);
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

// JSON-Ausgabe
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE )
?>