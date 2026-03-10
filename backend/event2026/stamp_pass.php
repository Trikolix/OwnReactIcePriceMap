<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $auth = event2026_require_auth_user($pdo);
    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];
    $data = event2026_json_input();

    $checkpointId = (int) ($data['checkpoint_id'] ?? 0);
    $mode = event2026_normalize_stamp_card_mode($data['mode'] ?? 'live');
    $source = trim((string) ($data['source'] ?? 'gps_click'));
    $lat = isset($data['lat']) ? (float) $data['lat'] : null;
    $lng = isset($data['lng']) ? (float) $data['lng'] : null;
    $clientDistance = isset($data['distance_m']) ? (float) $data['distance_m'] : null;
    $providedQrCode = trim((string) ($data['qr_code'] ?? ''));
    $providedQrCodeId = isset($data['qr_code_id']) ? (int) $data['qr_code_id'] : 0;
    $checkinId = isset($data['checkin_id']) ? (int) $data['checkin_id'] : null;

    if ($checkpointId <= 0) {
        throw new InvalidArgumentException('checkpoint_id fehlt.');
    }
    if (!in_array($source, ['gps_click', 'qr_scan'], true)) {
        throw new InvalidArgumentException('Ungültige source.');
    }

    $slot = event2026_get_slot_for_user($pdo, $eventId, $auth['user_id']);
    if (!$slot) {
        http_response_code(403);
        throw new RuntimeException('Kein Event-Starterplatz für diesen Account gefunden.');
    }

    $checkpointStmt = $pdo->prepare("SELECT c.*, e.name AS shop_name
        FROM event2026_checkpoints c
        LEFT JOIN eisdielen e ON e.id = c.shop_id
        WHERE c.event_id = :event_id
          AND c.id = :checkpoint_id
          AND c.stamp_card_mode = :stamp_card_mode
        LIMIT 1");
    $checkpointStmt->execute([
        ':event_id' => $eventId,
        ':checkpoint_id' => $checkpointId,
        ':stamp_card_mode' => $mode,
    ]);
    $checkpoint = $checkpointStmt->fetch(PDO::FETCH_ASSOC);
    if (!$checkpoint) {
        throw new InvalidArgumentException('Checkpoint nicht gefunden.');
    }

    if ($mode === 'live' && !event2026_route_applies_to_checkpoint(
        event2026_normalize_route_key($slot['route_key'] ?? ''),
        (string) ($checkpoint['route_keys_csv'] ?? '')
    )) {
        http_response_code(403);
        throw new RuntimeException('Dieser Checkpoint gehört nicht zu deiner Route.');
    }

    $distanceMeters = null;
    if ($source === 'gps_click') {
        if ($lat === null || $lng === null) {
            throw new InvalidArgumentException('Standortdaten fehlen.');
        }
        $distanceMeters = event2026_haversine_distance_m(
            $lat,
            $lng,
            (float) $checkpoint['lat'],
            (float) $checkpoint['lng']
        );
        if ($distanceMeters > 300.0) {
            http_response_code(403);
            throw new RuntimeException('Du bist nicht nah genug am Checkpoint. Bitte nähere dich auf 300 m oder nutze den QR-Code.');
        }
    }

    $qrCodeId = (int) ($checkpoint['qr_code_id'] ?? 0);
    if ($qrCodeId <= 0) {
        throw new RuntimeException('Für diesen Checkpoint ist noch kein QR-Code hinterlegt.');
    }

    if ($source === 'qr_scan') {
        if ($providedQrCode === '') {
            throw new InvalidArgumentException('Für den QR-Scan wird ein QR-Code benötigt.');
        }
        if ($providedQrCodeId > 0 && $providedQrCodeId !== $qrCodeId) {
            throw new RuntimeException('Der gescannte QR-Code gehört nicht zu diesem Checkpoint.');
        }

        $qrStmt = $pdo->prepare("SELECT id FROM qr_codes WHERE code = :code LIMIT 1");
        $qrStmt->execute([':code' => $providedQrCode]);
        $resolvedQrCodeId = (int) ($qrStmt->fetchColumn() ?: 0);
        if ($resolvedQrCodeId !== $qrCodeId) {
            throw new RuntimeException('Der gescannte QR-Code gehört nicht zu diesem Checkpoint.');
        }
    }

    $scanSaved = false;
    $alreadyScanned = false;
    $scanCheckStmt = $pdo->prepare("SELECT 1 FROM user_qr_scans WHERE user_id = :user_id AND qr_code_id = :qr_code_id");
    $scanCheckStmt->execute([
        ':user_id' => $auth['user_id'],
        ':qr_code_id' => $qrCodeId,
    ]);
    if ($scanCheckStmt->fetchColumn()) {
        $alreadyScanned = true;
    } else {
        $scanInsertStmt = $pdo->prepare("INSERT INTO user_qr_scans (user_id, qr_code_id) VALUES (:user_id, :qr_code_id)");
        $scanInsertStmt->execute([
            ':user_id' => $auth['user_id'],
            ':qr_code_id' => $qrCodeId,
        ]);
        $scanSaved = true;
    }

    $passStmt = $pdo->prepare("INSERT INTO event2026_checkpoint_passages (
            event_id,
            checkpoint_id,
            slot_id,
            user_id,
            passed_at,
            source,
            checkin_id,
            qr_payload
        ) VALUES (
            :event_id,
            :checkpoint_id,
            :slot_id,
            :user_id,
            NOW(),
            :source,
            :checkin_id,
            :qr_payload
        ) ON DUPLICATE KEY UPDATE
            source = VALUES(source),
            checkin_id = COALESCE(VALUES(checkin_id), checkin_id),
            qr_payload = COALESCE(NULLIF(VALUES(qr_payload), ''), qr_payload)");
    $passStmt->execute([
        ':event_id' => $eventId,
        ':checkpoint_id' => $checkpointId,
        ':slot_id' => (int) $slot['id'],
        ':user_id' => $auth['user_id'],
        ':source' => $source,
        ':checkin_id' => $checkinId,
        ':qr_payload' => $providedQrCode !== '' ? $providedQrCode : null,
    ]);

    event2026_log_action($pdo, $eventId, $auth['user_id'], 'stamp_card_pass', 'checkpoint', $checkpointId, [
        'mode' => $mode,
        'source' => $source,
        'distance_m' => $distanceMeters,
        'client_distance_m' => $clientDistance,
        'qr_code_id' => $qrCodeId,
        'scan_saved' => $scanSaved,
        'already_scanned' => $alreadyScanned,
        'checkin_id' => $checkinId,
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => $checkinId
            ? 'Checkpoint und Eis-Check-in wurden gespeichert.'
            : 'Checkpoint erfolgreich abgestempelt.',
        'checkpoint' => [
            'id' => (int) $checkpoint['id'],
            'name' => (string) $checkpoint['name'],
            'shop_id' => $checkpoint['shop_id'] !== null ? (int) $checkpoint['shop_id'] : null,
            'shop_name' => $checkpoint['shop_name'] ?: $checkpoint['name'],
            'qr_code_id' => $qrCodeId,
            'passed_at' => date('c'),
            'source' => $source,
            'distance_m' => $distanceMeters,
        ],
        'scan_saved' => $scanSaved,
        'already_scanned' => $alreadyScanned,
        'event_pass_saved' => true,
        'checkin_cta' => true,
        'shop_id' => $checkpoint['shop_id'] !== null ? (int) $checkpoint['shop_id'] : null,
        'shop_name' => $checkpoint['shop_name'] ?: $checkpoint['name'],
    ]);
} catch (Throwable $e) {
    if (http_response_code() < 400) {
        http_response_code(400);
    }

    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
