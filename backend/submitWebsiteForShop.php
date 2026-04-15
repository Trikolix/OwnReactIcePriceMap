<?php
require_once  __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';

// Authentifizierung prüfen
$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

// Daten aus dem POST-Request abrufen
$shopId = isset($_POST['shopId']) ? $_POST['shopId'] : '';
$website = isset($_POST['website']) ? $_POST['website'] : '';

// Überprüfen, ob alle notwendigen Daten vorhanden sind
if ($shopId && $website) {

    // Prüfen, ob der Nutzer berechtigt ist, diese Eisdiele zu bearbeiten
    $stmt = $pdo->prepare("SELECT user_id FROM eisdielen WHERE id = :shopId");
    $stmt->bindParam(':shopId', $shopId, PDO::PARAM_INT);
    $stmt->execute();
    $eisdiele = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$eisdiele) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Eisdiele nicht gefunden.']);
        exit;
    }

    if ($currentUserId !== 1 && $currentUserId !== (int)$eisdiele['user_id']) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Keine Berechtigung, die Website dieser Eisdiele zu aktualisieren.']);
        exit;
    }

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
