<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/levelsystem.php';
require_once __DIR__ . '/evaluators/PriceSubmitCountEvaluator.php';
require_once __DIR__ . '/evaluators/AwardCollectorEvaluator.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/shop_maintenance.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

// Funktion zum Senden / Aktualisieren der Preise
require_once __DIR__ . '/evaluators/PriceSubmitCountEvaluator.php';
require_once __DIR__ . '/evaluators/AwardCollectorEvaluator.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/shop_maintenance.php';

function submitPrice($pdo, $shopId, $userId, $kugelPreis, $additionalInfoKugelPreis, $softeisPreis, $additionalInfoSofteisPreis, $waehrung) {
    $response = [];

    try {
        shopMaintenanceSyncTaskForShop($pdo, (int)$shopId);

        if ($kugelPreis !== null) {
            $sql = $additionalInfoKugelPreis != null ?
                "INSERT INTO preise (`gemeldet_von`, `eisdiele_id`, `typ`, `preis`, `beschreibung`, `gemeldet_am`, `first_time_reported`, `waehrung_id`)
                VALUES (:userId, :shopId, 'kugel', :kugelPreis, :beschreibung, NOW(), NOW(), :waehrung)
                ON DUPLICATE KEY UPDATE
                beschreibung = VALUES(beschreibung),
                preis = VALUES(preis),
                gemeldet_am = NOW();"
                :
                "INSERT INTO preise (`gemeldet_von`, `eisdiele_id`, `typ`, `preis`, `gemeldet_am`, `first_time_reported`, `waehrung_id`)
                VALUES (:userId, :shopId, 'kugel', :kugelPreis, NOW(), NOW(), :waehrung)
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
            $stmt->bindParam(':waehrung', $waehrung, PDO::PARAM_INT);
            $stmt->execute();
            $response[] = ['typ' => 'kugel', 'status' => 'success', 'action' => ($stmt->rowCount() > 0 ? 'insert/update' : 'no_change')];
        }

        if ($softeisPreis !== null && $softeisPreis !== '') {
            $sql = $additionalInfoSofteisPreis != null ?
                "INSERT INTO preise (`gemeldet_von`, `eisdiele_id`, `typ`, `preis`, `beschreibung`, `gemeldet_am`, `first_time_reported`, `waehrung_id`)
                VALUES (:userId, :shopId, 'softeis', :softeisPreis, :beschreibung, NOW(), NOW(), :waehrung)
                ON DUPLICATE KEY UPDATE
                beschreibung = VALUES(beschreibung),
                preis = VALUES(preis),
                gemeldet_am = NOW();"
                :
                "INSERT INTO preise (`gemeldet_von`, `eisdiele_id`, `typ`, `preis`, `gemeldet_am`, `first_time_reported`, `waehrung_id`)
                VALUES (:userId, :shopId, 'softeis', :softeisPreis, NOW(), NOW(), :waehrung)
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
            $stmt->bindParam(':waehrung', $waehrung, PDO::PARAM_INT);
            $stmt->execute();
            $response[] = ['typ' => 'softeis', 'status' => 'success', 'action' => ($stmt->rowCount() > 0 ? 'insert/update' : 'no_change')];
        }

        // Evaluatoren
    $resolvedMaintenanceTask = shopMaintenanceResolveActiveTask($pdo, (int)$shopId, 'price_stale', (int)$userId);

    $evaluators = [
        new PriceSubmitCountEvaluator(),
        new AwardCollectorEvaluator()
    ];

    $newAwards = [];
    foreach ($evaluators as $evaluator) {
        try {
            $evaluated = $evaluator->evaluate($userId);
            $newAwards = array_merge($newAwards, $evaluated);
        } catch (Exception $e) {
            error_log("Fehler beim Evaluator: " . get_class($evaluator) . " - " . $e->getMessage());
        }
    }
    $response[] = ['new_awards' => $newAwards];

    if ($resolvedMaintenanceTask) {
        $response[] = [
            'maintenance_task_resolved' => [
                'id' => (int)$resolvedMaintenanceTask['id'],
                'task_type' => 'price_stale',
                'task_label' => shopMaintenanceGetTaskLabel('price_stale'),
                'bonus_ep' => (int)$resolvedMaintenanceTask['bonus_ep_awarded'],
            ],
        ];
    }

    $levelChange = updateUserLevelIfChanged($pdo, $userId);
    $response[] = [
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => $levelChange['level_up'] ? $levelChange['new_level'] : null,
        'level_name' => $levelChange['level_up'] ? $levelChange['level_name'] : null
    ];


    } catch (PDOException $e) {
        $response[] = ['status' => 'error', 'message' => $e->getMessage()];
    }

    echo json_encode($response);
    } // end of function submitPrice

$inputData = json_decode(file_get_contents('php://input'), true);

if (!isset($inputData) || !is_array($inputData) || empty($inputData["shopId"]) || !is_numeric($inputData["shopId"]) || (!array_key_exists("kugelPreis", $inputData) && !array_key_exists("softeisPreis", $inputData))) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Ungültige Parameter: shopId muss gesetzt und numerisch sein, und mindestens einer der Preise muss gesetzt sein.",
        "shopId" => $inputData["shopId"] ?? null,
        "kugelPreis" => $inputData["kugelPreis"] ?? null,
        "softeisPreis" => $inputData["softeisPreis"] ?? null
    ]);
    exit;
}

$shopId = $inputData['shopId'];
$kugelPreis = array_key_exists('kugelPreis', $inputData) ? $inputData['kugelPreis'] : null;
if ($kugelPreis !== null && (!is_numeric($kugelPreis) || $kugelPreis < 0)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Ungültiger kugelPreis"]);
    exit;
}

$softeisPreis = array_key_exists('softeisPreis', $inputData) ? $inputData['softeisPreis'] : null;
if ($softeisPreis !== null && $softeisPreis !== '' && (!is_numeric($softeisPreis) || $softeisPreis < 0)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Ungültiger softeisPreis"]);
    exit;
}

$waehrung = $inputData['waehrung'] ?? 1;
if (!is_numeric($waehrung)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Ungültige waehrung"]);
    exit;
}

$additionalInfoKugelPreis = $inputData['additionalInfoKugelPreis'] ?? null;
$additionalInfoSofteisPreis = $inputData['additionalInfoSofteisPreis'] ?? null;

submitPrice($pdo, $shopId, $currentUserId, $kugelPreis, $additionalInfoKugelPreis, $softeisPreis, $additionalInfoSofteisPreis, $waehrung);
?>
