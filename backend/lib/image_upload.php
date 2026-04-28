<?php

function uploadIniBytes(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }

    $unit = strtolower($value[strlen($value) - 1]);
    $bytes = (int)$value;
    switch ($unit) {
        case 'g':
            $bytes *= 1024;
            // fall through
        case 'm':
            $bytes *= 1024;
            // fall through
        case 'k':
            $bytes *= 1024;
    }

    return $bytes;
}

function isMultipartBodyTooLarge(): bool {
    $contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    $postMaxSize = uploadIniBytes((string)ini_get('post_max_size'));
    return $contentLength > 0 && $postMaxSize > 0 && $contentLength > $postMaxSize;
}

function resizeImage($sourcePath, $destinationPath, $maxDim = 1200, $quality = 75) {
    $imgInfo = getimagesize($sourcePath);
    if (!$imgInfo) {
        throw new Exception('Ungültige Bilddatei.');
    }

    [$width, $height] = $imgInfo;
    $mime = $imgInfo['mime'];

    switch ($mime) {
        case 'image/jpeg':
            $srcImage = imagecreatefromjpeg($sourcePath);
            $exif = @exif_read_data($sourcePath);
            if (!empty($exif['Orientation'])) {
                switch ($exif['Orientation']) {
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

    $scale = min(1, $maxDim / max($width, $height));
    $newWidth = (int) round($width * $scale);
    $newHeight = (int) round($height * $scale);

    if ($newWidth <= 0 || $newHeight <= 0) {
        throw new Exception('Ungueltige Bildabmessungen.');
    }

    $newImage = imagecreatetruecolor($newWidth, $newHeight);
    $white = imagecolorallocate($newImage, 255, 255, 255);
    imagefill($newImage, 0, 0, $white);
    imagecopyresampled($newImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    imagejpeg($newImage, $destinationPath, $quality);
    imagedestroy($srcImage);
    imagedestroy($newImage);
}

/**
 * Verarbeitet den Upload mehrerer Bilder und gibt Pfade + Beschreibung zurück.
 * 
 * @param array $filesArray `$_FILES['bilder']`
 * @param string $zielVerzeichnis Pfad (relativ zu diesem Skript)
 * @param string $filenamePrefix z. B. "checkin_" oder "bewertung_"
 * @param array $beschreibungen POST-Daten (optional)
 * 
 * @return array [['url' => ..., 'beschreibung' => ...], ...]
 */
function processUploadedImages(array $filesArray, string $zielVerzeichnis, string $filenamePrefix = 'img_', array $beschreibungen = []) {
    $bildUrls = [];

    if (!is_array($filesArray['tmp_name'])) {
        return [];
    }

    if (!file_exists($zielVerzeichnis)) {
        mkdir($zielVerzeichnis, 0777, true);
    }

    foreach ($filesArray['tmp_name'] as $index => $tmpPath) {
        switch ($filesArray['error'][$index]) {
            case UPLOAD_ERR_OK:
                if (!is_uploaded_file($tmpPath)) {
                    throw new Exception('Ungueltiger Datei-Upload.');
                }
                $filename = uniqid($filenamePrefix, true) . '.jpg';
                $destination = $zielVerzeichnis . $filename;
                try {
                    resizeImage($tmpPath, $destination);
                    $relativePath = ltrim(str_replace('../../', '', $zielVerzeichnis), '/') . $filename;
                    $beschreibung = $beschreibungen[$index] ?? null;
                    $bildUrls[] = ['url' => $relativePath, 'beschreibung' => $beschreibung];
                } catch (Exception $e) {
                    throw new Exception('Bildverarbeitung fehlgeschlagen: ' . $e->getMessage());
                }
                break;
            case UPLOAD_ERR_NO_FILE:
                break; // kein Bild hochgeladen
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new Exception('Die hochgeladene Datei ist zu groß.');
            case UPLOAD_ERR_PARTIAL:
                throw new Exception('Die Datei wurde nur teilweise hochgeladen.');
            case UPLOAD_ERR_NO_TMP_DIR:
            case UPLOAD_ERR_CANT_WRITE:
            case UPLOAD_ERR_EXTENSION:
                throw new Exception('Fehler beim temporären Speichern der Datei.');
            default:
                throw new Exception('Unbekannter Fehler beim Dateiupload.');
        }
    }

    return $bildUrls;
}
?>
