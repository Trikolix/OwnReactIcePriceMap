<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/opening_hours.php';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : null;
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
    e.latitude,
    e.longitude,
    e.status,
    e.reopening_date,
    e.opening_hours_note,

    -- Letzter gemeldeter Preis für Kugel-Eis mit Währung
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

    -- Kugel-Preis in Euro umgerechnet
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
     LIMIT 1) AS kugel_preis_eur,

    -- Letzter gemeldeter Preis für Softeis mit Währung
    (SELECT p2.preis 
     FROM preise p2 
     WHERE p2.eisdiele_id = e.id AND p2.typ = 'softeis' 
     ORDER BY p2.gemeldet_am DESC 
     LIMIT 1) AS softeis_preis,
     
    (SELECT w2.symbol 
     FROM preise p2 
     LEFT JOIN waehrungen w2 ON p2.waehrung_id = w2.id
     WHERE p2.eisdiele_id = e.id AND p2.typ = 'softeis' 
     ORDER BY p2.gemeldet_am DESC 
     LIMIT 1) AS softeis_waehrung,

    -- Softeis-Preis in Euro umgerechnet
    (SELECT 
        CASE 
            WHEN w2.code = 'EUR' THEN p2.preis
            ELSE ROUND(p2.preis * COALESCE(wk2.kurs, 1), 2)
        END
     FROM preise p2 
     LEFT JOIN waehrungen w2 ON p2.waehrung_id = w2.id
     LEFT JOIN wechselkurse wk2 ON p2.waehrung_id = wk2.von_waehrung_id 
         AND wk2.zu_waehrung_id = (SELECT id FROM waehrungen WHERE code = 'EUR')
     WHERE p2.eisdiele_id = e.id AND p2.typ = 'softeis' 
     ORDER BY p2.gemeldet_am DESC 
     LIMIT 1) AS softeis_preis_eur,

    -- Favoritenstatus des Nutzers
    CASE 
        WHEN f.nutzer_id IS NOT NULL THEN 1 
        ELSE 0 
    END AS is_favorit,

    -- Besuchsstatus des Nutzers
    CASE
        WHEN EXISTS (
            SELECT 1 FROM checkins c2
            WHERE c2.eisdiele_id = e.id AND c2.nutzer_id = :userId
        ) THEN 1
        ELSE 0
    END AS has_visited,

    -- Kugelscore aus View
    ks.finaler_kugel_score,
    -- Softeisscore aus View
    ss.finaler_softeis_score,
    -- Eisbecherscore aus View
    es.finaler_eisbecher_score

FROM eisdielen e

-- Letzter Kugelpreis pro Eisdiele
LEFT JOIN preise p ON e.id = p.eisdiele_id 
AND p.typ = 'kugel'
AND p.gemeldet_am = (
    SELECT MAX(p2.gemeldet_am) 
    FROM preise p2 
    WHERE p2.eisdiele_id = p.eisdiele_id 
    AND p2.typ = 'kugel'
)

-- Favoriten des Nutzers
LEFT JOIN favoriten f ON e.id = f.eisdiele_id AND f.nutzer_id = :userId

-- Score-Views
LEFT JOIN kugel_scores ks ON ks.eisdiele_id = e.id
LEFT JOIN softeis_scores ss ON ss.eisdiele_id = e.id
LEFT JOIN eisbecher_scores es ON es.eisdiele_id = e.id

WHERE 1=1{$openClause}
ORDER BY finaler_kugel_score DESC, 
         finaler_softeis_score DESC, 
         finaler_eisbecher_score DESC;";
$stmt = $pdo->prepare($sql);
// Parameter binden
$stmt->bindParam(':userId', $userId);
foreach ($openParams as $placeholder => $shopId) {
    $stmt->bindValue($placeholder, $shopId, PDO::PARAM_INT);
}
$stmt->execute();
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

$openingHoursMap = fetch_opening_hours_map($pdo, array_column($eisdielen, 'eisdielen_id'));
foreach ($eisdielen as &$eisdiele) {
    $shopId = (int)$eisdiele['eisdielen_id'];
    $rows = $openingHoursMap[$shopId] ?? [];
    $eisdiele['openingHoursStructured'] = build_structured_opening_hours($rows, $eisdiele['opening_hours_note'] ?? null);
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
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE )
?>
