<?php
require_once __DIR__ . '/bootstrap.php';

function event2026_admin_wave_datetime(?string $value): ?string
{
    $value = trim((string) $value);
    if ($value === '') {
        return null;
    }

    $normalized = str_replace('T', ' ', $value);
    if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $normalized)) {
        $normalized .= ':00';
    }

    $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $normalized);
    $dateErrors = DateTimeImmutable::getLastErrors();
    if (!$date || ($dateErrors !== false && ((int) $dateErrors['warning_count'] > 0 || (int) $dateErrors['error_count'] > 0))) {
        throw new InvalidArgumentException('Ungültige Startzeit.');
    }

    return $date->format('Y-m-d H:i:s');
}

function event2026_admin_wave_payload(array $data): array
{
    $waveCode = strtoupper(trim((string) ($data['wave_code'] ?? '')));
    $distanceKm = (int) ($data['distance_km'] ?? 0);
    $paceGroup = trim((string) ($data['pace_group'] ?? ''));
    $capacity = (int) ($data['capacity'] ?? 20);
    $startTime = event2026_admin_wave_datetime($data['start_time'] ?? null);

    if ($waveCode === '' || strlen($waveCode) > 32) {
        throw new InvalidArgumentException('Bitte einen Wellencode mit maximal 32 Zeichen angeben.');
    }
    if (!preg_match('/^[A-Z0-9_-]+$/', $waveCode)) {
        throw new InvalidArgumentException('Wellencode darf nur Buchstaben, Zahlen, _ und - enthalten.');
    }
    if ($distanceKm <= 0 || $distanceKm > 300) {
        throw new InvalidArgumentException('Ungültige Distanz.');
    }
    if (!in_array($paceGroup, ['unter_24', '24_27', '27_30', 'ueber_30', 'family'], true)) {
        throw new InvalidArgumentException('Ungültige Tempogruppe.');
    }
    if ($capacity < 1 || $capacity > 200) {
        throw new InvalidArgumentException('Ungültige Kapazität.');
    }

    return [
        'wave_code' => $waveCode,
        'distance_km' => $distanceKm,
        'pace_group' => $paceGroup,
        'capacity' => $capacity,
        'is_women_wave' => 0,
        'start_time' => $startTime,
    ];
}

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $admin = event2026_require_admin($pdo);
    $data = event2026_json_input();
    $action = (string) ($data['action'] ?? '');

    $pdo->beginTransaction();
    $event = event2026_current_event($pdo, true);
    $eventId = (int) $event['id'];

    if ($action === 'create') {
        $payload = event2026_admin_wave_payload($data);
        $stmt = $pdo->prepare("INSERT INTO event2026_waves (
                event_id,
                distance_km,
                wave_code,
                start_time,
                capacity,
                is_women_wave,
                pace_group
            ) VALUES (
                :event_id,
                :distance_km,
                :wave_code,
                :start_time,
                :capacity,
                :is_women_wave,
                :pace_group
            )");
        $stmt->execute([
            ':event_id' => $eventId,
            ':distance_km' => $payload['distance_km'],
            ':wave_code' => $payload['wave_code'],
            ':start_time' => $payload['start_time'],
            ':capacity' => $payload['capacity'],
            ':is_women_wave' => $payload['is_women_wave'],
            ':pace_group' => $payload['pace_group'],
        ]);
        $waveId = (int) $pdo->lastInsertId();
        event2026_log_action($pdo, $eventId, $admin['user_id'], 'wave_create_manual', 'wave', $waveId, $payload);
        $pdo->commit();

        echo json_encode(['status' => 'success', 'message' => 'Startwelle wurde angelegt.', 'wave_id' => $waveId]);
        exit;
    }

    if ($action === 'update') {
        $waveId = (int) ($data['wave_id'] ?? 0);
        if ($waveId <= 0) {
            throw new InvalidArgumentException('Startwelle fehlt.');
        }
        $payload = event2026_admin_wave_payload($data);
        $existsStmt = $pdo->prepare("SELECT id FROM event2026_waves WHERE id = :wave_id AND event_id = :event_id LIMIT 1 FOR UPDATE");
        $existsStmt->execute([':wave_id' => $waveId, ':event_id' => $eventId]);
        if (!$existsStmt->fetch()) {
            throw new RuntimeException('Startwelle wurde nicht gefunden.');
        }
        $stmt = $pdo->prepare("UPDATE event2026_waves
            SET distance_km = :distance_km,
                wave_code = :wave_code,
                start_time = :start_time,
                capacity = :capacity,
                is_women_wave = :is_women_wave,
                pace_group = :pace_group,
                updated_at = NOW()
            WHERE id = :wave_id AND event_id = :event_id");
        $stmt->execute([
            ':distance_km' => $payload['distance_km'],
            ':wave_code' => $payload['wave_code'],
            ':start_time' => $payload['start_time'],
            ':capacity' => $payload['capacity'],
            ':is_women_wave' => $payload['is_women_wave'],
            ':pace_group' => $payload['pace_group'],
            ':wave_id' => $waveId,
            ':event_id' => $eventId,
        ]);
        event2026_log_action($pdo, $eventId, $admin['user_id'], 'wave_update_manual', 'wave', $waveId, $payload);
        $pdo->commit();

        echo json_encode(['status' => 'success', 'message' => 'Startwelle wurde gespeichert.', 'wave_id' => $waveId]);
        exit;
    }

    if ($action === 'delete') {
        $waveId = (int) ($data['wave_id'] ?? 0);
        if ($waveId <= 0) {
            throw new InvalidArgumentException('Startwelle fehlt.');
        }
        $stmt = $pdo->prepare("DELETE FROM event2026_waves WHERE id = :wave_id AND event_id = :event_id");
        $stmt->execute([':wave_id' => $waveId, ':event_id' => $eventId]);
        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException('Startwelle wurde nicht gefunden.');
        }
        event2026_log_action($pdo, $eventId, $admin['user_id'], 'wave_delete_manual', 'wave', $waveId);
        $pdo->commit();

        echo json_encode(['status' => 'success', 'message' => 'Startwelle wurde gelöscht.']);
        exit;
    }

    if ($action === 'assign') {
        $slotId = (int) ($data['slot_id'] ?? 0);
        $waveId = (int) ($data['wave_id'] ?? 0);
        if ($slotId <= 0 || $waveId <= 0) {
            throw new InvalidArgumentException('Teilnehmer und Startwelle sind erforderlich.');
        }

        $slotStmt = $pdo->prepare("SELECT id FROM event2026_participant_slots WHERE id = :slot_id AND event_id = :event_id LIMIT 1 FOR UPDATE");
        $slotStmt->execute([':slot_id' => $slotId, ':event_id' => $eventId]);
        if (!$slotStmt->fetch()) {
            throw new RuntimeException('Teilnehmer wurde nicht gefunden.');
        }

        $waveStmt = $pdo->prepare("SELECT id FROM event2026_waves WHERE id = :wave_id AND event_id = :event_id LIMIT 1 FOR UPDATE");
        $waveStmt->execute([':wave_id' => $waveId, ':event_id' => $eventId]);
        if (!$waveStmt->fetch()) {
            throw new RuntimeException('Startwelle wurde nicht gefunden.');
        }

        $stmt = $pdo->prepare("INSERT INTO event2026_wave_assignments (slot_id, wave_id, assigned_at)
            VALUES (:slot_id, :wave_id, NOW())
            ON DUPLICATE KEY UPDATE wave_id = VALUES(wave_id), assigned_at = NOW()");
        $stmt->execute([':slot_id' => $slotId, ':wave_id' => $waveId]);
        event2026_log_action($pdo, $eventId, $admin['user_id'], 'wave_assign_manual', 'slot', $slotId, ['wave_id' => $waveId]);
        $pdo->commit();

        echo json_encode(['status' => 'success', 'message' => 'Teilnehmer wurde zugeordnet.']);
        exit;
    }

    if ($action === 'unassign') {
        $slotId = (int) ($data['slot_id'] ?? 0);
        if ($slotId <= 0) {
            throw new InvalidArgumentException('Teilnehmer fehlt.');
        }
        $stmt = $pdo->prepare("DELETE wa
            FROM event2026_wave_assignments wa
            INNER JOIN event2026_participant_slots s ON s.id = wa.slot_id
            WHERE wa.slot_id = :slot_id AND s.event_id = :event_id");
        $stmt->execute([':slot_id' => $slotId, ':event_id' => $eventId]);
        event2026_log_action($pdo, $eventId, $admin['user_id'], 'wave_unassign_manual', 'slot', $slotId);
        $pdo->commit();

        echo json_encode(['status' => 'success', 'message' => 'Zuordnung wurde entfernt.']);
        exit;
    }

    throw new InvalidArgumentException('Ungültige Aktion.');
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
