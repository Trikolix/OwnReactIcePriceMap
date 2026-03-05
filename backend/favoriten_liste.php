<?php
require_once  __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/opening_hours.php';

$nutzerId = $_GET['nutzer_id'] ?? null;

if (!$nutzerId) {
    echo json_encode(["error" => "nutzer_id fehlt"]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT 
        e.*,
        f.hinzugefuegt_am AS favorit_seit,

        -- Letzter Kugelpreis
        (
            SELECT p1.preis
            FROM preise p1
            WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel'
            ORDER BY p1.gemeldet_am DESC
            LIMIT 1
        ) AS kugel_preis,
        (
            SELECT w1.symbol
            FROM preise p1
            LEFT JOIN waehrungen w1 ON p1.waehrung_id = w1.id
            WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel'
            ORDER BY p1.gemeldet_am DESC
            LIMIT 1
        ) AS kugel_waehrung,
        (
            SELECT p1.gemeldet_am
            FROM preise p1
            WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel'
            ORDER BY p1.gemeldet_am DESC
            LIMIT 1
        ) AS kugel_preis_update,
        (
            SELECT COUNT(*)
            FROM preise p1
            WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel'
        ) AS kugel_preis_meldungen,
        (
            SELECT CASE
                WHEN w1.code = 'EUR' THEN p1.preis
                ELSE ROUND(p1.preis * COALESCE(wk1.kurs, 1), 2)
            END
            FROM preise p1
            LEFT JOIN waehrungen w1 ON p1.waehrung_id = w1.id
            LEFT JOIN wechselkurse wk1
                ON p1.waehrung_id = wk1.von_waehrung_id
                AND wk1.zu_waehrung_id = (SELECT id FROM waehrungen WHERE code = 'EUR')
            WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel'
            ORDER BY p1.gemeldet_am DESC
            LIMIT 1
        ) AS kugel_preis_eur,

        -- Letzter Softeispreis
        (
            SELECT p2.preis
            FROM preise p2
            WHERE p2.eisdiele_id = e.id AND p2.typ = 'softeis'
            ORDER BY p2.gemeldet_am DESC
            LIMIT 1
        ) AS softeis_preis,
        (
            SELECT w2.symbol
            FROM preise p2
            LEFT JOIN waehrungen w2 ON p2.waehrung_id = w2.id
            WHERE p2.eisdiele_id = e.id AND p2.typ = 'softeis'
            ORDER BY p2.gemeldet_am DESC
            LIMIT 1
        ) AS softeis_waehrung,
        (
            SELECT p2.gemeldet_am
            FROM preise p2
            WHERE p2.eisdiele_id = e.id AND p2.typ = 'softeis'
            ORDER BY p2.gemeldet_am DESC
            LIMIT 1
        ) AS softeis_preis_update,
        (
            SELECT COUNT(*)
            FROM preise p2
            WHERE p2.eisdiele_id = e.id AND p2.typ = 'softeis'
        ) AS softeis_preis_meldungen,
        (
            SELECT CASE
                WHEN w2.code = 'EUR' THEN p2.preis
                ELSE ROUND(p2.preis * COALESCE(wk2.kurs, 1), 2)
            END
            FROM preise p2
            LEFT JOIN waehrungen w2 ON p2.waehrung_id = w2.id
            LEFT JOIN wechselkurse wk2
                ON p2.waehrung_id = wk2.von_waehrung_id
                AND wk2.zu_waehrung_id = (SELECT id FROM waehrungen WHERE code = 'EUR')
            WHERE p2.eisdiele_id = e.id AND p2.typ = 'softeis'
            ORDER BY p2.gemeldet_am DESC
            LIMIT 1
        ) AS softeis_preis_eur,

        -- Community / Nutzerkontext
        CASE
            WHEN EXISTS (
                SELECT 1 FROM checkins c
                WHERE c.eisdiele_id = e.id AND c.nutzer_id = ?
            ) THEN 1
            ELSE 0
        END AS has_visited,
        (
            SELECT COUNT(*)
            FROM checkins c
            WHERE c.eisdiele_id = e.id AND c.nutzer_id = ?
        ) AS own_checkin_count,
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM challenges c
                WHERE c.eisdiele_id = e.id
                  AND c.nutzer_id = ?
                  AND c.completed = 0
                  AND (c.valid_until IS NULL OR c.valid_until >= NOW())
            ) THEN 1
            ELSE 0
        END AS has_active_challenge,
        (
            SELECT COUNT(*) FROM checkins c
            WHERE c.eisdiele_id = e.id
        ) AS checkin_count_total,
        (
            SELECT COUNT(*) FROM bewertungen b
            WHERE b.eisdiele_id = e.id
        ) AS review_count_total,

        -- Scores
        ks.finaler_kugel_score,
        ss.finaler_softeis_score,
        es.finaler_eisbecher_score
    FROM favoriten f
    JOIN eisdielen e ON f.eisdiele_id = e.id
    LEFT JOIN kugel_scores ks ON ks.eisdiele_id = e.id
    LEFT JOIN softeis_scores ss ON ss.eisdiele_id = e.id
    LEFT JOIN eisbecher_scores es ON es.eisdiele_id = e.id
    WHERE f.nutzer_id = ?
    ORDER by f.hinzugefuegt_am DESC
");
$stmt->execute([$nutzerId, $nutzerId, $nutzerId, $nutzerId]);
$favoriten = $stmt->fetchAll(PDO::FETCH_ASSOC);

$openingHoursMap = fetch_opening_hours_map($pdo, array_column($favoriten, 'id'));
foreach ($favoriten as &$favorit) {
    $shopId = (int)$favorit['id'];
    $rows = $openingHoursMap[$shopId] ?? [];
    $note = $favorit['opening_hours_note'] ?? null;
    if (empty($rows) && !empty($favorit['openingHours'])) {
        $parsed = parse_legacy_opening_hours($favorit['openingHours']);
        $rows = $parsed['rows'];
        if ($note === null && $parsed['note']) {
            $note = $parsed['note'];
        }
    }
    $favorit['openingHoursStructured'] = build_structured_opening_hours($rows, $note);
    $favorit['is_open_now'] = is_shop_open($rows, null, $favorit['status'] ?? null);
}
unset($favorit);

echo json_encode($favoriten, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);

?>
