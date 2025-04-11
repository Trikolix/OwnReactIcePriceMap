<?php
require_once 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$userId = $data['userId'];
$shopId = $data['shopId'];
$selectedAttributes = $data['selectedAttributes'] ?? [];

if (!isset($data['userId']) || !isset($data['shopId'])) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter"]);
    exit;
}


try {
    // 1. Bewertung einfügen oder updaten
    $sql = "INSERT INTO bewertungen (eisdiele_id, nutzer_id, geschmack, kugelgroesse, waffel, auswahl, beschreibung) 
        VALUES (:shopId, :userId, :geschmack, :kugelgroesse, :waffel, :auswahl, :beschreibung) 
        ON DUPLICATE KEY UPDATE geschmack = VALUES(geschmack), kugelgroesse = VALUES(kugelgroesse), 
        waffel = VALUES(waffel), auswahl = VALUES(auswahl), beschreibung = VALUES(beschreibung)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':shopId' => $data['shopId'],
        ':userId' => $data['userId'],
        ':geschmack' => isset($data['geschmack']) ? $data['geschmack'] : null,
        ':kugelgroesse' => isset($data['kugelgroesse']) ? $data['kugelgroesse'] : null,
        ':waffel' => isset($data['waffel']) ? $data['waffel'] : null,
        ':auswahl' => isset($data['auswahl']) ? $data['auswahl'] : null,
        ':beschreibung' => isset($data['beschreibung']) ? $data['beschreibung'] : null
    ]);

    // 2. Bewertung-ID abfragen (für die Verbindung)
    $stmt = $pdo->prepare("SELECT id FROM bewertungen WHERE nutzer_id = :userId AND eisdiele_id = :shopId");
    $stmt->execute([':userId' => $userId, ':shopId' => $shopId]);
    $bewertungId = $stmt->fetchColumn();

    if (!$bewertungId) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Bewertung konnte nicht gefunden werden"]);
        exit;
    }

    // 3. Alle aktuellen Attribut-IDs abrufen
    $attributIds = [];
    foreach ($selectedAttributes as $name) {
        // prüfen, ob Attribut existiert
        $stmt = $pdo->prepare("SELECT id FROM attribute WHERE name = :name");
        $stmt->execute([':name' => $name]);
        $id = $stmt->fetchColumn();
    
        if (!$id) {
            // neues Attribut anlegen
            $stmt = $pdo->prepare("INSERT INTO attribute (name) VALUES (:name)");
            $stmt->execute([':name' => $name]);
            $id = $pdo->lastInsertId();
        }
    
        $attributIds[] = $id;
    }

    // 4. Bisher verknüpfte Attribute löschen
    $stmt = $pdo->prepare("DELETE FROM bewertung_attribute WHERE bewertung_id = :bewertungId");
    $stmt->execute([':bewertungId' => $bewertungId]);

    // 5. Neue Verknüpfungen einfügen
    $stmt = $pdo->prepare("INSERT INTO bewertung_attribute (bewertung_id, attribut_id) VALUES (:bewertungId, :attributId)");
    foreach ($attributIds as $attrId) {
        $stmt->execute([
            ':bewertungId' => $bewertungId,
            ':attributId' => $attrId
        ]);
    }
    echo json_encode(["status" => "success"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>