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

$sql = "SELECT 
    e.id AS eisdielen_id,
    e.name AS eisdielen_name,
    b.avg_geschmack,
    b.avg_kugelgroesse,
    b.avg_waffel,
    b.avg_auswahl,
    p.preis AS aktueller_preis,
    (SELECT MAX(preis) AS preis FROM preise WHERE typ = 'kugel' GROUP BY eisdiele_id ORDER BY preis LIMIT 1) AS min_preis,
    -- Preis-Leistungs-Verhältnis (PLV) berechnen
    ROUND(
        1 + 4 * (
            (3 * b.avg_geschmack + 2 * b.avg_kugelgroesse + 1 * b.avg_waffel) / 30
            * (0.65 + 0.35 * ( ( SELECT MAX(preis) AS preis FROM preise WHERE typ = 'kugel' GROUP BY eisdiele_id ORDER BY preis LIMIT 1) / p.preis ))
        ), 2
    ) AS PLV
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
WHERE p.typ = 'kugel' AND PLV NOT null
AND p.gemeldet_am = (
    SELECT MAX(p2.gemeldet_am) 
    FROM preise p2 
    WHERE p2.eisdiele_id = p.eisdiele_id 
    AND p2.typ = 'kugel'
)
HAVING PLV IS NOT NULL
ORDER BY PLV DESC;";

// SQL ausführen
$stmt = $pdo->query($sql);
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

// JSON-Ausgabe
echo json_encode($eisdielen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE )
?>