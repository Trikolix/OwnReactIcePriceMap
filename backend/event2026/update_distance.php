<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $auth = event2026_require_auth_user($pdo);
    $input = event2026_json_input();

    $slotId = (int) ($input['slot_id'] ?? 0);
    $distanceKm = (int) ($input['distance_km'] ?? 0);

    if ($slotId <= 0) {
        throw new InvalidArgumentException('slot_id fehlt.');
    }
    if (!in_array($distanceKm, [140, 175], true)) {
        throw new InvalidArgumentException('Ungültige Distanz.');
    }

    $event = event2026_current_event($pdo, true);
    $eventId = (int) $event['id'];

    $slotStmt = $pdo->prepare("SELECT s.id, s.user_id, s.distance_km
        FROM event2026_participant_slots s
        WHERE s.id = :slot_id
          AND s.event_id = :event_id
        LIMIT 1
        FOR UPDATE");
    $slotStmt->execute([
        ':slot_id' => $slotId,
        ':event_id' => $eventId,
    ]);
    $slot = $slotStmt->fetch(PDO::FETCH_ASSOC);

    if (!$slot) {
        http_response_code(404);
        throw new RuntimeException('Slot nicht gefunden.');
    }

    if ((int) $slot['user_id'] !== (int) $auth['user_id']) {
        http_response_code(403);
        throw new RuntimeException('Du darfst nur deine eigene Strecke ändern.');
    }

    if ((int) $slot['distance_km'] === $distanceKm) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Strecke unverändert.',
            'distance_km' => $distanceKm,
        ]);
        exit;
    }

    $pdo->beginTransaction();

    $updateStmt = $pdo->prepare("UPDATE event2026_participant_slots
        SET distance_km = :distance_km
        WHERE id = :slot_id");
    $updateStmt->execute([
        ':distance_km' => $distanceKm,
        ':slot_id' => $slotId,
    ]);

    // Wave-Zuordnung passt evtl. nicht mehr zur neuen Strecke und wird neu berechnet.
    $pdo->prepare("DELETE FROM event2026_wave_assignments WHERE slot_id = :slot_id")
        ->execute([':slot_id' => $slotId]);

    event2026_log_action($pdo, $eventId, $auth['user_id'], 'slot_distance_update', 'slot', $slotId, [
        'old_distance_km' => (int) $slot['distance_km'],
        'new_distance_km' => $distanceKm,
    ]);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Strecke aktualisiert.',
        'distance_km' => $distanceKm,
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if (http_response_code() < 400) {
        http_response_code(400);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
