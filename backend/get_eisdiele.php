<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/checkin.php';
require_once  __DIR__ . '/lib/review.php';
require_once  __DIR__ . '/lib/attribute.php';

// Eisdiele-ID aus Anfrage holen
$eisdiele_id = isset($_GET['eisdiele_id']) ? intval($_GET['eisdiele_id']) : 0;
if ($eisdiele_id <= 0) {
    echo json_encode(["error" => "Ungültige Eisdiele-ID"]);
    exit();
}

// 1. Basisinformationen der Eisdiele abrufen
$stmt = $pdo->prepare("
    SELECT e.* ,
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
    WHERE e.id = ?;
");
$stmt->execute([$eisdiele_id]);
$eisdiele = $stmt->fetch();

if (!$eisdiele) {
    echo json_encode(["error" => "Eisdiele nicht gefunden"]);
    exit();
}

// 2. aktuellsten Kugelpreis abrufen
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
$kugel_preis = $stmt->fetch();

// 3. aktuellsten Softeispreis abrufen
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
$softeis_preis = $stmt->fetch();

// 4. Durchschnittliche Auswahl berechnen
$stmt = $pdo->prepare("
    SELECT
        AVG(auswahl) as auswahl
    FROM bewertungen
    WHERE eisdiele_id = ?
");
$stmt->execute([$eisdiele_id]);
$bewertungen = $stmt->fetch();

// 4. Scores für Kugel, Softeis und Eisbecher abrufen
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
WHERE e.id = :eisdieleId
");
$stmt->bindParam(':eisdieleId', $eisdiele_id);
$stmt->execute();
$score = $stmt->fetch(PDO::FETCH_ASSOC);

// 5. Attribute mit Häufigkeit abrufen
$attributeMap = getReviewAttributesForEisdielen($pdo, [$eisdiele_id]);
$attribute = $attributeMap[$eisdiele_id] ?? [];

// 6. Alle Reviews holen
$reviews = getReviewsByEisdieleId($pdo, $eisdiele_id);

// 7. Alle Checkins holen
$checkins = getCheckinsByEisdieleId($pdo, $eisdiele_id);

// JSON-Antwort erstellen
$response = [
    "eisdiele" => $eisdiele,
    "preise" => [
        "kugel" => $kugel_preis ?: null,
        "softeis" => $softeis_preis ?: null
    ],
    "scores" => [
        "kugel" => isset($score["finaler_kugel_score"]) ? round($score["finaler_kugel_score"], 2) : null,
        "softeis" => isset($score["finaler_softeis_score"]) ? round($score["finaler_softeis_score"], 2) : null,
        "eisbecher" => isset($score["finaler_eisbecher_score"]) ? round($score["finaler_eisbecher_score"], 2) : null
    ],
    "bewertungen" => [
        "auswahl" => isset($bewertungen["auswahl"]) ? round($bewertungen["auswahl"], 2) : null
    ],
    "attribute" => $attribute,
    "reviews" => $reviews,
    "checkins" => $checkins
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
?>
