<?php
/**
 * Extended API endpoint for detailed ice cream shop information
 * Returns comprehensive data for the dedicated shop detail page
 */

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/checkin.php';
require_once __DIR__ . '/lib/review.php';
require_once __DIR__ . '/lib/attribute.php';
require_once __DIR__ . '/lib/opening_hours.php';
require_once __DIR__ . '/lib/route_helpers.php';

// Get parameters
$eisdiele_id = isset($_GET['eisdiele_id']) ? intval($_GET['eisdiele_id']) : 0;
$nutzer_id = isset($_GET['nutzer_id']) ? intval($_GET['nutzer_id']) : null;
$openMoment = parse_opening_hours_reference($_GET['open_at'] ?? null);
$openReferenceIso = $openMoment instanceof \DateTimeImmutable ? $openMoment->format(\DateTimeInterface::ATOM) : null;

if ($eisdiele_id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Ungültige Eisdiele-ID"]);
    exit();
}

// 1. Basic shop information
$stmt = $pdo->prepare("
    SELECT e.*,
           l.name AS land,
           b.name AS bundesland,
           lk.name AS landkreis,
           w.id AS waehrung_id,
           w.code AS waehrung_code,
           w.name AS waehrung_name,
           w.symbol AS waehrung_symbol
    FROM eisdielen e
    JOIN laender l ON e.land_id = l.id
    JOIN bundeslaender b ON e.bundesland_id = b.id
    JOIN landkreise lk ON e.landkreis_id = lk.id
    LEFT JOIN waehrungen w ON l.waehrung_id = w.id
    WHERE e.id = ?
");
$stmt->execute([$eisdiele_id]);
$eisdiele = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$eisdiele) {
    http_response_code(404);
    echo json_encode(["error" => "Eisdiele nicht gefunden"]);
    exit();
}

// Opening hours
$openingRows = fetch_opening_hours_rows($pdo, (int)$eisdiele['id']);
$openingNote = $eisdiele['opening_hours_note'] ?? null;
if (empty($openingRows) && !empty($eisdiele['openingHours'])) {
    $parsed = parse_legacy_opening_hours($eisdiele['openingHours']);
    $openingRows = $parsed['rows'];
    if ($openingNote === null && $parsed['note']) {
        $openingNote = $parsed['note'];
    }
}
$openingStructured = build_structured_opening_hours($openingRows, $openingNote);
$eisdiele['openingHoursStructured'] = $openingStructured;
$eisdiele['opening_hours_note'] = $openingNote;
$eisdiele['is_open_now'] = is_shop_open($openingRows, null, $eisdiele['status'] ?? null);
$eisdiele['open_reference'] = $openReferenceIso;
$eisdiele['is_open_reference'] = $openMoment instanceof \DateTimeImmutable ? is_shop_open($openingRows, $openMoment, $eisdiele['status'] ?? null) : null;

