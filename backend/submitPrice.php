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

function hasRewardEligiblePriceReport($pdo, $shopId, $userId, $type, $price): bool {
    $stmt = $pdo->prepare(
        "SELECT 1
         FROM preise
         WHERE eisdiele_id = :shop_id
           AND gemeldet_von = :user_id
           AND typ = :type
           AND preis = :price
         LIMIT 1
         FOR UPDATE"
    );
    $stmt->execute([
        ':shop_id' => $shopId,
        ':user_id' => $userId,
        ':type' => $type,
        ':price' => $price,
    ]);

    return (bool)$stmt->fetchColumn();
}

function insertPriceReport($pdo, $shopId, $userId, $type, $price, $description, $waehrung): array {
    $isRewardEligible = hasRewardEligiblePriceReport($pdo, $shopId, $userId, $type, $price) ? 0 : 1;

    $stmt = $pdo->prepare(
        "INSERT INTO preise (
            gemeldet_von,
            eisdiele_id,
            typ,
            preis,
            beschreibung,
            gemeldet_am,
            first_time_reported,
            waehrung_id,
            is_reward_eligible
        ) VALUES (
            :user_id,
            :shop_id,
            :type,
            :price,
            :description,
            NOW(),
            NOW(),
            :waehrung,
            :is_reward_eligible
        )"
    );
    $stmt->execute([
        ':user_id' => $userId,
        ':shop_id' => $shopId,
        ':type' => $type,
        ':price' => $price,
        ':description' => $description,
        ':waehrung' => $waehrung,
        ':is_reward_eligible' => $isRewardEligible,
    ]);

    return [
        'typ' => $type,
        'status' => 'success',
        'action' => 'created',
        'is_reward_eligible' => (bool)$isRewardEligible,
    ];
}

function submitPrice($pdo, $shopId, $userId, $kugelPreis, $additionalInfoKugelPreis, $softeisPreis, $additionalInfoSofteisPreis, $waehrung) {
    $response = [];

    try {
        shopMaintenanceSyncTaskForShop($pdo, (int)$shopId);

        $pdo->beginTransaction();
        if ($kugelPreis !== null) {
            $response[] = insertPriceReport(
                $pdo,
                $shopId,
                $userId,
                'kugel',
                $kugelPreis,
                $additionalInfoKugelPreis,
                $waehrung
            );
        }

        if ($softeisPreis !== null && $softeisPreis !== '') {
            $response[] = insertPriceReport(
                $pdo,
                $shopId,
                $userId,
                'softeis',
                $softeisPreis,
                $additionalInfoSofteisPreis,
                $waehrung
            );
        }
        $pdo->commit();

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
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
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
