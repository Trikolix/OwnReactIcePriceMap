<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/evaluators/CountyCountEvaluator.php';
require_once __DIR__ . '/evaluators/PhotosCountEvaluator.php';
require_once __DIR__ . '/evaluators/KugeleisCountEvaluator.php';
require_once __DIR__ . '/evaluators/SofticeCountEvaluator.php';
require_once __DIR__ . '/evaluators/SundaeCountEvaluator.php';
require_once __DIR__ . '/evaluators/CheckinCountEvaluator.php';
require_once __DIR__ . '/evaluators/BundeslandCountEvaluator.php';
require_once __DIR__ . '/evaluators/FuerstPuecklerEvaluator.php';
require_once __DIR__ . '/evaluators/PerfectWeekEvaluator.php';
require_once __DIR__ . '/evaluators/DayStreakEvaluator.php';
require_once __DIR__ . '/evaluators/AllIceTypesEvaluator.php';
require_once __DIR__ . '/evaluators/DistanceIceTravelerEvaluator.php';

// Preflight OPTIONS-Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Nur POST erlaubt
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST erlaubt']);
    exit;
}

// Hilfsfunktion für Bewertung
function sanitizeRating($val) {
    return ($val !== '' && is_numeric($val)) ? floatval($val) : null;
}
// Bewertung prüfen (zwischen 1.0 und 5.0)
function validateRatingRange($val, $fieldName) {
    if ($val === null) return; // null ist erlaubt (optional)
    if ($val < 1.0 || $val > 5.0) {
        respondWithError("Ungültiger Wert für $fieldName: muss zwischen 1.0 und 5.0 liegen.");
    }
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

// Zentrale Fehlerausgabe
function respondWithError($message, $httpCode = 400, $exception = null) {
    http_response_code($httpCode);
    if ($exception) {
        error_log("Fehler: $message | Exception: " . $exception->getMessage());
    } else {
        error_log("Fehler: $message");
    }
    echo json_encode(['error' => $message]);
    exit;
}

try {
    // Eingabedaten
    $userId = $_POST['userId'] ?? null;
    $shopId = $_POST['shopId'] ?? null;
    $type = $_POST['type'] ?? null;

    $geschmack = sanitizeRating($_POST['geschmackbewertung'] ?? '');
    $waffel = sanitizeRating($_POST['waffelbewertung'] ?? '');
    $größe = sanitizeRating($_POST['größenbewertung'] ?? '');
    $preisleistung = sanitizeRating($_POST['preisleistungsbewertung'] ?? '');
    // Bewertungen validieren
    validateRatingRange($geschmack, 'geschmackbewertung');
    validateRatingRange($waffel, 'waffelbewertung');
    validateRatingRange($größe, 'größenbewertung');
    validateRatingRange($preisleistung, 'preisleistungsbewertung');
    $kommentar = $_POST['kommentar'] ?? '';
    $sorten = json_decode($_POST['sorten'] ?? '[]', true);
    if (!is_array($sorten)) $sorten = [];

    if (!$userId || !$shopId || !$type) {
        respondWithError('Fehlende oder ungültige Pflichtdaten.');
    }

    $bild_url = null;
    if (isset($_FILES['bild'])) {
        switch ($_FILES['bild']['error']) {
            case UPLOAD_ERR_OK:
                $uploadDir = '../uploads/checkins/';
                if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
            
                $tempPath = $_FILES['bild']['tmp_name'];
                $filename = uniqid('checkin_', true) . '.jpg';
                $destination = $uploadDir . $filename;
            
                try {
                    resizeImage($tempPath, $destination);
                    $bild_url = 'uploads/checkins/' . $filename;
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


    // INSERT in `checkins`
    $stmt = $pdo->prepare("
        INSERT INTO checkins (nutzer_id, eisdiele_id, typ, geschmackbewertung, waffelbewertung, größenbewertung, preisleistungsbewertung, kommentar, bild_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $shopId, $type, $geschmack, $waffel, $größe, $preisleistung, $kommentar, $bild_url]);
    $checkinId = $pdo->lastInsertId();

    // Evaluatoren
    $evaluators = [
        new CountyCountEvaluator(),
        new CheckinCountEvaluator(),
        new BundeslandCountEvaluator(),
        new PerfectWeekEvaluator(),
        new DayStreakEvaluator(),
        new AllIceTypesEvaluator(),
        new DistanceIceTravelerEvaluator()
    ];

    if ($bild_url !== null) $evaluators[] = new PhotosCountEvaluator();
    if (!empty($sorten)) $evaluators[] = new FuerstPuecklerEvaluator();

    if ($type === "Kugel") $evaluators[] = new KugeleisCountEvaluator();
    elseif ($type === "Softeis") $evaluators[] = new SofticeCountEvaluator();
    elseif ($type === "Eisbecher") $evaluators[] = new SundaeCountEvaluator();

    $newAwards = [];
    foreach ($evaluators as $evaluator) {
        try {
            $evaluated = $evaluator->evaluate($userId);
            $newAwards = array_merge($newAwards, $evaluated);
        } catch (Exception $e) {
            error_log("Fehler beim Evaluator: " . get_class($evaluator) . " - " . $e->getMessage());
        }
    }

    // Sorten speichern
    if (!empty($sorten)) {
        $sorteStmt = $pdo->prepare("
            INSERT INTO checkin_sorten (checkin_id, sortenname, bewertung)
            VALUES (?, ?, ?)
        ");
        foreach ($sorten as $sorte) {
            $name = $sorte['name'] ?? '';
            if (!empty($name)) {
                $bewertung = isset($sorte['bewertung']) && $sorte['bewertung'] !== "" ? floatval($sorte['bewertung']) : $geschmack;
                $sorteStmt->execute([$checkinId, $name, $bewertung]);
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'checkin_id' => $checkinId,
        'new_awards' => $newAwards
    ]);

} catch (Exception $e) {
    respondWithError('Ein unerwarteter Fehler ist aufgetreten.', 500, $e);
}
?>