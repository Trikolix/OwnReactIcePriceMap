<?php
require_once 'db_connect.php';

// Eingabedaten einlesen
$data = json_decode(file_get_contents("php://input"), true);
$eisdiele_id = $data['eisdiele_id'];
$preis = $data['preis'];
$nutzer_id = $data['nutzer_id'];
$typ = $data['typ'];
$beschreibung = $data['beschreibung'];

// TODO: Input validieren

try {
    $stmt = $pdo->prepare("INSERT INTO preise (eisdiele_id, preis, gemeldet_von, beschreibung, typ) VALUES (:eisdiele_id, :preis, :nutzer_id, :beschreibung, :typ)");
    $stmt->execute([
        ':eisdiele_id' => $eisdiele_id,
        ':preis' => $preis,
        ':nutzer_id' => $nutzer_id,
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
