<?php
require_once  __DIR__ . '/../db_connect.php';
require_once  __DIR__ . '/../lib/levelsystem.php';
require_once  __DIR__ . '/../evaluators/PublicRouteCountEvaluator.php';
require_once  __DIR__ . '/../evaluators/PrivateRouteCountEvaluator.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/route_utils.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

function nullIfEmpty($value) {
    return ($value === '' || !isset($value)) ? null : $value;
}


try {
    // Daten aus der Anfrage holen
    $data = json_decode(file_get_contents('php://input'), true);

    // Pflichtfelder
    $primaryEisdieleId = $data['eisdiele_id'] ?? null;
    $eisdieleIdsInput = $data['eisdiele_ids'] ?? null;
    $url = $data['url'] ?? null;
    $typ = $data['typ'] ?? null;

    // Optional: Nur Admins dürfen Embed-Code mitgeben
    $is_admin = ($currentUserId === 1);
    if ($is_admin) {
        if (!isset($data['embed_code']) || $data['embed_code'] === '') {
            $embed_code = generateEmbedCode($url);
        } else {
            $embed_code = $data['embed_code'];
        }
    } else {
        $embed_code = generateEmbedCode($url);
    }

     // Zusatzdaten
    $beschreibung = $data['beschreibung'] ?? null;
    $ist_oeffentlich = $data['ist_oeffentlich'] ?? false;
    $name = $data['name'] ?? '';
    $laenge_km   = nullIfEmpty($data['laenge_km'] ?? null);
    $hoehenmeter = nullIfEmpty($data['hoehenmeter'] ?? null);
    $schwierigkeit = $data['schwierigkeit'] ?? null;

    $normalizedIds = [];
    if (is_array($eisdieleIdsInput)) {
        foreach ($eisdieleIdsInput as $rawId) {
            $intId = (int)$rawId;
            if ($intId > 0 && !in_array($intId, $normalizedIds, true)) {
                $normalizedIds[] = $intId;
            }
        }
    }

    if ($primaryEisdieleId) {
        $primaryEisdieleId = (int)$primaryEisdieleId;
        if ($primaryEisdieleId > 0 && !in_array($primaryEisdieleId, $normalizedIds, true)) {
            array_unshift($normalizedIds, $primaryEisdieleId);
        }
    }

    if (empty($normalizedIds)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Bitte verknüpfe mindestens eine Eisdiele mit der Route.'
        ]);
        die();
    }

    $primaryEisdieleId = $normalizedIds[0];

    if (!$primaryEisdieleId || !$currentUserId || !$url || !$typ) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Fehlende erforderliche Daten'
    ]);
        die();
    }

    $cleanUrl = validateAndCleanUrl($url);
    if (!$cleanUrl) {
        echo json_encode(['status' => 'error', 'message' => 'Ungültige oder nicht unterstützte Routen-URL']);
        die();
    }

    // SQL-Abfrage vorbereiten
    $sql = "INSERT INTO routen
        (eisdiele_id, nutzer_id, url, embed_code, beschreibung, typ, ist_oeffentlich, name, laenge_km, hoehenmeter, schwierigkeit)
        VALUES
        (:eisdiele_id, :nutzer_id, :url, :embed_code, :beschreibung, :typ, :ist_oeffentlich, :name, :laenge_km, :hoehenmeter, :schwierigkeit)";

    $pdo->beginTransaction();

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'eisdiele_id' => $primaryEisdieleId,
        'nutzer_id' => $currentUserId,
        'url' => $cleanUrl,
        'embed_code' => $embed_code,
        'beschreibung' => $beschreibung,
        'typ' => $typ,
        'ist_oeffentlich' => $ist_oeffentlich,
        'name' => $name,
        'laenge_km' => $laenge_km,
        'hoehenmeter' => $hoehenmeter,
        'schwierigkeit' => $schwierigkeit
    ]);

    $routeId = (int)$pdo->lastInsertId();

    $relStmt = $pdo->prepare("
        INSERT INTO route_eisdielen (route_id, eisdiele_id)
        VALUES (:route_id, :eisdiele_id)
    ");
    foreach ($normalizedIds as $shopId) {
        $relStmt->execute([
            'route_id' => $routeId,
            'eisdiele_id' => $shopId
        ]);
    }

    $pdo->commit();

    // Evaluatoren
    $evaluators = [
        new PublicRouteCountEvaluator(),
        new PrivateRouteCountEvaluator()
    ];

    $newAwards = [];
    foreach ($evaluators as $evaluator) {
        try {
            $evaluated = $evaluator->evaluate($currentUserId);
            $newAwards = array_merge($newAwards, $evaluated);
        } catch (Exception $e) {
            error_log("Fehler beim Evaluator: " . get_class($evaluator) . " - " . $e->getMessage());
        }
    }

    $levelChange = updateUserLevelIfChanged($pdo, $currentUserId);

    echo json_encode([
        'status' => 'success',
        'message' => 'Route erfolgreich eingetragen',
        'new_awards' => $newAwards,
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => $levelChange['level_up'] ? $levelChange['new_level'] : null,
        'level_name' => $levelChange['level_up'] ? $levelChange['level_name'] : null
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fehler beim Einfügen der Route',
        'details' => $e->getMessage()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unbekannter Fehler',
        'details' => $e->getMessage()
    ]);
}
?>
