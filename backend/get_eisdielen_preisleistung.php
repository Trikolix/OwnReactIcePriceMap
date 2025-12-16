<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/opening_hours.php';

$openMoment = parse_opening_hours_reference($_GET['open_at'] ?? null);
$filterOpenNow = !$openMoment && isset($_GET['open_now']) && intval($_GET['open_now']) === 1;
$openClause = '';
$openParams = [];
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
        $openParams[$placeholder] = $shopId;
    }
    $openClause = ' AND e.id IN (' . implode(',', $placeholders) . ')';
}

$sql = "SELECT 
    e.id AS eisdielen_id,
    e.name AS eisdielen_name,
    e.adresse,
    e.openingHours,
    e.opening_hours_note,
    b.avg_geschmack,
    b.avg_kugelgroesse,
    b.avg_waffel,
    b.avg_auswahl,
    p.preis AS aktueller_preis,
    -- Preis-Leistungs-Verhältnis (PLV) berechnen
    ROUND(
        1 + 4 * (
            (0.7 * ((4 * b.avg_geschmack + b.avg_waffel) / 25))
            + (0.3 * (3 * b.avg_kugelgroesse) / (10 * p.preis))
        ), 2
    ) AS PLV,
    ((3 * b.avg_geschmack + b.avg_waffel) / 20) AS geschmacks_faktor,
    ((3 * b.avg_kugelgroesse) / (10 * p.preis)) AS preisleistungs_faktor
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
{$openClause}
AND p.gemeldet_am = (
    SELECT MAX(p2.gemeldet_am) 
    FROM preise p2 
    WHERE p2.eisdiele_id = p.eisdiele_id 
    AND p2.typ = 'kugel'
)
HAVING PLV IS NOT NULL
ORDER BY PLV DESC;";

// SQL ausführen
$stmt = $pdo->prepare($sql);
foreach ($openParams as $placeholder => $shopId) {
    $stmt->bindValue($placeholder, $shopId, PDO::PARAM_INT);
}
$stmt->execute();
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

$openingHoursMap = fetch_opening_hours_map($pdo, array_column($eisdielen, 'eisdielen_id'));
foreach ($eisdielen as &$eisdiele) {
    $shopId = (int)$eisdiele['eisdielen_id'];
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
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
?>
