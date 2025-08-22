<?php
require_once  __DIR__ . '/../db_connect.php';

try {
    $userId = $_POST['nutzer_id'] ?? null;
    $latUser = $_POST['lat'] ?? null;
    $lonUser = $_POST['lon'] ?? null;
    $type = $_POST['type'] ?? null; // 'daily' oder 'weekly'
    $difficulty = $_POST['difficulty'] ?? 'leicht';

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

    // Prüfen, ob User schon aktive Challenge hat
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

    // Radius bestimmen
    $radius = match($difficulty) {
        'leicht' => [0, 5000],
        'mittel' => [5000, 15000],
        'schwer' => [15000, 45000],
        default => [0, 5000],
    };

    // Eisdielen im Radius suchen
    $stmt = $pdo->prepare("
        SELECT id, name, latitude, longitude,
            (6371000 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(latitude)) *
                COS(RADIANS(longitude) - RADIANS(:lon)) +
                SIN(RADIANS(:lat)) * SIN(RADIANS(latitude))
            )) AS distance
        FROM eisdielen
        HAVING distance BETWEEN :minRadius AND :maxRadius
        ORDER BY RAND()
    ");
    $stmt->execute([
        ':lat' => $latUser,
        ':lon' => $lonUser,
        ':minRadius' => $radius[0],
        ':maxRadius' => $radius[1],
    ]);

    $eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($eisdielen) < 5) {
        echo json_encode(['status' => 'error', "message" => "Nicht genügend Eisdielen im Umkreis für eine Challenge."]);
        exit;
    }

    // Zufällige Eisdiele auswählen
    $randomShop = $eisdielen[array_rand($eisdielen)];

    // Valid-Until setzen
    if ($type === 'daily') {
        $now = new DateTime();
        if ((int)$now->format('H') >= 18) {
            // nach 18 Uhr → gültig bis morgen 23:59:59
            $validUntil = $now->modify('tomorrow')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
        } else {
            // sonst bis heute 23:59:59
            $validUntil = $now->setTime(23, 59, 59)->format('Y-m-d H:i:s');
        }
    } else {
        // weekly → bis kommenden Sonntag 23:59:59
        $now = new DateTime();
        $validUntil = $now->modify('sunday this week')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
        if ($validUntil < $now->format('Y-m-d H:i:s')) {
            // falls schon Sonntag, auf nächsten Sonntag gehen
            $validUntil = $now->modify('next sunday')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
        }
    }

    // Challenge eintragen
    $stmt = $pdo->prepare("
        INSERT INTO challenges (nutzer_id, eisdiele_id, type, difficulty, valid_until)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $randomShop['id'], $type, $difficulty, $validUntil]);
    $challengeId = $pdo->lastInsertId();

    echo json_encode([
        "status" => "success",
        "challenge_id" => $challengeId,
        "type" => $type,
        "difficulty" => $difficulty,
        "valid_until" => $validUntil,
        "shop" => $randomShop
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', "message" => "Fehler: " . $e->getMessage()]);
    exit;
}
?>