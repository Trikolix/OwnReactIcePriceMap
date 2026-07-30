<?php
require_once  __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

// Eingabedaten einlesen
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["error" => "Ungültige Eingabedaten"]);
    exit;
}

$eisdiele_id = $data['eisdiele_id'] ?? null;
$preis = $data['preis'] ?? null;
$typ = $data['typ'] ?? null;
$beschreibung = $data['beschreibung'] ?? null;
$waehrung = $data['waehrung'] ?? 1;

$errors = [];

if (empty($eisdiele_id) || !is_numeric($eisdiele_id)) {
    $errors[] = "eisdiele_id ist ungültig oder fehlt.";
}
if (!isset($preis) || !is_numeric($preis) || $preis < 0) {
    $errors[] = "preis ist ungültig oder fehlt.";
}
if (empty($typ) || !is_string($typ)) {
    $errors[] = "typ ist ungültig oder fehlt.";
}
if (!is_numeric($waehrung)) {
    $errors[] = "waehrung ist ungültig oder fehlt.";
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(["error" => "Validierungsfehler", "details" => $errors]);
    exit;
}

try {
    $pdo->beginTransaction();
    $eligibilityStmt = $pdo->prepare(
        "SELECT 1 FROM preise
         WHERE eisdiele_id = :eisdiele_id
           AND preis = :preis
           AND gemeldet_von = :nutzer_id
           AND typ = :typ
         LIMIT 1
         FOR UPDATE"
    );
    $eligibilityStmt->execute([
        ':eisdiele_id' => $eisdiele_id,
        ':preis' => $preis,
        ':nutzer_id' => $currentUserId,
        ':typ' => $typ,
    ]);
    $isRewardEligible = $eligibilityStmt->fetchColumn() ? 0 : 1;

    $stmt = $pdo->prepare(
        "INSERT INTO preise (
            eisdiele_id, preis, gemeldet_von, beschreibung, typ,
            gemeldet_am, first_time_reported, waehrung_id, is_reward_eligible
        ) VALUES (
            :eisdiele_id, :preis, :nutzer_id, :beschreibung, :typ,
            NOW(), NOW(), :waehrung, :is_reward_eligible
        )"
    );
    $stmt->execute([
        ':eisdiele_id' => $eisdiele_id,
        ':preis' => $preis,
        ':nutzer_id' => $currentUserId,
        ':beschreibung' => $beschreibung,
        ':typ' => $typ,
        ':waehrung' => $waehrung,
        ':is_reward_eligible' => $isRewardEligible,
    ]);

    if ($stmt->rowCount() > 0) {
        $pdo->commit();
        echo json_encode(["message" => "Preis erfolgreich eingetragen"]);
    } else {
        $pdo->rollBack();
        echo json_encode(["error" => "Fehler beim Eintragen des Preises"]);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["error" => "SQL-Fehler: " . $e->getMessage()]);
}
?>
