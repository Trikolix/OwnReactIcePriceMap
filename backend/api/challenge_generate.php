<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/opening_hours.php';

function isFutureDailyChallenge(array $challenge): bool
{
    if (($challenge['type'] ?? null) !== 'daily') {
        return false;
    }

    $validFrom = $challenge['valid_from'] ?? null;
    if (!$validFrom) {
        return false;
    }

    $validFromTs = strtotime((string)$validFrom);
    if ($validFromTs === false) {
        return false;
    }

    return $validFromTs > time();
}

try {
    $userId = $_POST['nutzer_id'] ?? null;
    $latUser = $_POST['lat'] ?? null;
    $lonUser = $_POST['lon'] ?? null;
    $type = $_POST['type'] ?? null;
    $difficulty = $_POST['difficulty'] ?? 'leicht';
    $challengeId = $_POST['challenge_id'] ?? null;
    $forTomorrow = filter_var($_POST['for_tomorrow'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $customMinKm = isset($_POST['custom_min_km']) ? (int)$_POST['custom_min_km'] : null;
    $customMaxKm = isset($_POST['custom_max_km']) ? (int)$_POST['custom_max_km'] : null;

    if (!$userId || !$latUser || !$lonUser || !$type) {
        echo json_encode(['status' => 'error', 'message' => 'Fehlende Parameter.']);
        exit;
    }

    if (!in_array($type, ['daily', 'weekly'], true)) {
        echo json_encode(['status' => 'error', 'message' => 'Ungültiger Challenge-Typ.']);
        exit;
    }

    if (!in_array($difficulty, ['leicht', 'mittel', 'schwer', 'individuell'], true)) {
        echo json_encode(['status' => 'error', 'message' => 'Ungültige Schwierigkeit.']);
        exit;
    }

    if ($difficulty === 'individuell') {
        if ($customMinKm === null || $customMaxKm === null) {
            echo json_encode(['status' => 'error', 'message' => 'Für individuelle Challenges fehlen Distanzwerte.']);
            exit;
        }
        if ($customMinKm < 15 || $customMinKm > 60 || $customMaxKm < 45 || $customMaxKm > 100 || $customMaxKm < ($customMinKm + 5)) {
            echo json_encode(['status' => 'error', 'message' => 'Ungültiger Distanzbereich für individuelle Challenges.']);
            exit;
        }
    } else {
        $customMinKm = null;
        $customMaxKm = null;
    }

    $requestedSlot = $type === 'daily' && $forTomorrow ? 'daily_tomorrow' : ($type === 'daily' ? 'daily_today' : 'weekly');

    if ($challengeId) {
        $stmt = $pdo->prepare('SELECT * FROM challenges WHERE id = ? AND nutzer_id = ?');
        $stmt->execute([$challengeId, $userId]);
        $oldChallenge = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldChallenge) {
            echo json_encode(['status' => 'error', 'message' => 'Challenge nicht gefunden.']);
            exit;
        }

        if ((int)$oldChallenge['recreated'] === 1) {
            echo json_encode(['status' => 'error', 'message' => 'Diese Challenge wurde bereits neu generiert.']);
            exit;
        }

        if ($oldChallenge['valid_until'] < date('Y-m-d H:i:s')) {
            echo json_encode(['status' => 'error', 'message' => 'Challenge ist abgelaufen.']);
            exit;
        }

        $existingSlot = isFutureDailyChallenge($oldChallenge)
            ? 'daily_tomorrow'
            : (($oldChallenge['type'] ?? null) === 'daily' ? 'daily_today' : 'weekly');

        if ($existingSlot !== $requestedSlot) {
            echo json_encode(['status' => 'error', 'message' => 'Challenge-Slot passt nicht zum angeforderten Zeitpunkt.']);
            exit;
        }
    } else {
        $stmt = $pdo->prepare('
            SELECT *
            FROM challenges
            WHERE nutzer_id = ?
              AND type = ?
              AND difficulty = ?
              AND valid_until > NOW()
        ');
        $stmt->execute([$userId, $type, $difficulty]);
        $existingChallenges = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $matchingSlotChallenge = array_filter($existingChallenges, static function (array $challenge) use ($requestedSlot) {
            $slot = isFutureDailyChallenge($challenge)
                ? 'daily_tomorrow'
                : (($challenge['type'] ?? null) === 'daily' ? 'daily_today' : 'weekly');

            return $slot === $requestedSlot;
        });
        if (count($matchingSlotChallenge) > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Du hast bereits eine aktive Challenge dieses Typs.']);
            exit;
        }
    }

    $radius = match ($difficulty) {
        'leicht' => [0, 5000],
        'mittel' => [5000, 15000],
        'schwer' => [15000, 45000],
        'individuell' => [$customMinKm * 1000, $customMaxKm * 1000],
        default => [0, 5000],
    };

    $lat = (float)$latUser;
    $lon = (float)$lonUser;
    $earthRadius = 6371000;

    $minLat = $lat - rad2deg($radius[1] / $earthRadius);
    $maxLat = $lat + rad2deg($radius[1] / $earthRadius);
    $minLon = $lon - rad2deg($radius[1] / $earthRadius / cos(deg2rad($lat)));
    $maxLon = $lon + rad2deg($radius[1] / $earthRadius / cos(deg2rad($lat)));

    $stmt = $pdo->prepare('
        SELECT
            e.id, e.name, e.latitude, e.longitude, e.adresse, e.openingHours, e.opening_hours_note, e.status,
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
          AND e.status = \'open\'
        HAVING distance BETWEEN :minRadius AND :maxRadius
    ');
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
    if (count($allShops) < 5) {
        echo json_encode(['status' => 'error', 'message' => 'Nicht genügend Eisdielen im Umkreis für eine Challenge.']);
        exit;
    }

    $freeShops = array_values(array_filter($allShops, static fn($shop) => (int)$shop['has_active_challenge'] === 0));
    if (count($freeShops) < 1) {
        echo json_encode(['status' => 'error', 'message' => 'Alle möglichen Eisdielen hast du aktuell schon als offene Challenge.']);
        exit;
    }

    $randomShop = $freeShops[array_rand($freeShops)];

    $now = new DateTime();
    $validFrom = $now->format('Y-m-d H:i:s');
    if ($type === 'daily') {
        if ($forTomorrow) {
            $validFrom = $now->modify('tomorrow')->setTime(0, 0, 0)->format('Y-m-d H:i:s');
            $validUntil = $now->setTime(23, 59, 59)->format('Y-m-d H:i:s');
        } else {
            if ((int)$now->format('H') >= 18) {
                $validUntil = $now->modify('tomorrow')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
            } else {
                $validUntil = $now->setTime(23, 59, 59)->format('Y-m-d H:i:s');
            }
        }
    } else {
        $validUntil = $now->modify('next sunday')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
    }

    if ($challengeId) {
        $stmt = $pdo->prepare('
            UPDATE challenges
            SET eisdiele_id = ?, valid_until = ?, valid_from = ?, recreated = 1,
                custom_min_distance_m = ?, custom_max_distance_m = ?
            WHERE id = ? AND nutzer_id = ?
        ');
        $stmt->execute([$randomShop['id'], $validUntil, $validFrom, $radius[0], $radius[1], $challengeId, $userId]);
        $newChallengeId = $challengeId;
        $isRecreated = true;
    } else {
        $stmt = $pdo->prepare('
            INSERT INTO challenges (
                nutzer_id, eisdiele_id, type, difficulty, valid_until, valid_from, recreated,
                custom_min_distance_m, custom_max_distance_m
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
        ');
        $stmt->execute([$userId, $randomShop['id'], $type, $difficulty, $validUntil, $validFrom, $radius[0], $radius[1]]);
        $newChallengeId = $pdo->lastInsertId();
        $isRecreated = false;
    }

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
        'id' => (int)$newChallengeId,
        'challenge_id' => (int)$newChallengeId,
        'type' => $type,
        'difficulty' => $difficulty,
        'valid_until' => $validUntil,
        'valid_from' => $validFrom,
        'custom_min_distance_m' => $radius[0],
        'custom_max_distance_m' => $radius[1],
        'completed' => 0,
        'recreated' => $isRecreated ? 1 : 0,
        'shop_id' => isset($randomShop['id']) ? (int)$randomShop['id'] : null,
        'shop_name' => $randomShop['name'] ?? null,
        'shop_address' => $randomShop['adresse'] ?? null,
        'shop_lat' => isset($randomShop['latitude']) ? (float)$randomShop['latitude'] : null,
        'shop_lon' => isset($randomShop['longitude']) ? (float)$randomShop['longitude'] : null,
        'openingHours' => $randomShop['openingHours'] ?? null,
        'openingHoursStructured' => $openingStructured,
        'opening_hours_note' => $openingNote,
        'is_open_now' => $isOpenNow,
    ];

    echo json_encode([
        'status' => 'success',
        'challenge_id' => $newChallengeId,
        'type' => $type,
        'difficulty' => $difficulty,
        'valid_until' => $validUntil,
        'valid_from' => $validFrom,
        'custom_min_distance_m' => $radius[0],
        'custom_max_distance_m' => $radius[1],
        'shop' => $shopOut,
        'recreated' => $isRecreated,
        'challenge' => $challengeOut,
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Fehler: ' . $e->getMessage()]);
    exit;
}
?>
