<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/checkin.php';

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
	   lk.name AS landkreis
    FROM eisdielen e
	JOIN laender l ON e.land_id = l.id
	JOIN bundeslaender b ON e.bundesland_id = b.id
    JOIN landkreise lk ON e.landkreis_id = lk.id
    WHERE e.id = ?;
");
$stmt->execute([$eisdiele_id]);
$eisdiele = $stmt->fetch();

if (!$eisdiele) {
    echo json_encode(["error" => "Eisdiele nicht gefunden"]);
    exit();
}

// aktuellsten Kugelpreis abrufen
$stmt = $pdo->prepare("
    SELECT 
        'kugel' AS typ,
        preis,
        MAX(gemeldet_am) as letztes_update,
        MAX(beschreibung) AS beschreibung,
        COUNT(*) as bestaetigungen
    FROM preise 
    WHERE eisdiele_id = ? AND typ = 'kugel'
    GROUP BY preis
    ORDER BY letztes_update DESC
    LIMIT 1
");

$stmt->execute([$eisdiele_id]);
$kugel_preis = $stmt->fetch();

// aktuellsten Softeispreis abrufen
$stmt = $pdo->prepare("
    SELECT
        'softeis' AS typ,
        preis,
        MAX(gemeldet_am) AS letztes_update,
        MAX(beschreibung) AS beschreibung,
        COUNT(*) AS bestaetigungen
    FROM
        preise
    WHERE
        eisdiele_id = ? AND typ = 'softeis'
    GROUP BY
        preis
    ORDER BY
        letztes_update
    DESC
    LIMIT 1
");

$stmt->execute([$eisdiele_id]);
$softeis_preis = $stmt->fetch();


// 3. Durchschnittliche Bewertungen berechnen
$stmt = $pdo->prepare("
    SELECT 
        AVG(geschmack) as geschmack,
        AVG(kugelgroesse) as kugelgroesse,
        AVG(auswahl) as auswahl,
        AVG(waffel) as waffel
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
$stmt = $pdo->prepare("
    SELECT a.name, COUNT(*) as anzahl
    FROM bewertung_attribute ba
    JOIN attribute a ON ba.attribut_id = a.id
    JOIN bewertungen b ON ba.bewertung_id = b.id
    WHERE b.eisdiele_id = ?
    GROUP BY a.id, a.name
    ORDER BY anzahl DESC
");
$stmt->execute([$eisdiele_id]);
$attribute = $stmt->fetchAll();

// 6. Alle Reviews holen
$stmtReviews = $pdo->prepare("SELECT b.*,
                                     e.name AS eisdiele_name,
                                     n.username AS nutzer_name,
                                     n.id AS nutzer_id                            
                              FROM bewertungen b
                              JOIN eisdielen e ON b.eisdiele_id = e.id
                              JOIN nutzer n ON b.nutzer_id = n.id
                              WHERE b.eisdiele_id = ?
                              ORDER BY b.erstellt_am DESC
                            ");
$stmtReviews->execute([$eisdiele_id]);
$reviews = $stmtReviews->fetchAll(PDO::FETCH_ASSOC);

// Bewertungen durchgehen und Attribute anhängen
foreach ($reviews as &$review) { // ACHTUNG: Referenz verwenden (&$review)
    $stmtAttr = $pdo->prepare("
        SELECT a.name 
        FROM bewertung_attribute ba 
        JOIN attribute a ON ba.attribut_id = a.id 
        WHERE ba.bewertung_id = :bewertungId
    ");
    $stmtAttr->execute(['bewertungId' => $review['id']]);
    $attributes = $stmtAttr->fetchAll(PDO::FETCH_COLUMN);
    $review['bewertung_attribute'] = $attributes;
}
// Referenz wieder auflösen
unset($review);

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
        "geschmack" => isset($bewertungen["geschmack"]) ? round($bewertungen["geschmack"], 2) : null,
        "kugelgroesse" => isset($bewertungen["kugelgroesse"]) ? round($bewertungen["kugelgroesse"], 2) : null,
        "waffel" => isset($bewertungen["waffel"]) ? round($bewertungen["waffel"], 2) : null,
        "auswahl" => isset($bewertungen["auswahl"]) ? round($bewertungen["auswahl"], 2) : null,
    ],
    "attribute" => $attribute,
    "reviews" => $reviews,
    "checkins" => $checkins
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
?>