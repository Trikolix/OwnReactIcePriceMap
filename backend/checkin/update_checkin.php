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
$existingPictures = json_decode($_POST['bestehende_bilder'] ?? '[]', true); // erwartet Pfade wie "uploads/checkins/dateiname.jpg"
$beschreibungen = json_decode($_POST['bild_beschreibungen'] ?? '[]', true);

// Zentrale Fehlerausgabe
function respondWithError($message, $httpCode = 400, $exception = null) {
    http_response_code($httpCode);
    if ($exception) {
        error_log("Fehler: $message | Exception: " . $exception->getMessage());
    } else {
        error_log("Fehler: $message");
    }
    echo json_encode(['status' => 'error', 'message' => $message]);
    exit;
}

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



try {
    // Start der Transaktion
    $pdo->beginTransaction();

    // Bilder: alte ermitteln
    $stmt = $pdo->prepare("SELECT id, url FROM bilder WHERE checkin_id = ?");
    $stmt->execute([$checkinId]);
    $oldPictures = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Neue Bilder verarbeiten
    $uploadDir = '../../uploads/checkins/';
    if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);

    $bildUrls = [];
    if (isset($_FILES['bilder']) && is_array($_FILES['bilder']['tmp_name'])) {
        $uploadDir = '../../uploads/checkins/';
        if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);

        $beschreibungen = $_POST['beschreibungen'] ?? [];
        foreach ($_FILES['bilder']['tmp_name'] as $index => $tmpPath)  {
            switch ($_FILES['bilder']['error'][$index]) {
                case UPLOAD_ERR_OK:

                    if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
                
                    $tempPath = $_FILES['bilder']['tmp_name'][$index];
                    $filename = uniqid('checkin_', true) . '.jpg';
                    $destination = $uploadDir . $filename;
                
                    try {
                        resizeImage($tempPath, $destination);
                        $relativePath = 'uploads/checkins/' . $filename;
                        $beschreibung = $beschreibungen[$index] ?? null;
                        $bildUrls[] = ['url' => $relativePath, 'beschreibung' => $beschreibung];
                    } catch (Exception $e) {
                        respondWithError('Bildverarbeitung fehlgeschlagen: ' . $e->getMessage());
                    }
                    break;
                
                case UPLOAD_ERR_INI_SIZE:
                case UPLOAD_ERR_FORM_SIZE:
                    respondWithError('Die hochgeladene Datei ist zu groß.');
                    break;
                case UPLOAD_ERR_PARTIAL:
                    respondWithError('Die Datei wurde nur teilweise hochgeladen.');
                    break;
                case UPLOAD_ERR_NO_FILE:
                    // kein Bild ist erlaubt → still akzeptieren
                    break;
                case UPLOAD_ERR_NO_TMP_DIR:
                case UPLOAD_ERR_CANT_WRITE:
                case UPLOAD_ERR_EXTENSION:
                    respondWithError('Fehler beim temporären Speichern der Datei.');
                    break;
                default:
                    respondWithError('Unbekannter Fehler beim Dateiupload.');
                    break;
            }
        }
    }

    if ($type === "Kugel") {$preisleistungsbewertung = null;} else {$größe = null;}
    if ($type === "Eisbecher") {$waffel = null;}

    // Update in Tabelle `checkins`
    $stmt = $pdo->prepare("
        UPDATE checkins
        SET nutzer_id = ?, eisdiele_id = ?, typ = ?, geschmackbewertung = ?, waffelbewertung = ?, größenbewertung = ?, preisleistungsbewertung = ?, kommentar = ?
        WHERE id = ?
    ");
    $stmt->execute([$userId, $shopId, $type, $geschmack, $waffel, $größe, $preisleistungsbewertung, $kommentar, $checkinId]);

    if (!empty($bildUrls)) {
        $insertImgStmt = $pdo->prepare("
            INSERT INTO bilder (checkin_id, url, beschreibung)
            VALUES (?, ?, ?)
        ");
        foreach ($bildUrls as $bild) {
            $insertImgStmt->execute([$checkinId, $bild['url'], $bild['beschreibung']]);
        }
    }

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

    // Alte Bilder löschen, die nicht mehr benötigt werden
    foreach ($oldPictures as $pic) {
        if (!in_array($pic['id'], $existingPictures)) {
            $stmt = $pdo->prepare("DELETE FROM bilder WHERE id = ?");
            $stmt->execute([$pic['id']]);
            $filePath = '../../' . $pic['url'];
            if (file_exists($filePath)) unlink($filePath);
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