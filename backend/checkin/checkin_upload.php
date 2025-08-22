<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/levelsystem.php';
require_once __DIR__ . '/../lib/image_upload.php';
require_once __DIR__ . '/../evaluators/CountyCountEvaluator.php';
require_once __DIR__ . '/../evaluators/CountryCountEvaluator.php';
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
require_once __DIR__ . '/../evaluators/GeschmacksvielfaltEvaluator.php';
require_once __DIR__ . '/../evaluators/EarlyStarterEvaluator.php';
require_once __DIR__ . '/../evaluators/WeekStreakEvaluator.php';
require_once __DIR__ . '/../evaluators/IcePortionsPerWeekEvaluator.php';
require_once __DIR__ . '/../evaluators/DetailedCheckinEvaluator.php';
require_once __DIR__ . '/../evaluators/DetailedCheckinCountEvaluator.php';
require_once __DIR__ . '/../evaluators/OnSiteEvaluator.php';

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
    $latUser = $_POST['lat'] ?? null;
    $lonUser = $_POST['lon'] ?? null;

    $isOnSite = 0;
    if ($latUser !== null && $lonUser !== null && is_numeric($latUser) && is_numeric($lonUser)) {
        // Hole Shop-Koordinaten
        $stmt = $pdo->prepare("SELECT latitude, longitude FROM eisdielen WHERE id = ?");
        $stmt->execute([$shopId]);
        $shop = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!empty($shop)) {
            $latShop = $shop['latitude'];
            $lonShop = $shop['longitude'];

            $earthRadius = 6371000; // in Metern
            $dLat = deg2rad($latShop - $latUser);
            $dLon = deg2rad($lonShop - $lonUser);
            $a = sin($dLat/2) * sin($dLat/2) +
                 cos(deg2rad($latUser)) * cos(deg2rad($latShop)) *
                 sin($dLon/2) * sin($dLon/2);
            $c = 2 * atan2(sqrt($a), sqrt(1-$a));
            $distance = $earthRadius * $c; // Distanz in Metern

            if ($distance <= 300) { // Checkin vor Ort
                $isOnSite = 1;
            }

        }
    }

    $geschmack = sanitizeRating($_POST['geschmackbewertung'] ?? '');
    $waffel = sanitizeRating($_POST['waffelbewertung'] ?? '');
    $größe = sanitizeRating($_POST['größenbewertung'] ?? '');
    $preisleistung = sanitizeRating($_POST['preisleistungsbewertung'] ?? '');
    $anreise = $_POST['anreise'] ?? null;
    $erlaubteAnreisen = ['', 'Fahrrad', 'Motorrad', 'Zu Fuß', 'Auto', 'Bus / Bahn', 'Sonstiges'];
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


    // INSERT in `checkins`
    $stmt = $pdo->prepare("
        INSERT INTO checkins (nutzer_id, eisdiele_id, typ, geschmackbewertung, waffelbewertung, größenbewertung, preisleistungsbewertung, kommentar, anreise, is_on_site)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $shopId, $type, $geschmack, $waffel, $größe, $preisleistung, $kommentar, $anreise, $isOnSite]);
    $checkinId = $pdo->lastInsertId();

    if (!empty($bildUrls)) {
        $insertImgStmt = $pdo->prepare("
            INSERT INTO bilder (checkin_id, nutzer_id, url, beschreibung, shop_id)
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($bildUrls as $bild) {
            $insertImgStmt->execute([$checkinId, $userId, $bild['url'], $bild['beschreibung'], $shopId]);
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
        new CountryCountEvaluator(),
        new Chemnitz2025Evaluator(),
        new BundeslandExperteEvaluator(),
        new IceSummerEvaluator(),
        new DifferentIceShopCountEvaluator(),
        new GeschmacksvielfaltEvaluator(),
        new EarlyStarterEvaluator(),
        new AwardCollectorEvaluator(),
        new WeekStreakEvaluator(),
        new IcePortionsPerWeekEvaluator(),
        new DetailedCheckinEvaluator(),
        new DetailedCheckinCountEvaluator()
    ];

    if (!empty($bildUrls)) $evaluators[] = new PhotosCountEvaluator();
    if (!empty($sorten)) $evaluators[] = new FuerstPuecklerEvaluator();

    if ($type === "Kugel") $evaluators[] = new KugeleisCountEvaluator();
    elseif ($type === "Softeis") $evaluators[] = new SofticeCountEvaluator();
    elseif ($type === "Eisbecher") $evaluators[] = new SundaeCountEvaluator();

    if ($anreise === 'Fahrrad') {
        $evaluators[] = new CyclingCountEvaluator();
    }
    elseif ($anreise === 'Zu Fuß') $evaluators[] = new WalkCountEvaluator();
    elseif ($anreise === 'Motorrad') $evaluators[] = new BikeCountEvaluator();

    if ($isOnSite) {
        $evaluators[] = new OnSiteEvaluator();
    }


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

    $levelChange = updateUserLevelIfChanged($pdo, $userId);

    // JSON-Antwort vorbereiten
    echo json_encode([
        'status' => 'success',
        'checkin_id' => $checkinId,
        'new_awards' => $newAwards,
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => $levelChange['level_up'] ? $levelChange['new_level'] : null,
        'level_name' => $levelChange['level_up'] ? $levelChange['level_name'] : null
    ]);

} catch (Exception $e) {
    respondWithError('Ein unerwarteter Fehler ist aufgetreten.' . $e->getMessage(), 500, $e);
}
?>