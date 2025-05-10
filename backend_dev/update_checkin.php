<?php
require_once __DIR__ . '/db_connect.php';

$checkinId = $_POST['checkin_id'] ?? null;
$userId = $_POST['userId'] ?? null;
$shopId = $_POST['shopId'] ?? null;
$type = $_POST['type'] ?? null;
$geschmack = ($_POST['geschmackbewertung'] ?? '') !== '' ? floatval($_POST['geschmackbewertung']) : null;
$waffel = ($_POST['waffelbewertung'] ?? '') !== '' ? floatval($_POST['waffelbewertung']) : null;
$größe = ($_POST['größenbewertung'] ?? '') !== '' ? floatval($_POST['größenbewertung']) : null;
$preisleistungsbewertung = ($_POST['preisleistungsbewertung'] ?? '') !== '' ? floatval($_POST['preisleistungsbewertung']) : null;
$kommentar = $_POST['kommentar'] ?? '';
$sorten = json_decode($_POST['sorten'] ?? '[]', true);

// Validierung
if (!$checkinId || !$userId || !$shopId || !$type) {
    http_response_code(400);
    echo json_encode(['error' => 'Fehlende oder ungültige Daten']);
    exit;
}

// Bild-Upload
$bild_url = $_POST['bild_url'] ?? null;
if (isset($_FILES['bild']) && $_FILES['bild']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = '../uploads/checkins/';
    if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);

    $ext = pathinfo($_FILES['bild']['name'], PATHINFO_EXTENSION);
    $filename = uniqid('checkin_', true) . '.' . $ext;
    $destination = $uploadDir . $filename;

    if (move_uploaded_file($_FILES['bild']['tmp_name'], $destination)) {
        $bild_url = 'uploads/checkins/' . $filename;
    }
}

try {
    // Start der Transaktion
    $pdo->beginTransaction();

    if ($type === "Kugel") {$preisleistungsbewertung = null;} else {$größe = null;}
    if ($type === "Eisbecher") {$waffel = null;}

    // Update in Tabelle `checkins`
    $stmt = $pdo->prepare("
        UPDATE checkins
        SET nutzer_id = ?, eisdiele_id = ?, typ = ?, geschmackbewertung = ?, waffelbewertung = ?, größenbewertung = ?, preisleistungsbewertung = ?, kommentar = ?, bild_url = COALESCE(?, bild_url)
        WHERE id = ?
    ");
    $stmt->execute([$userId, $shopId, $type, $geschmack, $waffel, $größe, $preisleistungsbewertung, $kommentar, $bild_url, $checkinId]);

    // Löschen aller vorhandenen Sorten für diesen Checkin
    $deleteSortenStmt = $pdo->prepare("DELETE FROM checkin_sorten WHERE checkin_id = ?");
    $deleteSortenStmt->execute([$checkinId]);

    // Neue Sorten einfügen
    if (is_array($sorten) && count($sorten) > 0) {
        $sorteStmt = $pdo->prepare("
            INSERT INTO checkin_sorten (checkin_id, sortenname, bewertung)
            VALUES (?, ?, ?)
        ");
        foreach ($sorten as $sorte) {
            $name = $sorte['name'] ?? '';
            $bewertung = isset($sorte['bewertung']) && $sorte['bewertung'] != "" ? floatval($sorte['bewertung']) : $geschmack;
            if (!empty($name)) {
                $sorteStmt->execute([$checkinId, $name, $bewertung]);
            }
        }
    }

    // Commit der Transaktion
    $pdo->commit();
    echo json_encode(['status' => 'success']);
} catch (Exception $e) {
    // Rollback der Transaktion im Falle eines Fehlers
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Ein Fehler ist aufgetreten: ' . $e->getMessage()]);
}
?>