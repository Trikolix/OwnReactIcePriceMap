<?php
require_once  __DIR__ . '/../db_connect.php';
require_once  __DIR__ . '/../lib/opening_hours.php';

try {
    $userId = $_POST['nutzer_id'] ?? null;
    $latUser = $_POST['lat'] ?? null;
    $lonUser = $_POST['lon'] ?? null;
    $type = $_POST['type'] ?? null; // 'daily' oder 'weekly'
    $difficulty = $_POST['difficulty'] ?? 'leicht';
    $challengeId = $_POST['challenge_id'] ?? null; // Falls übergeben → Refresh
    $forTomorrow = filter_var($_POST['for_tomorrow'] ?? false, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

    if (!$userId || !$latUser || !$lonUser || !$type) {
        echo json_encode(['status' => 'error', "message" => "Fehlende Parameter."]);
        exit;
    }

    if (!in_array($type, ['daily', 'weekly'])) {
        echo json_encode(['status' => 'error', "message" => "Ungültiger Challenge-Typ."]);
        exit;
    }

    if (!in_array($difficulty, ['leicht', 'mittel', 'schwer', 'individuell'])) {
        echo json_encode(['status' => 'error', "message" => "Ungültige Schwierigkeit."]);
        exit;
    }

    if ($forTomorrow === null) {
        throw new RuntimeException('Ungültiger Zeitpunkt.');
    }

    // Use the database clock, matching valid_from defaults and all activity checks.
    $now = new DateTimeImmutable((string)$pdo->query('SELECT NOW()')->fetchColumn());
    $validFrom = $type === 'daily' && $forTomorrow
        ? $now->modify('tomorrow')->setTime(0, 0)
        : $now;
    $validUntil = ($type === 'daily' ? $validFrom : $now->modify('next sunday'))
        ->setTime(23, 59, 59)->format('Y-m-d H:i:s');

    // Wenn Refresh → prüfen ob Challenge existiert
    if ($challengeId) {
        $stmt = $pdo->prepare("SELECT * FROM challenges WHERE id = ? AND nutzer_id = ?");
        $stmt->execute([$challengeId, $userId]);
        $oldChallenge = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldChallenge) {
            echo json_encode(['status' => 'error', 'message' => 'Challenge nicht gefunden.']);
            exit;
        }

        if ($oldChallenge['type'] !== $type || $oldChallenge['difficulty'] !== $difficulty) {
            throw new RuntimeException('Typ und Schwierigkeit der Challenge können beim Neuversuch nicht geändert werden.');
        }

        if ((int)$oldChallenge['completed'] === 1) {
            throw new RuntimeException('Diese Challenge wurde bereits abgeschlossen.');
        }

        if ($oldChallenge['recreated'] == 1) {
            echo json_encode(['status' => 'error', 'message' => 'Diese Challenge wurde bereits neu generiert.']);
            exit;
        }

        if ($oldChallenge['valid_until'] < $now->format('Y-m-d H:i:s')) {
            echo json_encode(['status' => 'error', 'message' => 'Challenge ist abgelaufen.']);
            exit;
        }

        // A retry changes the shop, preserving the originally selected day and deadline.
        $validFrom = new DateTimeImmutable($oldChallenge['valid_from'] ?? $oldChallenge['created_at']);
        $validUntil = $oldChallenge['valid_until'];
    } else {
        // Today and tomorrow are separate daily slots, including completed challenges.
        // Older evening challenges still running today occupy today's slot too.
        $dailySlot = $type === 'daily'
            ? ' AND COALESCE(valid_from, created_at) >= ? AND COALESCE(valid_from, created_at) < ?'
            : '';
        $parameters = [$userId, $type, $difficulty, $now->format('Y-m-d H:i:s')];
        if ($type === 'daily') {
            $parameters[] = $forTomorrow ? $validFrom->format('Y-m-d H:i:s') : '1000-01-01 00:00:00';
            $parameters[] = $validFrom->modify('tomorrow')->setTime(0, 0)->format('Y-m-d H:i:s');
        }
        $stmt = $pdo->prepare("
            SELECT id FROM challenges
            WHERE nutzer_id = ?
            AND type = ?
            AND difficulty = ?
            AND valid_until >= ?
            $dailySlot
            LIMIT 1
        ");
        $stmt->execute($parameters);
        if ($stmt->fetchColumn() !== false) {
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
    if ($difficulty === 'individuell') {
        $minKm = filter_var($_POST['custom_min_km'] ?? null, FILTER_VALIDATE_FLOAT);
        $maxKm = filter_var($_POST['custom_max_km'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($minKm === false || $maxKm === false || $minKm < 15 || $minKm > 60 || $maxKm < 45 || $maxKm > 100 || $maxKm < $minKm + 5) {
            throw new RuntimeException('Ungültiger individueller Distanzbereich.');
        }
        $radius = [(int)round($minKm * 1000), (int)round($maxKm * 1000)];
    }

    $validFrom = $validFrom->format('Y-m-d H:i:s');

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
            e.id, e.name, e.latitude, e.longitude, e.adresse, e.openingHours, e.opening_hours_note, e.status,
            (6371000 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(e.latitude)) *
                COS(RADIANS(e.longitude) - RADIANS(:lon)) +
                SIN(RADIANS(:latSin)) * SIN(RADIANS(e.latitude))
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
          AND e.place_type = 'ice_shop'
        HAVING distance BETWEEN :minRadius AND :maxRadius
    ");
    $stmt->execute([
        ':lat' => $lat,
        ':latSin' => $lat,
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

    if ($challengeId) {
        // --- Recreate: Alte Challenge aktualisieren ---
        $stmt = $pdo->prepare("
            UPDATE challenges
            SET eisdiele_id = ?, valid_from = ?, valid_until = ?, custom_min_distance_m = ?, custom_max_distance_m = ?, recreated = 1
            WHERE id = ? AND nutzer_id = ?
        ");
        $stmt->execute([$randomShop['id'], $validFrom, $validUntil, $radius[0], $radius[1], $challengeId, $userId]);

        $newChallengeId = $challengeId; // gleiche ID, nur geupdated
        $isRecreated = true;
    } else {
        // --- Neue Challenge anlegen ---
        $stmt = $pdo->prepare("
            INSERT INTO challenges (nutzer_id, eisdiele_id, type, difficulty, valid_from, valid_until, custom_min_distance_m, custom_max_distance_m, recreated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        ");
        $stmt->execute([$userId, $randomShop['id'], $type, $difficulty, $validFrom, $validUntil, $radius[0], $radius[1]]);
        $newChallengeId = $pdo->lastInsertId();
        $isRecreated = false;
    }

    // Response
    // Shop-Objekt umbenennen/erweitern für Frontend-Kompatibilität
    $shopOut = $randomShop;
    $openingRows = fetch_opening_hours_rows($pdo, (int)$randomShop['id']);
    $openingNote = $randomShop['opening_hours_note'] ?? null;
    if (empty($openingRows) && !empty($randomShop['openingHours'])) {
        $parsed = parse_legacy_opening_hours($randomShop['openingHours']);
        $openingRows = $parsed['rows'];
        if ($openingNote === null && $parsed['note']) {
            $openingNote = $parsed['note'];
        }
    }
    $openingStructured = build_structured_opening_hours($openingRows, $openingNote);
    $isOpenNow = is_shop_open($openingRows, null, $randomShop['status'] ?? null);
    if (isset($shopOut['latitude'])) {
        $shopOut['shop_lat'] = $shopOut['latitude'];
    }
    if (isset($shopOut['longitude'])) {
        $shopOut['shop_lon'] = $shopOut['longitude'];
    }
    $shopOut['openingHoursStructured'] = $openingStructured;
    $shopOut['opening_hours_note'] = $openingNote;
    $shopOut['is_open_now'] = $isOpenNow;
    $challengeOut = [
        "id" => (int)$newChallengeId,
        "challenge_id" => (int)$newChallengeId,
        "type" => $type,
        "difficulty" => $difficulty,
        "valid_from" => $validFrom,
        "valid_until" => $validUntil,
        "custom_min_distance_m" => $radius[0],
        "custom_max_distance_m" => $radius[1],
        "completed" => 0,
        "recreated" => $isRecreated ? 1 : 0,
        "shop_id" => isset($randomShop['id']) ? (int)$randomShop['id'] : null,
        "shop_name" => $randomShop['name'] ?? null,
        "shop_address" => $randomShop['adresse'] ?? null,
        "shop_lat" => isset($randomShop['latitude']) ? (float)$randomShop['latitude'] : null,
        "shop_lon" => isset($randomShop['longitude']) ? (float)$randomShop['longitude'] : null,
        "openingHours" => $randomShop['openingHours'] ?? null,
        "openingHoursStructured" => $openingStructured,
        "opening_hours_note" => $openingNote,
        "is_open_now" => $isOpenNow,
    ];
    echo json_encode([
        "status" => "success",
        "challenge_id" => $newChallengeId,
        "type" => $type,
        "difficulty" => $difficulty,
        "valid_from" => $validFrom,
        "valid_until" => $validUntil,
        "custom_min_distance_m" => $radius[0],
        "custom_max_distance_m" => $radius[1],
        "shop" => $shopOut,
        "recreated" => $isRecreated,
        "challenge" => $challengeOut
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', "message" => "Fehler: " . $e->getMessage()]);
    exit;
}
?>
