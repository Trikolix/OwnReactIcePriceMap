<?php
require_once __DIR__ . '/../db_connect.php';

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

function resizeImage($sourcePath, $destinationPath, $maxDim = 1200, $quality = 75) {
    $imgInfo = getimagesize($sourcePath);
    if (!$imgInfo) {
        throw new Exception('Ungültige Bilddatei.');
    }

    [$width, $height] = $imgInfo;
    $mime = $imgInfo['mime'];

    // Bildquelle laden
    switch ($mime) {
        case 'image/jpeg':
            $srcImage = imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $srcImage = imagecreatefrompng($sourcePath);
            break;
        case 'image/webp':
            $srcImage = imagecreatefromwebp($sourcePath);
            break;
        default:
            throw new Exception('Nicht unterstützter Bildtyp: ' . $mime);
    }

    // Neue Dimensionen berechnen
    $ratio = $width / $height;
    if ($width > $height) {
        $newWidth = $maxDim;
        $newHeight = $maxDim / $ratio;
    } else {
        $newHeight = $maxDim;
        $newWidth = $maxDim * $ratio;
    }

    $newWidth = (int) round($newWidth);
    $newHeight = (int) round($newHeight);
    $newImage = imagecreatetruecolor($newWidth, $newHeight);
    imagecopyresampled($newImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    // Immer als JPEG speichern
    imagejpeg($newImage, $destinationPath, $quality);

    imagedestroy($srcImage);
    imagedestroy($newImage);
}

// Validierung
if (!$checkinId || !$userId || !$shopId || !$type) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fehlende oder ungültige Daten'
    ]);
    exit;
}

// Bild-Upload
$bild_url = $_POST['bild_url'] ?? null;
$old_bild_url = null;
if (isset($_FILES['bild']) && $_FILES['bild']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = '../../uploads/checkins/';
    if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
    $tempPath = $_FILES['bild']['tmp_name'];
    $filename = uniqid('checkin_', true) . '.jpg';
    $destination = $uploadDir . $filename;
     try {
        resizeImage($tempPath, $destination);
        $bild_url = 'uploads/checkins/' . $filename;
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Bildverarbeitung fehlgeschlagen: ' . $e->getMessage()]);
    }
}

try {
    // Start der Transaktion
    $pdo->beginTransaction();

    // Holen der alten bild_url aus der Datenbank
    $stmt = $pdo->prepare("SELECT bild_url FROM checkins WHERE id = ?");
    $stmt->execute([$checkinId]);
    $checkin = $stmt->fetch(PDO::FETCH_ASSOC);
    $old_bild_url = $checkin['bild_url'];

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

    // Löschen des alten Bildes, falls ein neues Bild hochgeladen wurde
    if ($bild_url && $old_bild_url) {
        $old_bild_path = '../../' . $old_bild_url;
        if (file_exists($old_bild_path)) {
            unlink($old_bild_path);
        }
    }

    echo json_encode(['status' => 'success']);
} catch (Exception $e) {
    // Rollback der Transaktion im Falle eines Fehlers
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message'=> 'Ein Fehler ist aufgetreten: ' . $e->getMessage()
    ]);
}
?>