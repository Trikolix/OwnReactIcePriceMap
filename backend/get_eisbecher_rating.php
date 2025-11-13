<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/attribute.php';
require_once __DIR__ . '/lib/opening_hours.php';

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
    $ph = [];
    foreach ($openIds as $idx => $shopId) {
        $placeholder = ':openShop' . $idx;
        $ph[] = $placeholder;
        $openFilterParams[$placeholder] = $shopId;
    }
    $openFilterClause = ' WHERE g.eisdiele_id IN (' . implode(',', $ph) . ')';
}

$sql = "
WITH bewertete_checkins AS (
    SELECT
        nutzer_id,
        eisdiele_id,
        geschmackbewertung,
        preisleistungsbewertung,
        ROUND(0.7 * geschmackbewertung + 0.3 * preisleistungsbewertung, 2) AS score
    FROM checkins
    WHERE
        typ = 'Eisbecher'
        AND geschmackbewertung IS NOT NULL
        AND preisleistungsbewertung IS NOT NULL" .
        ($nutzerId !== null ? " AND nutzer_id = :nutzerId" : "") . "
    ),
nutzer_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        COUNT(*) AS checkin_count,
        AVG(score) AS durchschnitt_score,
        AVG(geschmackbewertung) AS durchschnitt_geschmack,
        AVG(preisleistungsbewertung) AS durchschnitt_preisleistung
    FROM bewertete_checkins
    GROUP BY eisdiele_id, nutzer_id
),
gewichtete_scores AS (
    SELECT
        eisdiele_id,
        nutzer_id,
        checkin_count,
        SQRT(checkin_count) AS gewicht,
        durchschnitt_score * SQRT(checkin_count) AS gewichteter_score,
        durchschnitt_geschmack * SQRT(checkin_count) AS gewichteter_geschmack,
        durchschnitt_preisleistung * SQRT(checkin_count) AS gewichteter_preisleistung
    FROM nutzer_scores
)
SELECT
    g.eisdiele_id,
    e.name,
    e.adresse,
    e.openingHours,
    e.opening_hours_note,
    e.status,
    e.latitude,
    e.longitude,
    SUM(g.checkin_count) AS checkin_anzahl,
    COUNT(DISTINCT g.nutzer_id) AS anzahl_nutzer,
    ROUND(SUM(g.gewichteter_score) / NULLIF(SUM(g.gewicht), 0), 2) AS finaler_eisbecher_score,
    ROUND(SUM(g.gewichteter_geschmack) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_geschmack,
    ROUND(SUM(g.gewichteter_preisleistung) / NULLIF(SUM(g.gewicht), 0), 2) AS avg_preisleistung
FROM gewichtete_scores g
JOIN eisdielen e ON e.id = g.eisdiele_id
{$openFilterClause}
GROUP BY g.eisdiele_id, e.name, e.adresse, e.openingHours, e.opening_hours_note, e.latitude, e.longitude, e.status
ORDER BY finaler_eisbecher_score DESC;
";

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
    $rows = $openingHoursMap[$shopId] ?? [];
    $note = $eisdiele['opening_hours_note'] ?? null;
    if (empty($rows) && !empty($eisdiele['openingHours'])) {
        $parsed = parse_legacy_opening_hours($eisdiele['openingHours']);
        $rows = $parsed['rows'];
        if ($note === null && $parsed['note']) {
            $note = $parsed['note'];
        }
    }
    $eisdiele['openingHoursStructured'] = build_structured_opening_hours($rows, $note);
    $eisdiele['is_open_now'] = is_shop_open($rows, null, $eisdiele['status'] ?? null);
    if ($openMoment instanceof \DateTimeImmutable) {
        $eisdiele['is_open_reference'] = is_shop_open($rows, $openMoment, $eisdiele['status'] ?? null);
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
