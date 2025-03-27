<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
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

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['userId']) || !isset($data['shopId'])) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter"]);
    exit;
}

$sql = "INSERT INTO bewertungen (eisdiele_id, nutzer_id, geschmack, kugelgroesse, waffel, auswahl, beschreibung) 
        VALUES (:shopId, :userId, :geschmack, :kugelgroesse, :waffel, :auswahl, :beschreibung) 
        ON DUPLICATE KEY UPDATE geschmack = VALUES(geschmack), kugelgroesse = VALUES(kugelgroesse), 
        waffel = VALUES(waffel), auswahl = VALUES(auswahl), beschreibung = VALUES(beschreibung)";
$stmt = $pdo->prepare($sql);

try {
    $stmt->execute([
        ':shopId' => $data['shopId'],
        ':userId' => $data['userId'],
        ':geschmack' => isset($data['geschmack']) ? $data['geschmack'] : null,
        ':kugelgroesse' => isset($data['kugelgroesse']) ? $data['kugelgroesse'] : null,
        ':waffel' => isset($data['waffel']) ? $data['waffel'] : null,
        ':auswahl' => isset($data['auswahl']) ? $data['auswahl'] : null,
        ':beschreibung' => isset($data['beschreibung']) ? $data['beschreibung'] : null
    ]);
    echo json_encode(["status" => "success"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
