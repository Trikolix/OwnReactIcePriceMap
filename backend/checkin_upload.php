<?php
require_once 'db_connect.php';

// Prüfe, ob es sich um einen POST-Request handelt
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST erlaubt']);
    exit;
}

// Hilfsfunktion zur Bewertung validieren
function validateRating($val) {
    return is_numeric($val) && $val >= 1.0 && $val <= 5.0;
}

$userId = $_POST['userId'] ?? null;
$shopId = $_POST['shopId'] ?? null;
$type = $_POST['type'] ?? null;
$gesamt = $_POST['gesamtbewertung'] ?? null;
$waffel = $_POST['waffelbewertung'] ?? null;
$größe = $_POST['größenbewertung'] ?? null;
$kommentar = $_POST['kommentar'] ?? '';
$sorten = json_decode($_POST['sorten'] ?? '[]', true);

// Validierung
if (!$userId || !$shopId || !$type || !validateRating($gesamt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Fehlende oder ungültige Daten']);
    exit;
}

// Bild-Upload
$bild_url = null;
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

// INSERT in Tabelle `checkins`
$stmt = $pdo->prepare("
    INSERT INTO checkins (user_id, shop_id, type, gesamtbewertung, waffelbewertung, größenbewertung, kommentar, bild_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([$userId, $shopId, $type, $gesamt, $waffel, $größe, $kommentar, $bild_url]);

$checkinId = $pdo->lastInsertId();

// Falls Sorten mitgeschickt wurden: in eigene Tabelle einfügen
if (is_array($sorten)) {
    $sorteStmt = $pdo->prepare("
        INSERT INTO checkin_sorten (checkin_id, sortenname, bewertung)
        VALUES (?, ?, ?)
    ");
    foreach ($sorten as $sorte) {
        $name = $sorte['name'] ?? '';
        $bewertung = isset($sorte['bewertung']) ? floatval($sorte['bewertung']) : null;
        $sorteStmt->execute([$checkinId, $name, $bewertung]);
    }
}

echo json_encode(['success' => true, 'checkin_id' => $checkinId]);
?>