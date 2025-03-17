<?php
require_once 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$eisdiele_id = $data['eisdiele_id'];
$preis = $data['preis'];
$nutzer_id = $data['nutzer_id'];
$typ = $data['typ'];
$beschreibung = $data['beschreibung'];

// TODO validate input data
// eisdiele_id must be a valid eisdiele
// preis must be an decimal > 0 with a maximum of 2 decimal places
// nutzer_id must exist and reference to a valid user
// typ must be either 'kugel' or 'softeis'

$sql = "INSERT INTO preise (eisdiele_id, preis, gemeldet_von, beschreibung, typ) VALUES (?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("idi", $eisdiele_id, $preis, $nutzer_id, $beschreibung, $typ);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["message" => "Preis erfolgreich eingetragen"]);
} else {
    echo json_encode(["error" => "Fehler beim Eintragen des Preises"]);
}
?>
