CREATE OR REPLACE VIEW kugel_scores AS
WITH bewertete_checkins AS (
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
        AND (c.größenbewertung IS NOT NULL OR c.preisleistungsbewertung IS NOT NULL)
),
nutzer_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        COUNT(*) AS checkin_count,
        AVG(score) AS durchschnitt_score,
        AVG(geschmacksfaktor) AS durchschnitt_geschmacksfaktor,
        AVG(preisleistungsbewertung) AS durchschnitt_preisleistung,
        AVG(geschmackbewertung) AS durchschnitt_geschmack
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
        durchschnitt_preisleistung * SQRT(checkin_count) AS gewichteter_preisleistung,
        durchschnitt_geschmack * SQRT(checkin_count) AS gewichteter_geschmack,
        durchschnitt_geschmacksfaktor * SQRT(checkin_count) AS gewichteter_geschmacksfaktor
    FROM
        nutzer_scores
)
SELECT
    g.eisdiele_id,
    ROUND(SUM(g.gewichteter_score) / NULLIF(SUM(g.gewicht), 0), 2) AS finaler_kugel_score,
    ROUND(SUM(g.gewichteter_geschmack) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmack,
    ROUND(SUM(g.gewichteter_geschmacksfaktor) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmacksfaktor,
    ROUND(SUM(g.gewichteter_preisleistung) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_preisleistung
FROM
    gewichtete_scores g
GROUP BY
    g.eisdiele_id;
