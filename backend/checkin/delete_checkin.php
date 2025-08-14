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

try {
    // Transaktion starten
    $pdo->beginTransaction();

    // Bilder zum Checkin holen
    $sql_select = "
        SELECT url 
        FROM bilder 
        WHERE checkin_id = :id 
          AND bewertung_id IS NULL
    ";
    $stmt_select = $pdo->prepare($sql_select);
    $stmt_select->execute(['id' => $checkin_id]);
    $bilder = $stmt_select->fetchAll(PDO::FETCH_ASSOC);

    // Bild-Einträge aus DB löschen
    $sql_delete_bilder = "
        DELETE FROM bilder 
        WHERE checkin_id = :id
    ";
    $stmt_delete_bilder = $pdo->prepare($sql_delete_bilder);
    $stmt_delete_bilder->execute(['id' => $checkin_id]);

    // Checkin löschen
    $sql_delete_checkin = "
        DELETE FROM checkins 
        WHERE id = :id AND nutzer_id = :nutzer_id
    ";
    $stmt_delete_checkin = $pdo->prepare($sql_delete_checkin);
    $stmt_delete_checkin->execute([
        'id' => $checkin_id,
        'nutzer_id' => $nutzer_id
    ]);

    // Transaktion abschließen
    $pdo->commit();

    // Dateien erst NACH erfolgreichem Commit löschen
    foreach ($bilder as $bild) {
        $bild_pfad = __DIR__ . '/../../' . $bild['url'];
        if (file_exists($bild_pfad)) {
            unlink($bild_pfad);
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Checkin inklusive Bilder erfolgreich gelöscht'
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode([
        'status' => 'error',
        'message' => 'Fehler beim Löschen: ' . $e->getMessage()
    ]);
}
?>