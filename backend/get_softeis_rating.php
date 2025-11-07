<?php
require_once __DIR__ . '/db_connect.php';

$nutzerId = null;
if (isset($_GET['nutzer_id'])) {
    $nutzerId = intval($_GET['nutzer_id']);
} elseif (isset($_GET['user_id'])) {
    $nutzerId = intval($_GET['user_id']);
}

$sql = "WITH bewertete_checkins AS (
    SELECT
        nutzer_id,
        eisdiele_id,
        geschmackbewertung,
        waffelbewertung,
        preisleistungsbewertung,
        CASE
            WHEN waffelbewertung IS NULL THEN geschmackbewertung
            ELSE (4 * geschmackbewertung + waffelbewertung) / 5.0
        END AS geschmacksfaktor,
        ROUND(
            0.7 * (
                CASE
                    WHEN waffelbewertung IS NULL THEN geschmackbewertung
                    ELSE (4 * geschmackbewertung + waffelbewertung) / 5.0
                END
            ) + 0.3 * preisleistungsbewertung, 2
        ) AS score
    FROM checkins
    WHERE
        typ = 'Softeis'
        AND geschmackbewertung IS NOT NULL
        AND preisleistungsbewertung IS NOT NULL" .
        ($nutzerId !== null ? " AND nutzer_id = :nutzerId" : "") . "
),
nutzer_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        COUNT(*) AS checkin_count,
    AVG(CASE WHEN geschmacksfaktor IS NOT NULL THEN geschmacksfaktor END) AS durchschnitt_geschmacksfaktor,
    AVG(CASE WHEN score IS NOT NULL THEN score END) AS durchschnitt_score,
    AVG(CASE WHEN geschmackbewertung IS NOT NULL THEN geschmackbewertung END) AS durchschnitt_geschmack,
    AVG(CASE WHEN waffelbewertung IS NOT NULL THEN waffelbewertung END) AS durchschnitt_waffel,
    AVG(CASE WHEN preisleistungsbewertung IS NOT NULL THEN preisleistungsbewertung END) AS durchschnitt_preisleistung
    FROM bewertete_checkins
    GROUP BY eisdiele_id, nutzer_id
),
gewichtete_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        checkin_count,
        SQRT(checkin_count) AS gewicht,
    (CASE WHEN durchschnitt_geschmacksfaktor IS NOT NULL THEN durchschnitt_geschmacksfaktor * SQRT(checkin_count) ELSE 0 END) AS gewichteter_geschmacksfaktor,
    (CASE WHEN durchschnitt_score IS NOT NULL THEN durchschnitt_score * SQRT(checkin_count) ELSE 0 END) AS gewichteter_score,
    (CASE WHEN durchschnitt_geschmack IS NOT NULL THEN durchschnitt_geschmack * SQRT(checkin_count) ELSE 0 END) AS gewichteter_geschmack,
    (CASE WHEN durchschnitt_waffel IS NOT NULL THEN durchschnitt_waffel * SQRT(checkin_count) ELSE 0 END) AS gewichteter_waffel,
    (CASE WHEN durchschnitt_preisleistung IS NOT NULL THEN durchschnitt_preisleistung * SQRT(checkin_count) ELSE 0 END) AS gewichteter_preisleistung
    FROM nutzer_scores
)
SELECT
    g.eisdiele_id,
    e.name,
    e.adresse,
    e.openingHours,
    e.latitude,
    e.longitude,
    SUM(g.checkin_count) AS checkin_anzahl,
    COUNT(DISTINCT g.nutzer_id) AS anzahl_nutzer,
    ROUND(SUM(g.gewichteter_geschmacksfaktor) / NULLIF(SUM(CASE WHEN g.gewichteter_geschmacksfaktor > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS finaler_geschmacksfaktor,
    ROUND(SUM(g.gewichteter_score) / NULLIF(SUM(CASE WHEN g.gewichteter_score > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS finaler_softeis_score,
    ROUND(SUM(g.gewichteter_geschmack) / NULLIF(SUM(CASE WHEN g.gewichteter_geschmack > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS avg_geschmack,
    ROUND(SUM(g.gewichteter_waffel) / NULLIF(SUM(CASE WHEN g.gewichteter_waffel > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS avg_waffel,
    ROUND(SUM(g.gewichteter_preisleistung) / NULLIF(SUM(CASE WHEN g.gewichteter_preisleistung > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS avg_preisleistung
FROM gewichtete_scores g
JOIN eisdielen e ON e.id = g.eisdiele_id
GROUP BY
    g.eisdiele_id,
    e.name,
    e.adresse,
    e.openingHours,
    e.latitude,
    e.longitude
ORDER BY finaler_softeis_score DESC;
";

// SQL vorbereiten und ausführen
$stmt = $pdo->prepare($sql);
if ($nutzerId !== null) {
    $stmt->bindValue(':nutzerId', $nutzerId, PDO::PARAM_INT);
}
$stmt->execute();
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

// JSON-Ausgabe
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
