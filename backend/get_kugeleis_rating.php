<?php
require_once  __DIR__ . '/db_connect.php';

$nutzerId = isset($_GET['nutzer_id']) ? intval($_GET['nutzer_id']) : null;

$sql = "WITH bewertete_checkins AS (
    SELECT
        c.nutzer_id,
        c.eisdiele_id,
        c.geschmackbewertung,
        c.waffelbewertung,
        -- alte Größe oder neue Preis-Leistung in EINEM Feld zusammenfassen
        CASE
            WHEN c.preisleistungsbewertung IS NULL THEN c.größenbewertung
            ELSE c.preisleistungsbewertung
        END AS preisleistungsbewertung,
        CASE
            WHEN c.waffelbewertung IS NULL THEN c.geschmackbewertung
            ELSE ((4 * c.geschmackbewertung + c.waffelbewertung) / 5.0)
        END AS geschmacksfaktor,
        ROUND(
            0.7 * (
                CASE
                    WHEN c.waffelbewertung IS NULL THEN c.geschmackbewertung
                    ELSE ((4 * c.geschmackbewertung + c.waffelbewertung) / 5.0)
                END
            ) +
            0.3 * (
                CASE
                    WHEN c.preisleistungsbewertung IS NULL THEN c.größenbewertung
                    ELSE c.preisleistungsbewertung
                END
            ),
            4
        ) AS score
    FROM checkins c
    WHERE
        c.typ = 'Kugel'
        AND c.geschmackbewertung IS NOT NULL
        AND (c.größenbewertung IS NOT NULL OR c.preisleistungsbewertung IS NOT NULL)" .
        ($nutzerId ? " AND nutzer_id = :nutzerId" : "") . "
),
nutzer_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        COUNT(*) AS checkin_count,
        AVG(score) AS durchschnitt_score,
        AVG(geschmacksfaktor) AS durchschnitt_geschmacksfaktor,
        AVG(preisleistungsbewertung) AS durchschnitt_preisleistung,
        AVG(geschmackbewertung) AS durchschnitt_geschmack,
        AVG(waffelbewertung) AS durchschnitt_waffel
    FROM bewertete_checkins
    GROUP BY eisdiele_id, nutzer_id
),
gewichtete_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        SQRT(checkin_count) AS gewicht,
        durchschnitt_score * SQRT(checkin_count) AS gewichteter_score,
        durchschnitt_geschmacksfaktor * SQRT(checkin_count) AS gewichteter_geschmacksfaktor,
        durchschnitt_preisleistung * SQRT(checkin_count) AS gewichtete_preisleistung,
        durchschnitt_geschmack * SQRT(checkin_count) AS gewichteter_geschmack,
        durchschnitt_waffel * SQRT(checkin_count) AS gewichteter_waffel
    FROM nutzer_scores
),
final_scores AS (
    SELECT
        g.eisdiele_id,
        ROUND(SUM(g.gewichteter_score) / NULLIF(SUM(g.gewicht), 0), 2) AS finaler_score,
        ROUND(SUM(g.gewichteter_geschmacksfaktor) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmacksfaktor,
        ROUND(SUM(g.gewichtete_preisleistung) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_preisleistung,
        ROUND(SUM(g.gewichteter_geschmack) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmack,
        ROUND(SUM(g.gewichteter_waffel) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_waffel,
        COUNT(DISTINCT g.nutzer_id) AS nutzeranzahl,
        SUM(gewicht) AS gesamt_gewicht
    FROM gewichtete_scores g
    GROUP BY g.eisdiele_id
)
SELECT
    f.eisdiele_id,
    e.name,
    e.adresse,
    e.openingHours,
    f.finaler_score,
    f.avg_geschmacksfaktor,
    f.avg_geschmack,
    f.avg_waffel,
    f.avg_preisleistung,
    f.nutzeranzahl,
    COUNT(c.id) AS checkin_anzahl,

    -- Letzter gemeldeter Preis + Währung + Umrechnung in EUR
    (SELECT p1.preis
     FROM preise p1
     WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel'
     ORDER BY p1.gemeldet_am DESC
     LIMIT 1) AS kugel_preis,

    (SELECT w1.symbol
     FROM preise p1
     LEFT JOIN waehrungen w1 ON p1.waehrung_id = w1.id
     WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel'
     ORDER BY p1.gemeldet_am DESC
     LIMIT 1) AS kugel_waehrung,

    (SELECT 
        CASE 
            WHEN w1.code = 'EUR' THEN p1.preis
            ELSE ROUND(p1.preis * COALESCE(wk1.kurs, 1), 2)
        END
     FROM preise p1
     LEFT JOIN waehrungen w1 ON p1.waehrung_id = w1.id
     LEFT JOIN wechselkurse wk1 ON p1.waehrung_id = wk1.von_waehrung_id 
         AND wk1.zu_waehrung_id = (SELECT id FROM waehrungen WHERE code = 'EUR')
     WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel'
     ORDER BY p1.gemeldet_am DESC
     LIMIT 1) AS kugel_preis_eur

FROM final_scores f
JOIN eisdielen e ON e.id = f.eisdiele_id
LEFT JOIN checkins c ON c.eisdiele_id = f.eisdiele_id AND c.typ = 'Kugel'
GROUP BY f.eisdiele_id, e.name, e.adresse, e.openingHours, f.finaler_score,
         f.avg_geschmack, f.avg_waffel, f.avg_preisleistung, f.nutzeranzahl
ORDER BY finaler_score DESC, kugel_preis_eur ASC, checkin_anzahl DESC;";

// SQL vorbereiten und ausführen
$stmt = $pdo->prepare($sql);
if ($nutzerId) {
    $stmt->bindValue(':nutzerId', $nutzerId, PDO::PARAM_INT);
}
$stmt->execute();
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

// JSON-Ausgabe
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>