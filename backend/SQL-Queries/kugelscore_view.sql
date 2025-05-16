CREATE OR REPLACE VIEW kugel_scores AS
WITH bewertete_checkins AS (
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
        AND c.größenbewertung IS NOT NULL
),
nutzer_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        COUNT(*) AS checkin_count,
        AVG(score) AS durchschnitt_score,
        AVG(geschmacksfaktor) AS durchschnitt_geschmacksfaktor,
        AVG(preisleistungsfaktor) AS durchschnitt_preisleistungsfaktor,
        AVG(geschmackbewertung) AS durchschnitt_geschmack,
        AVG(preisleistungsfaktor) AS durchschnitt_preisleistung
    FROM
        bewertete_checkins
    GROUP BY
        eisdiele_id,
        nutzer_id
),
gewichtete_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        SQRT(checkin_count) AS gewicht,
        durchschnitt_score * SQRT(checkin_count) AS gewichteter_score,
        durchschnitt_preisleistungsfaktor * SQRT(checkin_count) AS gewichteter_preisleistungsfaktor,
        durchschnitt_geschmack * SQRT(checkin_count) AS gewichteter_geschmack,
        durchschnitt_geschmacksfaktor * SQRT(checkin_count) AS gewichteter_geschmacksfaktor,
        durchschnitt_preisleistung * SQRT(checkin_count) AS gewichteter_preisleistung
    FROM
        nutzer_scores
)
SELECT
    g.eisdiele_id,
    ROUND(SUM(g.gewichteter_score) / NULLIF(SUM(g.gewicht), 0), 2) AS finaler_kugel_score,
    ROUND(SUM(g.gewichteter_geschmack) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmack,
    ROUND(SUM(g.gewichteter_geschmacksfaktor) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmacksfaktor,
    ROUND(SUM(g.gewichteter_preisleistungsfaktor) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_preisleistungsfaktor,
    ROUND(SUM(g.gewichteter_preisleistung) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_preisleistung
FROM
    gewichtete_scores g
GROUP BY
    g.eisdiele_id;