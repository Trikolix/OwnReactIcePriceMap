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

// Funktion zum Senden / Aktualisieren der Preise
function submitPrice($pdo, $shopId, $userId, $kugelPreis, $additionalInfokugelPreis, $softeisPreis, $additionalInfosofteisPreis) {
    $response = [];

    try {
        if ($kugelPreis !== null) {
            $sql = $additionalInfokugelPreis ? 
                "INSERT INTO preise (`gemeldet_von`, `eisdiele_id`, `typ`, `preis`, `beschreibung`, `gemeldet_am`)
                VALUES (:userId, :shopId, 'kugel', :kugelPreis, :beschreibung, NOW())
                ON DUPLICATE KEY UPDATE 
                beschreibung = VALUES(beschreibung), 
                preis = VALUES(preis),
                gemeldet_am = NOW();" 
                : 
                "INSERT INTO preise (`gemeldet_von`, `eisdiele_id`, `typ`, `preis`, `gemeldet_am`)
                VALUES (:userId, :shopId, 'kugel', :kugelPreis, NOW())
                ON DUPLICATE KEY UPDATE 
                preis = VALUES(preis),
                gemeldet_am = NOW();";

            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':shopId', $shopId, PDO::PARAM_INT);
            $stmt->bindParam(':kugelPreis', $kugelPreis, PDO::PARAM_STR);
            if ($additionalInfokugelPreis) {
                $stmt->bindParam(':beschreibung', $additionalInfokugelPreis, PDO::PARAM_STR);
            }
            $stmt->execute();
            $response[] = ['typ' => 'kugel', 'status' => 'success', 'action' => ($stmt->rowCount() > 0 ? 'insert/update' : 'no_change')];
        }

        if ($softeisPreis !== null) {
            $sql = $additionalInfosofteisPreis ? 
                "INSERT INTO preise (`gemeldet_von`, `eisdiele_id`, `typ`, `preis`, `beschreibung`, `gemeldet_am`)
                VALUES (:userId, :shopId, 'softeis', :softeisPreis, :beschreibung, NOW())
                ON DUPLICATE KEY UPDATE 
                beschreibung = VALUES(beschreibung), 
                preis = VALUES(preis),
                gemeldet_am = NOW();" 
                : 
                "INSERT INTO preise (`gemeldet_von`, `eisdiele_id`, `typ`, `preis`, `gemeldet_am`)
                VALUES (:userId, :shopId, 'softeis', :softeisPreis, NOW())
                ON DUPLICATE KEY UPDATE 
                preis = VALUES(preis),
                gemeldet_am = NOW();";

            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':shopId', $shopId, PDO::PARAM_INT);
            $stmt->bindParam(':softeisPreis', $softeisPreis, PDO::PARAM_STR);
            if ($additionalInfosofteisPreis) {
                $stmt->bindParam(':beschreibung', $additionalInfosofteisPreis, PDO::PARAM_STR);
            }
            $stmt->execute();
            $response[] = ['typ' => 'softeis', 'status' => 'success', 'action' => ($stmt->rowCount() > 0 ? 'insert/update' : 'no_change')];
        }
    } catch (PDOException $e) {
        $response[] = ['status' => 'error', 'message' => $e->getMessage()];
    }

    echo json_encode($response);
    } // end of function submitPrice

$inputData = json_decode(file_get_contents('php://input'), true);

if (!isset($inputData["shopId"]) || !isset($inputData["userId"]) || (!isset($inputData["kugelPreis"]) && !inputData($inputData["softeisPreis"]))) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter: shopId , userId, kugelPreis oder softeisPreis müssen gesetzt sein.", "shopId" => $inputData["shopId"], "userId" => $inputData["userId"], "kugelPreis" => $inputData["kugelPreis"], "softeisPreis" => $inputData["softeisPreis"]]);
    exit;
}

$shopId = $inputData['shopId'];
$userId = $inputData['userId'];
$kugelPreis = $inputData['kugelPreis'] ?? null;
$additionalInfokugelPreis = $inputData['additionalInfokugelPreis'] ?? null;
$softeisPreis = $inputData['softeisPreis'] ?? null;
$additionalInfosofteisPreis = $inputData['additionalInfosofteisPreis'] ?? null;
submitPrice($pdo, $shopId, $userId, $kugelPreis, $additionalInfokugelPreis, $softeisPreis, $additionalInfosofteisPreis);
?>