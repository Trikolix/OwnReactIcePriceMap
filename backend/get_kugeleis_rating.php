<?php
require_once  __DIR__ . '/db_connect.php';

$nutzerId = isset($_GET['nutzer_id']) ? intval($_GET['nutzer_id']) : null;

$sql = "WITH bewertete_checkins AS (
    SELECT
        c.nutzer_id,
        c.eisdiele_id,
        c.geschmackbewertung,
        c.waffelbewertung,
        c.größenbewertung,
        p.preis,
        CASE
            WHEN c.waffelbewertung IS NULL THEN c.geschmackbewertung
            ELSE ((4 * c.geschmackbewertung + c.waffelbewertung) / 5.0)
        END AS geschmacksfaktor,
        ((c.größenbewertung / p.preis) / (5.0 / 1.5) * 5.0) AS preisleistungsfaktor,
        ROUND(
            0.7 * (
                CASE
                    WHEN c.waffelbewertung IS NULL THEN c.geschmackbewertung
                    ELSE ((4 * c.geschmackbewertung + c.waffelbewertung) / 5.0)
                END
            ) +
            0.3 * ((c.größenbewertung / p.preis) / (5.0 / 1.5)) * 5.0,
            4
        ) AS score
    FROM checkins c
    JOIN preise p ON c.eisdiele_id = p.eisdiele_id
        AND p.typ = 'kugel'
        AND p.gemeldet_am = (
            SELECT MAX(p2.gemeldet_am)
            FROM preise p2
            WHERE p2.eisdiele_id = p.eisdiele_id
              AND p2.typ = 'kugel'
        )
    WHERE
        c.typ = 'Kugel'
        AND c.geschmackbewertung IS NOT NULL
        AND c.größenbewertung IS NOT NULL" .
        ($nutzerId ? " AND nutzer_id = :nutzerId" : "") . "
),
nutzer_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        COUNT(*) AS checkin_count,
        AVG(score) AS durchschnitt_score,
    	AVG(geschmacksfaktor) AS durchschnitt_geschmacksfaktor,
        AVG(preisleistungsfaktor) AS durchschnitt_plfaktor,
        AVG(geschmackbewertung) AS durchschnitt_geschmack,
        AVG(waffelbewertung) AS durchschnitt_waffel,
        AVG(größenbewertung) AS durchschnitt_größe
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
        durchschnitt_plfaktor * SQRT(checkin_count) AS gewichteter_plfaktor,
        durchschnitt_geschmack * SQRT(checkin_count) AS gewichteter_geschmack,
        durchschnitt_waffel * SQRT(checkin_count) AS gewichteter_waffel,
        durchschnitt_größe * SQRT(checkin_count) AS gewichtete_größe
    FROM nutzer_scores
),
final_scores AS (
    SELECT
        g.eisdiele_id,
        ROUND(SUM(g.gewichteter_score) / NULLIF(SUM(g.gewicht), 0), 2) AS finaler_score,
        ROUND(SUM(g.gewichteter_geschmacksfaktor) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmacksfaktor,
        ROUND(SUM(g.gewichteter_plfaktor) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_plfaktor,
        ROUND(SUM(g.gewichteter_geschmack) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmack,
        ROUND(SUM(g.gewichteter_waffel) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_waffel,
        ROUND(SUM(g.gewichtete_größe) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_größe,
        COUNT(DISTINCT g.nutzer_id) AS nutzeranzahl,
        SUM(SQRT(checkin_count)) AS gesamt_gewicht
    FROM gewichtete_scores g
    JOIN nutzer_scores n ON n.eisdiele_id = g.eisdiele_id AND n.nutzer_id = g.nutzer_id
    GROUP BY g.eisdiele_id
)
SELECT
    f.eisdiele_id,
    e.name,
    e.adresse,
    e.openingHours,
    f.finaler_score,
    f.avg_geschmacksfaktor,
    f.avg_plfaktor,
    f.avg_geschmack,
    f.avg_waffel,
    f.avg_größe,
    f.nutzeranzahl,
    COUNT(c.id) AS checkin_anzahl,
    p.preis
FROM final_scores f
JOIN eisdielen e ON e.id = f.eisdiele_id
LEFT JOIN checkins c ON c.eisdiele_id = f.eisdiele_id AND c.typ = 'Kugel'
LEFT JOIN preise p ON p.eisdiele_id = f.eisdiele_id
    AND p.typ = 'kugel'
    AND p.gemeldet_am = (
        SELECT MAX(p2.gemeldet_am)
        FROM preise p2
        WHERE p2.eisdiele_id = p.eisdiele_id
          AND p2.typ = 'kugel'
    )
GROUP BY f.eisdiele_id, e.name, e.adresse, e.openingHours, f.finaler_score,
         f.avg_geschmack, f.avg_waffel, f.avg_größe, f.nutzeranzahl, p.preis
ORDER BY finaler_score DESC";

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