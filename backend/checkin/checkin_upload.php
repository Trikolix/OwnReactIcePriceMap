<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/email_notification.php';
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
require_once __DIR__ . '/../evaluators/IceSeasonEvaluator.php';
require_once __DIR__ . '/../evaluators/DifferentIceShopCountEvaluator.php';
require_once __DIR__ . '/../evaluators/GeschmacksvielfaltEvaluator.php';
require_once __DIR__ . '/../evaluators/EarlyStarterEvaluator.php';
require_once __DIR__ . '/../evaluators/WeekStreakEvaluator.php';
require_once __DIR__ . '/../evaluators/IcePortionsPerWeekEvaluator.php';
require_once __DIR__ . '/../evaluators/DetailedCheckinEvaluator.php';
require_once __DIR__ . '/../evaluators/DetailedCheckinCountEvaluator.php';
require_once __DIR__ . '/../evaluators/OnSiteEvaluator.php';
require_once __DIR__ . '/../evaluators/OeffisCountEvaluator.php';
require_once __DIR__ . '/../evaluators/EPR2025Evaluator.php';
require_once __DIR__ . '/../evaluators/IceShopOneByOneEvaluator.php';
require_once __DIR__ . '/../evaluators/ChallengeCountEvaluator.php';

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

// -------------------------
// Hilfsfunktionen
// -------------------------
// Wandelt eine übergebene Bewertung in float um oder gibt null zurück,
// falls kein valider Wert vorhanden ist. Erwartet wird ein numerischer
// Wert oder ein leerer String (''). Leerer String -> null erlaubt.
function sanitizeRating($val) {
    return ($val !== '' && is_numeric($val)) ? floatval($val) : null;
}

// Validiert den Wertebereich einer Bewertung. Falls der Wert nicht null ist,
// muss er zwischen 1.0 und 5.0 liegen. Bei ungültigem Wert wird die zentrale
// Fehlerausgabe `respondWithError` aufgerufen und der Request beendet.
function validateRatingRange($val, $fieldName) {
    if ($val === null) return; // null ist erlaubt (optional)
    if ($val < 1.0 || $val > 5.0) {
        respondWithError("Ungültiger Wert für $fieldName: muss zwischen 1.0 und 5.0 liegen.");
    }
}

// Zentrale Fehlerausgabe
// Schreibt eine Meldung in das Error-Log und liefert ein JSON-Error-Objekt
// an den Client. Optional kann eine Exception übergeben werden, deren
// Nachricht ins Log geschrieben wird.
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

