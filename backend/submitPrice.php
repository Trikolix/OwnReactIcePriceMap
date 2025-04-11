<?php
require_once 'db_connect.php';

// Funktion zum Senden / Aktualisieren der Preise
function submitPrice($pdo, $shopId, $userId, $kugelPreis, $additionalInfoKugelPreis, $softeisPreis, $additionalInfoSofteisPreis) {
    $response = [];

    try {
        if ($kugelPreis !== null) {
            $sql = $additionalInfoKugelPreis != null ?
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
            if ($additionalInfoKugelPreis) {
                $stmt->bindParam(':beschreibung', $additionalInfoKugelPreis, PDO::PARAM_STR);
            }
            $stmt->execute();
            $response[] = ['typ' => 'kugel', 'status' => 'success', 'action' => ($stmt->rowCount() > 0 ? 'insert/update' : 'no_change')];
        }

        if ($softeisPreis !== null) {
            $sql = $additionalInfoSofteisPreis != null ? 
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
            if ($additionalInfoSofteisPreis) {
                $stmt->bindParam(':beschreibung', $additionalInfoSofteisPreis, PDO::PARAM_STR);
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

if (!isset($inputData["shopId"]) || !isset($inputData["userId"]) || (!isset($inputData["kugelPreis"]) && !isset($inputData["softeisPreis"]))) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter: shopId , userId, kugelPreis oder softeisPreis müssen gesetzt sein.", "shopId" => $inputData["shopId"], "userId" => $inputData["userId"], "kugelPreis" => $inputData["kugelPreis"], "softeisPreis" => $inputData["softeisPreis"]]);
    exit;
}

$shopId = $inputData['shopId'];
$userId = $inputData['userId'];
$kugelPreis = $inputData['kugelPreis'] ?? null;
$additionalInfoKugelPreis = $inputData['additionalInfoKugelPreis'] ?? null;
$softeisPreis = $inputData['softeisPreis'] ?? null;
$additionalInfoSofteisPreis = $inputData['additionalInfoSofteisPreis'] ?? null;
submitPrice($pdo, $shopId, $userId, $kugelPreis, $additionalInfoKugelPreis, $softeisPreis, $additionalInfoSofteisPreis);
?>