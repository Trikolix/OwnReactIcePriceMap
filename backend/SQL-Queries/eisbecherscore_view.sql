CREATE OR REPLACE VIEW eisbecher_scores AS WITH bewertete_checkins AS(
    SELECT
        nutzer_id,
        eisdiele_id,
        geschmackbewertung,
        preisleistungsbewertung,
        CASE WHEN waffelbewertung IS NULL THEN(geschmackbewertung / 5.0) -- nur Geschmack
        ELSE((4 * geschmackbewertung + waffelbewertung) / 25.0) -- 4x Geschmack + 1x Waffel
		END AS geschmacksfaktor,
ROUND(
    1 + 4 *(
        (
            0.7 *(
                CASE WHEN waffelbewertung IS NULL THEN(geschmackbewertung / 5.0) ELSE(
                    (
                        4 * geschmackbewertung + waffelbewertung
                    ) / 25.0
                )
            END
        ) + 0.3 * preisleistungsbewertung
    ) / 2.2
),
4
) AS score
FROM
    checkins
WHERE
    typ = 'Eisbecher' AND geschmackbewertung IS NOT NULL AND preisleistungsbewertung IS NOT NULL
),
nutzer_scores AS(
    SELECT
        eisdiele_id,
        nutzer_id,
        COUNT(*) AS checkin_count,
        AVG(score) AS durchschnitt_score,
        AVG(geschmacksfaktor) AS durchschnitt_geschmacksfaktor,
        AVG(geschmackbewertung) AS durchschnitt_geschmack,
        AVG(preisleistungsbewertung) AS durchschnitt_preisleistung
    FROM
        bewertete_checkins
    GROUP BY
        eisdiele_id,
        nutzer_id
),
gewichtete_scores AS(
    SELECT
        eisdiele_id,
        nutzer_id,
        SQRT(checkin_count) AS gewicht,
        durchschnitt_score * SQRT(checkin_count) AS gewichteter_score,
        durchschnitt_geschmack * SQRT(checkin_count) AS gewichteter_geschmack,
        durchschnitt_geschmacksfaktor * SQRT(checkin_count) AS gewichteter_geschmacksfaktor,
        durchschnitt_preisleistung * SQRT(checkin_count) AS gewichteter_preisleistung
    FROM
        nutzer_scores
)
SELECT
    g.eisdiele_id,
    ROUND(
        SUM(g.gewichteter_score) / NULLIF(SUM(g.gewicht),
        0),
        2
    ) AS finaler_eisbecher_score,
    ROUND(
        SUM(g.gewichteter_geschmack) / NULLIF(SUM(g.gewicht),
        0),
        2
    ) AS avg_geschmack,
    ROUND(
        SUM(g.gewichteter_geschmacksfaktor) / NULLIF(SUM(g.gewicht),
        0),
        2
    ) AS avg_geschmacksfaktor,
    ROUND(
        SUM(g.gewichteter_preisleistung) / NULLIF(SUM(g.gewicht),
        0),
        2
    ) AS avg_preisleistung
FROM
    gewichtete_scores g
GROUP BY
    g.eisdiele_id;