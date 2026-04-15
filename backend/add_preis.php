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

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(["error" => "Validierungsfehler", "details" => $errors]);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO preise (eisdiele_id, preis, gemeldet_von, beschreibung, typ) VALUES (:eisdiele_id, :preis, :nutzer_id, :beschreibung, :typ)");
    $stmt->execute([
        ':eisdiele_id' => $eisdiele_id,
        ':preis' => $preis,
        ':nutzer_id' => $currentUserId,
        ':beschreibung' => $beschreibung,
        ':typ' => $typ
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["message" => "Preis erfolgreich eingetragen"]);
    } else {
        echo json_encode(["error" => "Fehler beim Eintragen des Preises"]);
    }
} catch (PDOException $e) {
    echo json_encode(["error" => "SQL-Fehler: " . $e->getMessage()]);
}
?>
