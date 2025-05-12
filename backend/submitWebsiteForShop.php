<?php
require_once  __DIR__ . '/db_connect.php';

// Daten aus dem POST-Request abrufen
$shopId = isset($_POST['shopId']) ? $_POST['shopId'] : '';
$website = isset($_POST['website']) ? $_POST['website'] : '';

// Überprüfen, ob alle notwendigen Daten vorhanden sind
if ($shopId && $website) {

    $sql = "UPDATE eisdielen SET website = :website WHERE id = :shopId";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':website', $website, PDO::PARAM_STR);
    $stmt->bindParam(':shopId', $shopId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Website erfolgreich aktualisiert.']);
        } else {
        echo json_encode(['status' => 'error', 'message' => 'Fehler beim Aktualisieren der Website.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Daten.']);
}
?>