// 2. Current prices (Kugeleis)
$stmt = $pdo->prepare("
    SELECT 
        'kugel' AS typ,
        p.preis,
        MAX(p.gemeldet_am) as letztes_update,
        MAX(p.beschreibung) AS beschreibung,
        COUNT(*) as bestaetigungen,
        w.id AS waehrung_id,
        w.code AS waehrung_code,
        w.symbol AS waehrung_symbol
    FROM preise p
    LEFT JOIN waehrungen w ON p.waehrung_id = w.id
    WHERE p.eisdiele_id = ? AND p.typ = 'kugel'
    GROUP BY p.preis, p.waehrung_id, w.id, w.code, w.symbol
    ORDER BY letztes_update DESC
    LIMIT 1
");
$stmt->execute([$eisdiele_id]);
$kugel_preis = $stmt->fetch(PDO::FETCH_ASSOC);

// 3. Current prices (Softeis)
$stmt = $pdo->prepare("
    SELECT
        'softeis' AS typ,
        p.preis,
        MAX(p.gemeldet_am) AS letztes_update,
        MAX(p.beschreibung) AS beschreibung,
        COUNT(*) AS bestaetigungen,
        w.id AS waehrung_id,
        w.code AS waehrung_code,
        w.symbol AS waehrung_symbol
    FROM preise p
    LEFT JOIN waehrungen w ON p.waehrung_id = w.id
    WHERE p.eisdiele_id = ? AND p.typ = 'softeis'
    GROUP BY p.preis, p.waehrung_id, w.id, w.code, w.symbol
    ORDER BY letztes_update DESC
    LIMIT 1
");
$stmt->execute([$eisdiele_id]);
$softeis_preis = $stmt->fetch(PDO::FETCH_ASSOC);

// 4. Letzte Preismeldung des aktuellen Nutzers für diese Eisdiele
$letzte_preismeldung_user = null;
if (!empty($nutzer_id)) {
    $stmt = $pdo->prepare("
        SELECT MAX(gemeldet_am) AS letzte_preismeldung
        FROM preise
        WHERE eisdiele_id = ? AND gemeldet_von = ?
    ");
    $stmt->execute([$eisdiele_id, $nutzer_id]);
    $letzte_preismeldung_user = $stmt->fetchColumn() ?: null;
}

// 5. Price history for chart
$stmt = $pdo->prepare("
    SELECT 
        typ,
        preis,
        COALESCE(first_time_reported, gemeldet_am) AS datum,
        w.symbol AS waehrung_symbol
    FROM preise p
    LEFT JOIN waehrungen w ON p.waehrung_id = w.id
    WHERE p.eisdiele_id = ?
    ORDER BY datum ASC
");
$stmt->execute([$eisdiele_id]);
$preis_historie = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 6. Average selection from reviews
$stmt = $pdo->prepare("
    SELECT AVG(auswahl) as auswahl
    FROM bewertungen
    WHERE eisdiele_id = ?
");
$stmt->execute([$eisdiele_id]);
$bewertungen = $stmt->fetch(PDO::FETCH_ASSOC);

// 7. Scores for Kugel, Softeis, Eisbecher
$stmt = $pdo->prepare("
    SELECT 
        e.id AS eisdiele_id,
        ks.finaler_kugel_score,
        ss.finaler_softeis_score,
        es.finaler_eisbecher_score
    FROM eisdielen e
    LEFT JOIN kugel_scores ks ON ks.eisdiele_id = e.id
    LEFT JOIN softeis_scores ss ON ss.eisdiele_id = e.id
    LEFT JOIN eisbecher_scores es ON es.eisdiele_id = e.id
    WHERE e.id = ?
");
$stmt->execute([$eisdiele_id]);
$score = $stmt->fetch(PDO::FETCH_ASSOC);

// 8. Attributes with frequency
$attributeMap = getReviewAttributesForEisdielen($pdo, [$eisdiele_id]);
$attribute = $attributeMap[$eisdiele_id] ?? [];

// 9. Statistics
$stmt = $pdo->prepare("
    SELECT 
        COUNT(*) AS gesamt_checkins,
        COUNT(DISTINCT nutzer_id) AS verschiedene_besucher,
        SUM(CASE WHEN typ = 'Kugel' THEN 1 ELSE 0 END) AS kugel_checkins,
        SUM(CASE WHEN typ = 'Softeis' THEN 1 ELSE 0 END) AS softeis_checkins,
        SUM(CASE WHEN typ = 'Eisbecher' THEN 1 ELSE 0 END) AS eisbecher_checkins,
        MIN(datum) AS erster_checkin,
        MAX(datum) AS letzter_checkin
    FROM checkins
    WHERE eisdiele_id = ?
");
$stmt->execute([$eisdiele_id]);
$statistiken = $stmt->fetch(PDO::FETCH_ASSOC);

// 10. Travel mode distribution
$stmt = $pdo->prepare("
    SELECT 
        anreise,
        COUNT(*) AS anzahl
    FROM checkins
    WHERE eisdiele_id = ? AND anreise IS NOT NULL AND anreise != ''
    GROUP BY anreise
    ORDER BY anzahl DESC
");
$stmt->execute([$eisdiele_id]);
$anreise_verteilung = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 11. Most eaten flavors at this shop
$stmt = $pdo->prepare("
    SELECT 
        cs.sortenname,
        COUNT(*) AS anzahl,
        AVG(cs.bewertung) AS durchschnittsbewertung
    FROM checkin_sorten cs
    JOIN checkins c ON cs.checkin_id = c.id
    WHERE c.eisdiele_id = ?
    GROUP BY cs.sortenname
    ORDER BY anzahl DESC, durchschnittsbewertung DESC
    LIMIT 10
");
$stmt->execute([$eisdiele_id]);
$meistgegessene_sorten = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 12. Best rated flavors at this shop (min 2 ratings)
$stmt = $pdo->prepare("
    SELECT 
        cs.sortenname,
        COUNT(*) AS anzahl,
        AVG(cs.bewertung) AS durchschnittsbewertung
    FROM checkin_sorten cs
    JOIN checkins c ON cs.checkin_id = c.id
    WHERE c.eisdiele_id = ?
    GROUP BY cs.sortenname
    HAVING COUNT(*) >= 2
    ORDER BY durchschnittsbewertung DESC, anzahl DESC
    LIMIT 10
");
$stmt->execute([$eisdiele_id]);
$bestbewertete_sorten = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 13. Checkin counts by ice type with average ratings
$stmt = $pdo->prepare("
    SELECT 
        typ,
        COUNT(*) AS anzahl,
        AVG(geschmackbewertung) AS avg_geschmack,
        AVG(waffelbewertung) AS avg_waffel,
        AVG(größenbewertung) AS avg_groesse,
        AVG(preisleistungsbewertung) AS avg_preisleistung
    FROM checkins
    WHERE eisdiele_id = ?
    GROUP BY typ
");
$stmt->execute([$eisdiele_id]);
$checkin_details_by_type = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 14. All reviews
$reviews = getReviewsByEisdieleId($pdo, $eisdiele_id);

// 15. All checkins
$checkins = getCheckinsByEisdieleId($pdo, $eisdiele_id);

// 16. Routes for this shop
$stmt = $pdo->prepare("
    SELECT r.*, 
           n.username,
           upi.avatar_path,
           (SELECT COUNT(*) FROM route_eisdielen WHERE route_id = r.id) AS anzahl_eisdielen
    FROM routen r
    JOIN nutzer n ON r.nutzer_id = n.id
    JOIN route_eisdielen re ON r.id = re.route_id
    JOIN user_profile_images upi ON n.id = upi.user_id
    WHERE re.eisdiele_id = ? AND (r.ist_oeffentlich = TRUE OR (r.nutzer_id = ? AND r.ist_oeffentlich = FALSE))
    GROUP BY r.id
    ORDER BY r.erstellt_am DESC
");
$stmt->execute([$eisdiele_id, $nutzer_id]);
$routen = $stmt->fetchAll(PDO::FETCH_ASSOC);
$routeShopMap = getRouteIceShops($pdo, array_column($routen, 'id'));
foreach ($routen as &$routeEntry) {
    $rid = (int)$routeEntry['id'];
    $routeEntry['eisdielen'] = $routeShopMap[$rid] ?? [];
    if (!empty($routeEntry['eisdielen'])) {
        $routeEntry['eisdiele_id'] = $routeEntry['eisdielen'][0]['id'];
        $routeEntry['eisdiele_name'] = $routeEntry['eisdielen'][0]['name'];
    }
    $routeEntry['commentCount'] = getCommentCountForRoute($pdo, $rid);
}
unset($routeEntry);

// 17. Photo gallery from checkins
$stmt = $pdo->prepare("
    SELECT 
        b.id,
        b.url,
        b.checkin_id,
        c.nutzer_id,
        c.datum,
        n.username
    FROM bilder b
    JOIN checkins c ON b.checkin_id = c.id
    JOIN nutzer n ON c.nutzer_id = n.id
    WHERE c.eisdiele_id = ?
    ORDER BY c.datum DESC
    LIMIT 20
");
$stmt->execute([$eisdiele_id]);
$foto_galerie = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 18. Similar shops nearby (same landkreis, different shop)
// $stmt = $pdo->prepare("
//     SELECT 
//         e.id,
//         e.name,
//         e.adresse,
//         e.latitude,
//         e.longitude,
//         e.status,
//         ks.finaler_kugel_score
//     FROM eisdielen e
//     LEFT JOIN kugel_scores ks ON ks.eisdiele_id = e.id
//     WHERE e.landkreis_id = ? AND e.id != ? AND e.status != 'permanent_closed'
//     ORDER BY ks.finaler_kugel_score DESC NULLS LAST
//     LIMIT 5
// ");
// $stmt->execute([$eisdiele['landkreis_id'], $eisdiele_id]);
// $aehnliche_eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 19. User's personal stats at this shop (if logged in)
$persoenliche_statistiken = null;
if ($nutzer_id) {
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) AS eigene_checkins,
            MAX(datum) AS letzter_besuch,
            MIN(datum) AS erster_besuch
        FROM checkins
        WHERE eisdiele_id = ? AND nutzer_id = ?
    ");
    $stmt->execute([$eisdiele_id, $nutzer_id]);
    $persoenliche_statistiken = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // User's favorite flavors at this shop
    $stmt = $pdo->prepare("
        SELECT 
            cs.sortenname,
            COUNT(*) AS anzahl,
            AVG(cs.bewertung) AS durchschnittsbewertung
        FROM checkin_sorten cs
        JOIN checkins c ON cs.checkin_id = c.id
        WHERE c.eisdiele_id = ? AND c.nutzer_id = ?
        GROUP BY cs.sortenname
        ORDER BY anzahl DESC
        LIMIT 5
    ");
    $stmt->execute([$eisdiele_id, $nutzer_id]);
    $persoenliche_statistiken['lieblingssorten'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Build response
$response = [
    "eisdiele" => $eisdiele,
    "preise" => [
        "kugel" => $kugel_preis ?: null,
        "softeis" => $softeis_preis ?: null
    ],
    "letzte_preismeldung_user" => $letzte_preismeldung_user,
    "preis_historie" => $preis_historie,
    "scores" => [
        "kugel" => isset($score["finaler_kugel_score"]) ? round($score["finaler_kugel_score"], 2) : null,
        "softeis" => isset($score["finaler_softeis_score"]) ? round($score["finaler_softeis_score"], 2) : null,
        "eisbecher" => isset($score["finaler_eisbecher_score"]) ? round($score["finaler_eisbecher_score"], 2) : null
    ],
    "bewertungen" => [
        "auswahl" => $bewertungen['auswahl'] ? round($bewertungen['auswahl']) : null
    ],
    "statistiken" => [
        "gesamt_checkins" => (int)$statistiken['gesamt_checkins'],
        "verschiedene_besucher" => (int)$statistiken['verschiedene_besucher'],
        "checkins_nach_typ" => [
            "Kugel" => (int)$statistiken['kugel_checkins'],
            "Softeis" => (int)$statistiken['softeis_checkins'],
            "Eisbecher" => (int)$statistiken['eisbecher_checkins']
        ],
        "anreise_verteilung" => $anreise_verteilung,
        "erster_checkin" => $statistiken['erster_checkin'],
        "letzter_checkin" => $statistiken['letzter_checkin']
    ],
    "checkin_details_by_type" => $checkin_details_by_type,
    "beliebte_sorten" => [
        "meistgegessen" => $meistgegessene_sorten,
        "bestbewertet" => $bestbewertete_sorten
    ],
    "attribute" => $attribute,
    "reviews" => $reviews,
    "checkins" => $checkins,
    "routen" => $routen,
    "foto_galerie" => $foto_galerie,
    // "aehnliche_eisdielen" => $aehnliche_eisdielen,
    "persoenliche_statistiken" => $persoenliche_statistiken
];

header('Content-Type: application/json');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
