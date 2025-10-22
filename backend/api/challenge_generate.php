<?php
require_once  __DIR__ . '/../db_connect.php';

try {
    $userId = $_POST['nutzer_id'] ?? null;
    $latUser = $_POST['lat'] ?? null;
    $lonUser = $_POST['lon'] ?? null;
    $type = $_POST['type'] ?? null; // 'daily' oder 'weekly'
    $difficulty = $_POST['difficulty'] ?? 'leicht';
    $challengeId = $_POST['challenge_id'] ?? null; // Falls übergeben → Refresh

    if (!$userId || !$latUser || !$lonUser || !$type) {
        echo json_encode(['status' => 'error', "message" => "Fehlende Parameter."]);
        exit;
    }

    if (!in_array($type, ['daily', 'weekly'])) {
        echo json_encode(['status' => 'error', "message" => "Ungültiger Challenge-Typ."]);
        exit;
    }

    if (!in_array($difficulty, ['leicht', 'mittel', 'schwer'])) {
        echo json_encode(['status' => 'error', "message" => "Ungültige Schwierigkeit."]);
        exit;
    }

    // Wenn Refresh → prüfen ob Challenge existiert
    if ($challengeId) {
        $stmt = $pdo->prepare("SELECT * FROM challenges WHERE id = ? AND nutzer_id = ?");
        $stmt->execute([$challengeId, $userId]);
        $oldChallenge = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldChallenge) {
            echo json_encode(['status' => 'error', 'message' => 'Challenge nicht gefunden.']);
            exit;
        }

        if ($oldChallenge['recreated'] == 1) {
            echo json_encode(['status' => 'error', 'message' => 'Diese Challenge wurde bereits neu generiert.']);
            exit;
        }

        if ($oldChallenge['valid_until'] < date('Y-m-d H:i:s')) {
            echo json_encode(['status' => 'error', 'message' => 'Challenge ist abgelaufen.']);
            exit;
        }
    } else {
        // Nur prüfen ob User bereits aktive Challenge hat (aber nur bei "neu")
        $stmt = $pdo->prepare("
            SELECT * FROM challenges 
            WHERE nutzer_id = ? 
            AND type = ?
            AND difficulty = ?
            AND valid_until > NOW()
        ");
        $stmt->execute([$userId, $type, $difficulty]);
        if ($stmt->rowCount() > 0) {
            echo json_encode(['status' => 'error', "message" => "Du hast bereits eine aktive Challenge dieses Typs."]);
            exit;
        }
    }

    // Radius bestimmen
    $radius = match($difficulty) {
        'leicht' => [0, 5000],
        'mittel' => [5000, 15000],
        'schwer' => [15000, 45000],
        default => [0, 5000],
    };

    // Bounding Box berechnen um Anfrage zu optimieren
    $lat = floatval($latUser);
    $lon = floatval($lonUser);

    $earthRadius = 6371000;

    $minLat = $lat - rad2deg($radius[1] / $earthRadius);
    $maxLat = $lat + rad2deg($radius[1] / $earthRadius);
    $minLon = $lon - rad2deg($radius[1] / $earthRadius / cos(deg2rad($lat)));
    $maxLon = $lon + rad2deg($radius[1] / $earthRadius / cos(deg2rad($lat)));

    // Alle Eisdielen im Radius laden (inkl. Distance) und gleichzeitig prüfen, ob sie schon eine offene Challenge haben
    $stmt = $pdo->prepare("
        SELECT 
            e.id, e.name, e.latitude, e.longitude, e.adresse,
            (6371000 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(e.latitude)) *
                COS(RADIANS(e.longitude) - RADIANS(:lon)) +
                SIN(RADIANS(:lat)) * SIN(RADIANS(e.latitude))
            )) AS distance,
            CASE WHEN c.id IS NULL THEN 0 ELSE 1 END AS has_active_challenge
        FROM eisdielen e
        LEFT JOIN challenges c 
            ON c.eisdiele_id = e.id
            AND c.nutzer_id = :userId
            AND c.type = :type
            AND c.difficulty = :difficulty
            AND c.valid_until > NOW()
        WHERE e.latitude BETWEEN :minLat AND :maxLat
          AND e.longitude BETWEEN :minLon AND :maxLon
          AND e.status = 'open'
        HAVING distance BETWEEN :minRadius AND :maxRadius
    ");
    $stmt->execute([
        ':lat' => $lat,
        ':lon' => $lon,
        ':minLat' => $minLat,
        ':maxLat' => $maxLat,
        ':minLon' => $minLon,
        ':maxLon' => $maxLon,
        ':minRadius' => $radius[0],
        ':maxRadius' => $radius[1],
        ':userId' => $userId,
        ':type' => $type,
        ':difficulty' => $difficulty,
    ]);

    $allShops = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Mindestanzahl prüfen
    if (count($allShops) < 5) {
        echo json_encode(['status' => 'error', "message" => "Nicht genügend Eisdielen im Umkreis für eine Challenge."]);
        exit;
    }

    // Nur Eisdielen ohne offene Challenge filtern
    $freeShops = array_filter($allShops, fn($s) => $s['has_active_challenge'] == 0);

    if (count($freeShops) < 1) {
        echo json_encode(['status' => 'error', "message" => "Alle möglichen Eisdielen hast du aktuell schon als offene Challenge."]);
        exit;
    }

    // Zufällige Eisdiele auswählen
    $randomShop = $freeShops[array_rand($freeShops)];

    // Valid-Until setzen
    $now = new DateTime();
    if ($type === 'daily') {        
        if ((int)$now->format('H') >= 18) {
            // nach 18 Uhr → gültig bis morgen 23:59:59
            $validUntil = $now->modify('tomorrow')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
        } else {
            // sonst bis heute 23:59:59
            $validUntil = $now->setTime(23, 59, 59)->format('Y-m-d H:i:s');
        }
    } else {
        // weekly → bis kommenden Sonntag 23:59:59
        $validUntil = $now->modify('next sunday')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
    }

    if ($challengeId) {
        // --- Recreate: Alte Challenge aktualisieren ---
        $stmt = $pdo->prepare("
            UPDATE challenges 
            SET eisdiele_id = ?, valid_until = ?, recreated = 1 
            WHERE id = ? AND nutzer_id = ?
        ");
        $stmt->execute([$randomShop['id'], $validUntil, $challengeId, $userId]);
    
        $newChallengeId = $challengeId; // gleiche ID, nur geupdated
        $isRecreated = true;
    } else {
        // --- Neue Challenge anlegen ---
        $stmt = $pdo->prepare("
            INSERT INTO challenges (nutzer_id, eisdiele_id, type, difficulty, valid_until, recreated)
            VALUES (?, ?, ?, ?, ?, 0)
        ");
        $stmt->execute([$userId, $randomShop['id'], $type, $difficulty, $validUntil]);
        $newChallengeId = $pdo->lastInsertId();
        $isRecreated = false;
    }
    
    // Response
    echo json_encode([
        "status" => "success",
        "challenge_id" => $newChallengeId,
        "type" => $type,
        "difficulty" => $difficulty,
        "valid_until" => $validUntil,
        "shop" => $randomShop,
        "recreated" => $isRecreated
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', "message" => "Fehler: " . $e->getMessage()]);
    exit;
}
?>