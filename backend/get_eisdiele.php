<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
require_once 'db_connect.php';

$host = "localhost";
$dbname = "db_439770_2";
$username = "USER439770_wed";
$password = "K8RYTP23y8kWSdt";

// Verbindung zur Datenbank
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Datenbankverbindung fehlgeschlagen"]);
    exit();
}

// Eisdiele-ID aus Anfrage holen
$eisdiele_id = isset($_GET['eisdiele_id']) ? intval($_GET['eisdiele_id']) : 0;
if ($eisdiele_id <= 0) {
    echo json_encode(["error" => "Ungültige Eisdiele-ID"]);
    exit();
}

// 1. Basisinformationen der Eisdiele abrufen
$stmt = $pdo->prepare("
    SELECT name, adresse, latitude, longitude, openingHours, komoot
    FROM eisdielen 
    WHERE id = ?
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

// 4. Attribute mit Häufigkeit abrufen
$stmt = $pdo->prepare("
    SELECT a.name, COUNT(*) as anzahl
    FROM bewertung_attribute ba
    JOIN attribute a ON ba.attribut_id = a.id
    JOIN bewertungen b ON ba.bewertung_id = b.id
    WHERE b.eisdiele_id = ?
    GROUP BY a.id
    ORDER BY anzahl DESC
");
$stmt->execute([$eisdiele_id]);
$attribute = $stmt->fetchAll();

// JSON-Antwort erstellen
$response = [
    "eisdiele" => $eisdiele,
    "preise" => [
        "kugel" => $kugel_preis ?: null,
        "softeis" => $softeis_preis ?: null
    ],
    "bewertungen" => [
        "geschmack" => isset($bewertungen["geschmack"]) ? round($bewertungen["geschmack"], 2) : null,
        "kugelgroesse" => isset($bewertungen["kugelgroesse"]) ? round($bewertungen["kugelgroesse"], 2) : null,
        "waffel" => isset($bewertungen["waffel"]) ? round($bewertungen["waffel"], 2) : null,
        "auswahl" => isset($bewertungen["auswahl"]) ? round($bewertungen["auswahl"], 2) : null,
    ],
    "attribute" => $attribute
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
?>