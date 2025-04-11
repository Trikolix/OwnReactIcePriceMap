<?php
require_once 'db_connect.php';

// Parameter aus der URL lesen
$nutzerId = $_GET['nutzer_id'] ?? null;
$eisdieleId = $_GET['eisdiele_id'] ?? null;

header("Content-Type: application/json");

if (!$nutzerId || !$eisdieleId) {
    echo json_encode(["error" => "Parameter fehlen"]);
    exit;
}

try {
    // Prüfen, ob der Favorit schon existiert
    $stmt = $pdo->prepare("SELECT 1 FROM favoriten WHERE nutzer_id = ? AND eisdiele_id = ?");
    $stmt->execute([$nutzerId, $eisdieleId]);

    if ($stmt->fetch()) {
        // Eintrag existiert – also löschen
        $delete = $pdo->prepare("DELETE FROM favoriten WHERE nutzer_id = ? AND eisdiele_id = ?");
        $delete->execute([$nutzerId, $eisdieleId]);
        echo json_encode(["status" => "removed", "message" => "Eisdiele wurde aus den Favoriten entfernt."]);
    } else {
        // Eintrag existiert nicht – also hinzufügen
        $insert = $pdo->prepare("INSERT INTO favoriten (nutzer_id, eisdiele_id) VALUES (?, ?)");
        $insert->execute([$nutzerId, $eisdieleId]);
        echo json_encode(["status" => "added", "message" => "Eisdiele wurde zu den Favoriten hinzugefügt."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Fehler bei der Datenbankoperation: " . $e->getMessage()]);
}

?>