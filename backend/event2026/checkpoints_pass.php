<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $auth = event2026_require_auth_user($pdo);
    $data = event2026_json_input();

    $checkpointId = (int) ($data['checkpoint_id'] ?? 0);
    $source = (string) ($data['source'] ?? 'onsite_form');
    $checkinId = isset($data['checkin_id']) ? (int) $data['checkin_id'] : null;
    $qrPayload = trim((string) ($data['qr_payload'] ?? ''));

    if ($checkpointId <= 0) {
        throw new InvalidArgumentException('checkpoint_id fehlt.');
    }
    if (!in_array($source, ['qr', 'onsite_form'], true)) {
        throw new InvalidArgumentException('Ungültige source.');
    }

    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    $slot = event2026_get_slot_for_user($pdo, $eventId, $auth['user_id']);
    if (!$slot) {
        http_response_code(403);
        throw new RuntimeException('Kein Event-Starterplatz für diesen Account gefunden.');
    }

    $existsCheckpointStmt = $pdo->prepare("SELECT id FROM event2026_checkpoints WHERE event_id = :event_id AND id = :checkpoint_id LIMIT 1");
    $existsCheckpointStmt->execute([
        ':event_id' => $eventId,
        ':checkpoint_id' => $checkpointId,
    ]);
    if (!$existsCheckpointStmt->fetchColumn()) {
        throw new InvalidArgumentException('Checkpoint nicht gefunden.');
    }

    $insertStmt = $pdo->prepare("INSERT INTO event2026_checkpoint_passages (
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

    $insertStmt->execute([
        ':event_id' => $eventId,
        ':checkpoint_id' => $checkpointId,
        ':slot_id' => (int) $slot['id'],
        ':user_id' => $auth['user_id'],
        ':source' => $source,
        ':checkin_id' => $checkinId,
        ':qr_payload' => $qrPayload,
    ]);

    event2026_log_action($pdo, $eventId, $auth['user_id'], 'checkpoint_pass', 'checkpoint', $checkpointId, [
        'slot_id' => (int) $slot['id'],
        'source' => $source,
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Checkpoint-Passage gespeichert.',
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
