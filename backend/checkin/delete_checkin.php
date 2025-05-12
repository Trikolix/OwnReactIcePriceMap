<?php
require_once  __DIR__ . '/../db_connect.php';

// Daten aus der Anfrage holen
$data = json_decode(file_get_contents('php://input'), true);
$checkin_id = $data['id'] ?? null;
$nutzer_id = $data['nutzer_id'] ?? null;

if (!$checkin_id || !$nutzer_id) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Fehlende erforderliche Daten'
]);
    exit;
}

// Die Bilder Abrufen, die nur mit dem checkin verknüpft sind
$sql_select = "SELECT url FROM bilder WHERE checkin_id = :id AND shop_id IS NULL AND bewertung_id IS NULL";
$stmt_select = $pdo->prepare($sql_select);
$stmt_select->execute(['id' => $checkin_id]);
$bilder = $stmt_select->fetchAll();

foreach ($bilder as $bild) {
    // Pfad zur Bilddatei auf dem Server
    $bild_pfad = __DIR__ . '/../../' . $bild['url']; // Anpassen Sie den Pfad entsprechend Ihrer Verzeichnisstruktur

    // Überprüfen, ob die Datei existiert und löschen
    if (file_exists($bild_pfad)) {
        unlink($bild_pfad);
    }
}

// SQL-Abfrage vorbereiten
$sql = "DELETE FROM checkins WHERE id = :id AND nutzer_id = :nutzer_id";
$stmt = $pdo->prepare($sql);
$stmt->execute(['id' => $checkin_id, 'nutzer_id' => $nutzer_id]);

echo json_encode([
    'status' => 'success',
    'message' => 'Checkin erfolgreich gelöscht'
]);
?>