function logProfiling($userId, $shopId, $profiling, $evaluatorTimings) {
    $logEntry = [
        'timestamp'  => date('Y-m-d H:i:s'),
        'userId'     => $userId,
        'shopId'     => $shopId,
        'profiling'  => $profiling,
        'evaluators' => $evaluatorTimings
    ];
    file_put_contents(
        __DIR__ . '/../logs/profiling.log',
        json_encode($logEntry, JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND
    );
}

try {

    $__profiling = [];
    $__profiling['start'] = microtime(true);

    // -------------------------
    // Eingabedaten (aus POST)
    // -------------------------
    $userId = $_POST['userId'] ?? null;
    $shopId = $_POST['shopId'] ?? null;
    $type = $_POST['type'] ?? null;
    $latUser = $_POST['lat'] ?? null;
    $lonUser = $_POST['lon'] ?? null;

    // Optional: Referenzierter Checkin (für mentions)
    $referencedCheckinId = $_POST['referencedCheckinId'] ?? null;
    $groupId = $_POST['group_id'] ?? null;
    $datum = $_POST['datum'] ?? null;

    // Bewertungen werden mit der Hilfsfunktion normalisiert
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

    // Wenn keine Gesamt-Geschmacksbewertung übergeben wurde, versuche
    // einen Durchschnitt aus den einzelnen Sorten-Bewertungen zu berechnen.
    // Dadurch bleibt die API flexibel: entweder Gesamtbewertung ODER Sorten mit
    // Einzelbewertungen sind möglich.
    if ($geschmack === null && is_array($sorten)) {
        $bewertungen = [];
        
        foreach ($sorten as $sorte) {
            if (!empty($sorte['bewertung']) && is_numeric($sorte['bewertung'])) {
                $bewertungen[] = $sorte['bewertung'];
            }
        }
        
        if (count($bewertungen) > 0) {
            $durchschnitt = array_sum($bewertungen) / count($bewertungen);
            // Auf 0.1 runden
            $geschmack = round($durchschnitt, 1);
        }
    }

    // -------------------------
    // Bewertungspolitik
    // - Wenn weder eine Gesamtbewertung noch einzelne Sortenbewertungen
    //   übergeben wurden, sollen sowohl die Gesamtbewertung als auch die
    //   Sortenbewertungen als NULL in die DB geschrieben werden.
    // - Wenn eine Gesamtbewertung übergeben wurde, wird diese als Fallback
    //   für Sorten ohne eigene Bewertung verwendet.
    // - Wenn keine Gesamtbewertung übergeben wurde, aber einige Sorten
    //   bewertet wurden, berechnen wir oben bereits den Durchschnitt aus den
    //   bewerteten Sorten und schreiben diesen als Gesamtbewertung sowie als
    //   Fallback für nicht bewertete Sorten.
    // Hinweis: Es gibt daher keine harte Validierung mehr, dass mindestens
    // eine Bewertung vorhanden sein muss.

    // Optional: mentionedUsers JSON aus POST
    $mentionedUsers = json_decode($_POST['mentionedUsers'] ?? '[]', true);
    if (!is_array($mentionedUsers)) $mentionedUsers = [];

    // Validierung: max 20, keine Self-Mentions
    $mentionedUsers = array_unique(array_map('intval', $mentionedUsers));
    if (($key = array_search((int)$userId, $mentionedUsers)) !== false) {
        unset($mentionedUsers[$key]); // Selbst-Erwähnung entfernen
    }
    if (count($mentionedUsers) > 20) {
        throw new Exception('Maximal 20 Nutzer können erwähnt werden.');
    }

    // -------------------------
    // Prüfen, ob der Checkin vor Ort erfolgt ist (distanz <= 300m)
    // Dies wird verwendet, um z.B. On-Site Challenges zu erkennen.
    // Berechnung erfolgt mit Haversine-Formel.
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
    $__profiling['after_onsitecheck'] = microtime(true);

    // -------------------------
    // Bilder verarbeiten (Upload + Resize inside helper). Falls das Helper
    // eine Exception wirft, geben wir diese direkt an den Client zurück.
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

    $__profiling['after_picturehandling'] = microtime(true);

    // -------------------------
    // Datenbank-Transaktion starten
    // Wir führen mehrere DB-Operationen (insert checkins, bilder, mentions,
    // sorten, evaluators -> award inserts) durch. Damit diese atomar sind
    // beginnen wir eine Transaktion. Bei Fehlern wird zurückgerollt.
    $pdo->beginTransaction();


    // -------------------------
    // INSERT in `checkins`
    // Wichtig: Pflichtfelder (nutzer_id, eisdiele_id, typ) wurden oben
    // validiert. Wir unterstützen optional ein übergebenes `datum`.
    $sql = "
        INSERT INTO checkins (
            nutzer_id, eisdiele_id, typ, geschmackbewertung,
            waffelbewertung, größenbewertung, preisleistungsbewertung,
            kommentar, anreise, is_on_site, group_id
            " . ($datum ? ", datum" : "") . "
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            " . ($datum ? ", ?" : "") . "
        )
    ";

    $params = [
        $userId, $shopId, $type, $geschmack,
        $waffel, $größe, $preisleistung,
        $kommentar, $anreise, $isOnSite, $groupId
    ];

    if ($datum) {
        $params[] = $datum;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    // lastInsertId sollte die neue checkin.id liefern. Falls hier kein Wert
    // vorhanden ist, ist etwas beim Insert schiefgelaufen -> Exception.
    $checkinId = $pdo->lastInsertId();
    if (!$checkinId) {
        throw new Exception("Checkin konnte nicht gespeichert werden.");
    }

    // Bilder-Tabelle füllen (falls Bilder hochgeladen wurden)
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
        SELECT c.id, c.anreise, e.bundesland_id AS bundesland, e.landkreis_id AS landkreis, e.land_id AS land, e.name AS shop_name
        FROM checkins c
        JOIN eisdielen e ON c.eisdiele_id = e.id
        WHERE c.id = ?
    ");
    $checkinMeta->execute([$checkinId]);
    $meta = $checkinMeta->fetch(PDO::FETCH_ASSOC);
    $__profiling['after_insert'] = microtime(true);

    // -------------------------
    // Mentions (Erwähnungen) verarbeiten
    // Wenn Nutzer erwähnt wurden, erstellen wir eine Gruppe (optional),
    // fügen Einträge in `checkin_mentions` und `benachrichtigungen` hinzu.
    // Vor dem Insert prüfen wir, ob die erwähnten Nutzer tatsächlich existieren.
    if (count($mentionedUsers) > 0) {
        // Optional: checkin_groups anlegen, falls du Gruppierung nutzen willst
        $pdo->exec("INSERT INTO checkin_groups () VALUES ()");
        $groupId = $pdo->lastInsertId();

        // Checkin mit group_id updaten
        $stmt = $pdo->prepare("UPDATE checkins SET group_id = ? WHERE id = ?");
        $stmt->execute([$groupId, $checkinId]);

        // Einladenden Nutzer holen
        $stmtUser = $pdo->prepare("SELECT username FROM nutzer WHERE id = ?");
        $stmtUser->execute([$userId]);
        $inviter = $stmtUser->fetch(PDO::FETCH_ASSOC);
        $inviterName = $inviter['username'] ?? 'Ein Nutzer';

        // Mentions einfügen + Notifications
        $stmtMention = $pdo->prepare("INSERT INTO checkin_mentions (checkin_id, mentioned_user_id, status) VALUES (?, ?, 'pending')");
        $stmtNotif = $pdo->prepare("INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten) VALUES (?, 'checkin_mention', ?, ?, JSON_OBJECT('checkin_mention_id', ?,'checkin_id', ?, 'by_user', ?, 'shop_id', ?, 'username', ?, 'shop_name', ?))");
        $notifText = "$inviterName hat angegeben, mit dir Eis gegessen zu haben. Checke jetzt dein Eis ein.";

        foreach ($mentionedUsers as $mentionedUserId) {
            // Nutzer existiert?
            $stmtCheckUser = $pdo->prepare("SELECT id FROM nutzer WHERE id = ?");
            $stmtCheckUser->execute([$mentionedUserId]);
            $userRow = $stmtCheckUser->fetch(PDO::FETCH_ASSOC);
            if (!$userRow) continue;

            $stmtMention->execute([$checkinId, $mentionedUserId]);
            $mentionId = $pdo->lastInsertId();
            $stmtNotif->execute([$mentionedUserId, $checkinId, $notifText, $mentionId, $checkinId, $userId, $shopId, $inviterName, $meta['shop_name'] ?? 'einer Eisdiele']);

            // E-Mail über die generische Funktion
            sendNotificationEmailIfAllowed(
                $pdo,
                $mentionedUserId,
                'checkin_mention',
                $inviterName,
                [
                    'shopName' => $meta['shop_name'] ?? 'einer Eisdiele',
                    'shopId' => $shopId,
                    'checkinId' => $checkinId,
                    'mentionId' => $mentionId,
                    'byUserId' => $userId
                ]
            );
        }
    }

    // -------------------------
    // Evaluatoren ausführen
    // Jeder Evaluator kann Awards zurückgeben, die wir sammeln. Evaluatoren
    // sollten selbst keine Transaktion committen/rollbacken, sondern nur
    // DB-Inserts verwenden (z.B. user_awards). Hier fangen wir Exceptions
    // einzelner Evaluatoren, damit ein fehlerhafter Evaluator den kompletten
    // Checkin-Prozess nicht zerstört.
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
        new IceSeasonEvaluator(),
        new DifferentIceShopCountEvaluator(),
        new GeschmacksvielfaltEvaluator(),
        new EarlyStarterEvaluator(),
        new AwardCollectorEvaluator(),
        new WeekStreakEvaluator(),
        new IcePortionsPerWeekEvaluator(),
        new DetailedCheckinEvaluator(),
        new DetailedCheckinCountEvaluator(),
        new IceShopOneByOneEvaluator(),
        new ChallengeCountEvaluator(),
    ];

    if (!empty($bildUrls)) $evaluators[] = new PhotosCountEvaluator();
    if (!empty($sorten)) $evaluators[] = new FuerstPuecklerEvaluator();

    if ($type === "Kugel") $evaluators[] = new KugeleisCountEvaluator();
    elseif ($type === "Softeis") $evaluators[] = new SofticeCountEvaluator();
    elseif ($type === "Eisbecher") $evaluators[] = new SundaeCountEvaluator();

    if ($anreise === 'Fahrrad') {
        $evaluators[] = new CyclingCountEvaluator();
        $evaluators[] = new EPR2025Evaluator();
    }
    elseif ($anreise === 'Zu Fuß') $evaluators[] = new WalkCountEvaluator();
    elseif ($anreise === 'Motorrad') $evaluators[] = new BikeCountEvaluator();
    elseif ($anreise === 'Bus / Bahn') $evaluators[] = new OeffisCountEvaluator();

    if ($isOnSite) {
        // Aktive Challenge suchen
        $stmt = $pdo->prepare("
            SELECT c.id, c.nutzer_id, c.eisdiele_id, c.type, c.difficulty, c.created_at, c.valid_until, c.completed, e.name AS shop_name, e.adresse AS shop_address
            FROM challenges c
            JOIN eisdielen e ON c.eisdiele_id = e.id
            WHERE nutzer_id = :userId
              AND c.eisdiele_id = :shopId
              AND c.completed = 0
              AND c.valid_until >= NOW()
            ORDER BY c.created_at ASC
            LIMIT 1
        ");
        $stmt->execute([
            ':userId' => $userId,
            ':shopId' => $shopId
        ]);
        $challenge = $stmt->fetch(PDO::FETCH_ASSOC);

        $completedChallenge = null;
        if ($challenge) {
            // Challenge auf completed setzen
            $update = $pdo->prepare("UPDATE challenges SET completed = 1, completed_at = NOW() WHERE id = :id");
            $update->execute([':id' => $challenge['id']]);

            // für Response vorbereiten
            $completedChallenge = [
                'id' => $challenge['id'],
                'type' => $challenge['type'],
                'difficulty' => $challenge['difficulty'],
                'created_at' => $challenge['created_at'],
                'valid_until' => $challenge['valid_until'],
                'eisdiele_id' => $challenge['eisdiele_id'],
                'shop_name' => $challenge['shop_name'],
                'shop_address' => $challenge['shop_address'],
                'completed_at' => date('Y-m-d H:i:s')
            ];
            $evaluators[] = new ChallengeCountEvaluator();
        }
        $evaluators[] = new OnSiteEvaluator();
    }

    $evaluatorTimings = [];

    $newAwards = [];
    foreach ($evaluators as $evaluator) {
        $t0 = microtime(true);
        if ($evaluator instanceof MetadataAwardEvaluator) {
            $evaluator->setCheckinMetadata($meta);
        }

        try {
            // Evaluator ausführen. Evaluatoren liefern ein Array mit neuen
            // Awards zurück oder werfen eine Exception, die wir lediglich
            // protokollieren, aber nicht die gesamte Transaktion abbrechen.
            $evaluated = $evaluator->evaluate($userId);
            $newAwards = array_merge($newAwards, $evaluated);
        } catch (Exception $e) {
            error_log("Fehler beim Evaluator: " . get_class($evaluator) . " - " . $e->getMessage());
            // Fehler eines einzelnen Evaluators führt nicht zu Rollback
        }
        $t1 = microtime(true);
        $evaluatorTimings[get_class($evaluator)] = round(($t1 - $t0) * 1000, 2);
    }

    $__profiling['after_evaluators'] = microtime(true);

    // -------------------------
    // Sorten (Eissorten) speichern
    // Wir speichern die Sorten nur, wenn zuvor ein gültiger $checkinId
    // erstellt wurde. Falls $checkinId ungültig wäre, wäre das Insert eine
    // Verletzung der Foreign Key Constraint und würde Exceptions verursachen.
    if (!empty($sorten)) {
        $sorteStmt = $pdo->prepare("
            INSERT INTO checkin_sorten (checkin_id, sortenname, bewertung)
            VALUES (?, ?, ?)
        ");
        foreach ($sorten as $sorte) {
            // Name säubern und leere Einträge überspringen
            $name = trim($sorte['name'] ?? '');
            if ($name === '') continue;

            // Nutze sanitizeRating, um "", null oder numerische Strings
            // konsistent in float|null zu transformieren.
            $rawBew = $sorte['bewertung'] ?? '';
            $sBew = sanitizeRating($rawBew);

            // Fallback-Logik:
            // - Wenn Einzelbewertung vorhanden -> verwende sie
            // - Sonst, wenn Gesamtbewertung ($geschmack) vorhanden -> verwende sie
            // - Sonst -> null (kein Rating)
            if ($sBew === null) {
                if ($geschmack !== null) {
                    $sBew = $geschmack;
                } else {
                    $sBew = null;
                }
            }

            $sorteStmt->execute([$checkinId, $name, $sBew]);
        }
    }

    // Alle DB-Operationen erfolgreich -> Commit
    $pdo->commit();
    $__profiling['after_sorten'] = microtime(true);

    $levelChange = updateUserLevelIfChanged($pdo, $userId);
    $__profiling['after_level'] = microtime(true);

    $profilingDurations = [
        'onsitecheck' => round(($__profiling['after_onsitecheck'] - $__profiling['start']) * 1000, 2) . " ms",
        'picturehandling' => round(($__profiling['after_picturehandling'] - $__profiling['after_onsitecheck']) * 1000, 2) . " ms",
        'insert'      => round(($__profiling['after_insert'] - $__profiling['after_picturehandling']) * 1000, 2) . " ms",
        'evaluators'  => round(($__profiling['after_evaluators'] - $__profiling['after_insert']) * 1000, 2) . " ms",
        'sorten'      => round(($__profiling['after_sorten'] - $__profiling['after_evaluators']) * 1000, 2) . " ms",
        'levelsystem' => round(($__profiling['after_level'] - $__profiling['after_sorten']) * 1000, 2) . " ms",
        'total'       => round(($__profiling['after_level'] - $__profiling['start']) * 1000, 2) . " ms"
    ];

    logProfiling($userId, $shopId, $profilingDurations, $evaluatorTimings);

    // JSON-Antwort vorbereiten
    echo json_encode([
        'status' => 'success',
        'checkin_id' => $checkinId,
        'new_awards' => $newAwards,
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => $levelChange['level_up'] ? $levelChange['new_level'] : null,
        'level_name' => $levelChange['level_up'] ? $levelChange['level_name'] : null,
        'completed_challenge' => $completedChallenge ?? null
    ]);

} catch (Exception $e) {
    // Globales Exception-Handling für diesen Endpoint
    // Logge den Fehler mit Datei/Zeile, versuche ein Rollback falls aktiv
    error_log("Exception in checkin_upload: " . $e->getMessage() . " @ " . $e->getFile() . ":" . $e->getLine());
    try {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
    } catch (Exception $rollbackError) {
        // Falls Rollback fehlschlägt, loggen wir es zusätzlich, aber können
        // nichts weiter tun - wir verhindern damit die "There is no active transaction"-Fehler.
        error_log("Rollback fehlgeschlagen: " . $rollbackError->getMessage());
    }
    // Fehler dem Client mitteilen (inkl. Exception-Nachricht zur Fehlersuche)
    respondWithError('Ein unerwarteter Fehler ist aufgetreten.' . $e->getMessage(), 500, $e);
}
?>		