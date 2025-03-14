<?php
require_once 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$eisdiele_id = $data['eisdiele_id'];
$preis = $data['preis'];
$nutzer_id = $data['nutzer_id']; // Falls anonyme Einträge erlaubt sind, kann dies NULL sein

$sql = "INSERT INTO preise (eisdiele_id, preis, nutzer_id) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("idi", $eisdiele_id, $preis, $nutzer_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["message" => "Preis erfolgreich eingetragen"]);
} else {
    echo json_encode(["error" => "Fehler beim Eintragen des Preises"]);
}
?>
