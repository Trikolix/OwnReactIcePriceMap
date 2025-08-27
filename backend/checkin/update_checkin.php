<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/image_upload.php';

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

$checkinId = $_POST['checkin_id'] ?? null;
$userId = $_POST['userId'] ?? null;
$shopId = $_POST['shopId'] ?? null;
$type = $_POST['type'] ?? null;
$geschmack = sanitizeRating($_POST['geschmackbewertung'] ?? '');
$waffel = sanitizeRating($_POST['waffelbewertung'] ?? '');
$größe = sanitizeRating($_POST['größenbewertung'] ?? '');
$preisleistungsbewertung = sanitizeRating($_POST['preisleistungsbewertung'] ?? '');
$anreise = $_POST['anreise'] ?? '';
$erlaubteAnreisen = ['', 'Fahrrad', 'Motorrad', 'Zu Fuß', 'Auto', 'Bus / Bahn', 'Sonstiges'];
if ($anreise !== null && !in_array($anreise, $erlaubteAnreisen)) {
    respondWithError('Ungültige Anreiseart.');
}
// Bewertungen validieren
validateRatingRange($geschmack, 'geschmackbewertung');
validateRatingRange($waffel, 'waffelbewertung');
validateRatingRange($größe, 'größenbewertung');
validateRatingRange($preisleistungsbewertung, 'preisleistungsbewertung');
$kommentar = $_POST['kommentar'] ?? '';
$sorten = json_decode($_POST['sorten'] ?? '[]', true);
$bestehendeBilder = json_decode($_POST['bestehende_bilder'] ?? '[]', true); // erwartet Pfade wie "uploads/checkins/dateiname.jpg"
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
    $stmt = $pdo->prepare("SELECT id, url, beschreibung FROM bilder WHERE checkin_id = ?");
    $stmt->execute([$checkinId]);
    $oldPictures = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Für einfacheren Zugriff indexieren wir die alten Bilder nach ID
    $oldPicturesById = [];
    foreach ($oldPictures as $pic) {
        $oldPicturesById[$pic['id']] = $pic;
    }

    $bestehendeBilderAssoc = [];
    foreach ($bestehendeBilder as $bild) {
        $bestehendeBilderAssoc[$bild['id']] = $bild;
    }
    // Neue Bilder verarbeiten
    $uploadDir = '../../uploads/checkins/';
    if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);

    $bildUrls = [];
    if (isset($_FILES['bilder']) && is_array($_FILES['bilder']['tmp_name'])) {
        try {
            $bildUrls = processUploadedImages(
                $_FILES['bilder'],
                '../../uploads/checkins/',
                'checkin_',
                $_POST['beschreibungen'] ?? []
            );
        } catch (Exception $e) {
            respondWithError($e->getMessage());
        }
    }

    // Update in Tabelle `checkins`
    $stmt = $pdo->prepare("
        UPDATE checkins
        SET nutzer_id = ?, eisdiele_id = ?, typ = ?, geschmackbewertung = ?, waffelbewertung = ?, größenbewertung = ?, preisleistungsbewertung = ?, kommentar = ?, anreise = ?
        WHERE id = ?
    ");
    $stmt->execute([$userId, $shopId, $type, $geschmack, $waffel, $größe, $preisleistungsbewertung, $kommentar, $anreise, $checkinId]);

    if (!empty($bildUrls)) {
        $insertImgStmt = $pdo->prepare("
            INSERT INTO bilder (checkin_id, url, beschreibung, nutzer_id, shop_id)
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($bildUrls as $bild) {
            $insertImgStmt->execute([$checkinId, $bild['url'], $bild['beschreibung'], $userId, $shopId]);
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
    foreach ($oldPicturesById as $id => $oldPic) {
        if (!isset($bestehendeBilderAssoc[$id])) {
            // Bild wurde gelöscht
            $stmt = $pdo->prepare("DELETE FROM bilder WHERE id = ?");
            $stmt->execute([$id]);
            // Pfad zur Bilddatei auf dem Server
            $bild_pfad = __DIR__ . '/../../' . $oldPic['url']; // Anpassen Sie den Pfad entsprechend Ihrer Verzeichnisstruktur

            // Überprüfen, ob die Datei existiert und löschen
            if (file_exists($bild_pfad)) {
                unlink($bild_pfad);
            }
        } else {
            // Bild noch da – Beschreibung ggf. aktualisieren
            $neueBeschreibung = $bestehendeBilderAssoc[$id]['beschreibung'];
            if ($neueBeschreibung !== $oldPic['beschreibung']) {
                $stmt = $pdo->prepare("UPDATE bilder SET beschreibung = ? WHERE id = ?");
                $stmt->execute([$neueBeschreibung, $id]);
            }
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