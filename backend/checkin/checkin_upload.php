<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../evaluators/CountyCountEvaluator.php';
require_once __DIR__ . '/../evaluators/PhotosCountEvaluator.php';
require_once __DIR__ . '/../evaluators/KugeleisCountEvaluator.php';
require_once __DIR__ . '/../evaluators/SofticeCountEvaluator.php';
require_once __DIR__ . '/../evaluators/SundaeCountEvaluator.php';
require_once __DIR__ . '/../evaluators/CheckinCountEvaluator.php';
require_once __DIR__ . '/../evaluators/BundeslandCountEvaluator.php';
require_once __DIR__ . '/../evaluators/FuerstPuecklerEvaluator.php';
require_once __DIR__ . '/../evaluators/PerfectWeekEvaluator.php';
require_once __DIR__ . '/../evaluators/DayStreakEvaluator.php';
require_once __DIR__ . '/../evaluators/AllIceTypesEvaluator.php';
require_once __DIR__ . '/../evaluators/DistanceIceTravelerEvaluator.php';
require_once __DIR__ . '/../evaluators/StammkundeEvaluator.php';
require_once __DIR__ . '/../evaluators/CountryVisitEvaluator.php';
require_once __DIR__ . '/../evaluators/Chemnitz2025Evaluator.php';
require_once __DIR__ . '/../evaluators/BundeslandExperteEvaluator.php';
require_once __DIR__ . '/../evaluators/CyclingCountEvaluator.php';
require_once __DIR__ . '/../evaluators/WalkCountEvaluator.php';
require_once __DIR__ . '/../evaluators/BikeCountEvaluator.php';
require_once __DIR__ . '/../evaluators/GeschmackstreueEvaluator.php';
require_once __DIR__ . '/../evaluators/AwardCollectorEvaluator.php';
require_once __DIR__ . '/../evaluators/IceSummerEvaluator.php';
require_once __DIR__ . '/../evaluators/DifferentIceShopCountEvaluator.php';

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
            // EXIF nur für JPEG
            $exif = @exif_read_data($sourcePath);
            if (!empty($exif['Orientation'])) {
                $orientation = $exif['Orientation'];
                switch ($orientation) {
                    case 3:
                        $srcImage = imagerotate($srcImage, 180, 0);
                        break;
                    case 6:
                        $srcImage = imagerotate($srcImage, -90, 0);
                        break;
                    case 8:
                        $srcImage = imagerotate($srcImage, 90, 0);
                        break;
                }
                // Neue Größe holen, falls gedreht
                $width = imagesx($srcImage);
                $height = imagesy($srcImage);
            }
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
    $anreise = $_POST['anreise'] ?? null;
    $erlaubteAnreisen = ['', 'Fahrrad', 'Motorrad', 'Zu Fuß', 'Auto', 'Sonstiges'];
    if ($anreise !== null && !in_array($anreise, $erlaubteAnreisen)) {
        respondWithError('Ungültige Anreiseart.');
    }
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


    // INSERT in `checkins`
    $stmt = $pdo->prepare("
        INSERT INTO checkins (nutzer_id, eisdiele_id, typ, geschmackbewertung, waffelbewertung, größenbewertung, preisleistungsbewertung, kommentar, anreise)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $shopId, $type, $geschmack, $waffel, $größe, $preisleistung, $kommentar, $anreise]);
    $checkinId = $pdo->lastInsertId();

    if (!empty($bildUrls)) {
        $insertImgStmt = $pdo->prepare("
            INSERT INTO bilder (checkin_id, nutzer_id, url, beschreibung)
            VALUES (?, ?, ?, ?)
        ");
        foreach ($bildUrls as $bild) {
            $insertImgStmt->execute([$checkinId, $userId, $bild['url'], $bild['beschreibung']]);
        }
    }

    // Metadaten des neuen Checkins laden
    $checkinMeta = $pdo->prepare("
        SELECT c.id, c.anreise, e.bundesland_id AS bundesland, e.landkreis_id AS landkreis, e.land_id AS land
        FROM checkins c
        JOIN eisdielen e ON c.eisdiele_id = e.id
        WHERE c.id = ?
    ");
    $checkinMeta->execute([$checkinId]);
    $meta = $checkinMeta->fetch(PDO::FETCH_ASSOC);

    // Evaluatoren
    $evaluators = [
        new CountyCountEvaluator(),
        new CheckinCountEvaluator(),
        new BundeslandCountEvaluator(),
        new PerfectWeekEvaluator(),
        new DayStreakEvaluator(),
        new AllIceTypesEvaluator(),
        new DistanceIceTravelerEvaluator(),
        new StammkundeEvaluator(),
        new CountryVisitEvaluator(),
        new Chemnitz2025Evaluator(),
        new BundeslandExperteEvaluator(),
        new IceSummerEvaluator(),
        new DifferentIceShopCountEvaluator(),
        new AwardCollectorEvaluator()
    ];

    if (!empty($bildUrls)) $evaluators[] = new PhotosCountEvaluator();
    if (!empty($sorten)) $evaluators[] = new FuerstPuecklerEvaluator();

    if ($type === "Kugel") $evaluators[] = new KugeleisCountEvaluator();
    elseif ($type === "Softeis") $evaluators[] = new SofticeCountEvaluator();
    elseif ($type === "Eisbecher") $evaluators[] = new SundaeCountEvaluator();

    if ($anreise === 'Fahrrad') $evaluators[] = new CyclingCountEvaluator();
    elseif ($anreise === 'Zu Fuß') $evaluators[] = new WalkCountEvaluator();
    elseif ($anreise === 'Motorrad') $evaluators[] = new BikeCountEvaluator();


    $newAwards = [];
    foreach ($evaluators as $evaluator) {
        if ($evaluator instanceof MetadataAwardEvaluator) {
            $evaluator->setCheckinMetadata($meta);
        }

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
    respondWithError('Ein unerwarteter Fehler ist aufgetreten.' . $e->getMessage(), 500, $e);
}
?>