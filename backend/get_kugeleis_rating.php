<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/attribute.php';
require_once  __DIR__ . '/lib/opening_hours.php';

$nutzerId = null;
if (isset($_GET['nutzer_id'])) {
    $nutzerId = intval($_GET['nutzer_id']);
} elseif (isset($_GET['user_id'])) {
    $nutzerId = intval($_GET['user_id']);
}
$openMoment = parse_opening_hours_reference($_GET['open_at'] ?? null);
$filterOpenNow = !$openMoment && isset($_GET['open_now']) && intval($_GET['open_now']) === 1;
$openFilterClause = '';
$openFilterParams = [];
$openReferenceIso = null;
if ($openMoment instanceof \DateTimeImmutable) {
    $openReferenceIso = $openMoment->format(\DateTimeInterface::ATOM);
    $openIds = get_open_shop_ids($pdo, $openMoment);
} elseif ($filterOpenNow) {
    $openIds = get_open_shop_ids($pdo);
} else {
    $openIds = null;
}
if (is_array($openIds)) {
    if (empty($openIds)) {
        echo json_encode([]);
        exit;
    }
    $placeholders = [];
    foreach ($openIds as $idx => $shopId) {
        $placeholder = ':openShop' . $idx;
        $placeholders[] = $placeholder;
        $openFilterParams[$placeholder] = $shopId;
    }
    $openFilterClause = ' AND f.eisdiele_id IN (' . implode(',', $placeholders) . ')';
}

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
        ($nutzerId !== null ? " AND nutzer_id = :nutzerId" : "") . "
),
nutzer_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        COUNT(*) AS checkin_count,
    AVG(CASE WHEN score IS NOT NULL THEN score END) AS durchschnitt_score,
    AVG(CASE WHEN geschmacksfaktor IS NOT NULL THEN geschmacksfaktor END) AS durchschnitt_geschmacksfaktor,
    AVG(CASE WHEN preisleistungsbewertung IS NOT NULL THEN preisleistungsbewertung END) AS durchschnitt_preisleistung,
    AVG(CASE WHEN geschmackbewertung IS NOT NULL THEN geschmackbewertung END) AS durchschnitt_geschmack,
    AVG(CASE WHEN waffelbewertung IS NOT NULL THEN waffelbewertung END) AS durchschnitt_waffel
    FROM bewertete_checkins
    GROUP BY eisdiele_id, nutzer_id
),
gewichtete_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        SQRT(checkin_count) AS gewicht,
        (CASE WHEN durchschnitt_score IS NOT NULL THEN durchschnitt_score * SQRT(checkin_count) ELSE 0 END) AS gewichteter_score,
        (CASE WHEN durchschnitt_geschmacksfaktor IS NOT NULL THEN durchschnitt_geschmacksfaktor * SQRT(checkin_count) ELSE 0 END) AS gewichteter_geschmacksfaktor,
        (CASE WHEN durchschnitt_preisleistung IS NOT NULL THEN durchschnitt_preisleistung * SQRT(checkin_count) ELSE 0 END) AS gewichtete_preisleistung,
        (CASE WHEN durchschnitt_geschmack IS NOT NULL THEN durchschnitt_geschmack * SQRT(checkin_count) ELSE 0 END) AS gewichteter_geschmack,
        (CASE WHEN durchschnitt_waffel IS NOT NULL THEN durchschnitt_waffel * SQRT(checkin_count) ELSE 0 END) AS gewichteter_waffel
    FROM nutzer_scores
),
final_scores AS (
    SELECT
        g.eisdiele_id,
    ROUND(SUM(g.gewichteter_score) / NULLIF(SUM(CASE WHEN g.gewichteter_score > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS finaler_score,
    ROUND(SUM(g.gewichteter_geschmacksfaktor) / NULLIF(SUM(CASE WHEN g.gewichteter_geschmacksfaktor > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS avg_geschmacksfaktor,
    ROUND(SUM(g.gewichtete_preisleistung) / NULLIF(SUM(CASE WHEN g.gewichtete_preisleistung > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS avg_preisleistung,
    ROUND(SUM(g.gewichteter_geschmack) / NULLIF(SUM(CASE WHEN g.gewichteter_geschmack > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS avg_geschmack,
    ROUND(SUM(g.gewichteter_waffel) / NULLIF(SUM(CASE WHEN g.gewichteter_waffel > 0 THEN g.gewicht ELSE 0 END), 0), 2) AS avg_waffel,
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
    e.opening_hours_note,
    e.status,
    e.latitude,
    e.longitude,
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
WHERE 1=1{$openFilterClause}
GROUP BY f.eisdiele_id, e.name, e.adresse, e.openingHours, e.latitude, e.longitude, f.finaler_score,
         f.avg_geschmack, f.avg_waffel, f.avg_preisleistung, f.nutzeranzahl, e.opening_hours_note, e.status
ORDER BY finaler_score DESC, kugel_preis_eur ASC, checkin_anzahl DESC;";

// SQL vorbereiten und ausführen
$stmt = $pdo->prepare($sql);
if ($nutzerId !== null) {
    $stmt->bindValue(':nutzerId', $nutzerId, PDO::PARAM_INT);
}
foreach ($openFilterParams as $placeholder => $shopId) {
    $stmt->bindValue($placeholder, $shopId, PDO::PARAM_INT);
}
$stmt->execute();
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

$attributeMap = getReviewAttributesForEisdielen($pdo, array_column($eisdielen, 'eisdiele_id'));
$openingHoursMap = fetch_opening_hours_map($pdo, array_column($eisdielen, 'eisdiele_id'));
foreach ($eisdielen as &$eisdiele) {
    $shopId = (int)$eisdiele['eisdiele_id'];
    $eisdiele['attributes'] = $attributeMap[$shopId] ?? [];
    $hoursRows = $openingHoursMap[$shopId] ?? [];
    $hoursNote = $eisdiele['opening_hours_note'] ?? null;
    if (empty($hoursRows) && !empty($eisdiele['openingHours'])) {
        $parsed = parse_legacy_opening_hours($eisdiele['openingHours']);
        $hoursRows = $parsed['rows'];
        if ($hoursNote === null && $parsed['note']) {
            $hoursNote = $parsed['note'];
        }
    }
    $eisdiele['openingHoursStructured'] = build_structured_opening_hours($hoursRows, $hoursNote);
    $eisdiele['is_open_now'] = is_shop_open($hoursRows, null, $eisdiele['status'] ?? null);
    if ($openMoment instanceof \DateTimeImmutable) {
        $eisdiele['is_open_reference'] = is_shop_open($hoursRows, $openMoment, $eisdiele['status'] ?? null);
        $eisdiele['open_reference'] = $openReferenceIso;
    } else {
        $eisdiele['is_open_reference'] = null;
        $eisdiele['open_reference'] = null;
    }
}
unset($eisdiele);

// JSON-Ausgabe
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
