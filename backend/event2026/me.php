<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);
    $auth = event2026_require_auth_user($pdo);

    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    $registrationStmt = $pdo->prepare("SELECT
            r.*,
            p.method AS payment_method,
            p.expected_amount,
            p.paid_amount,
            p.status AS payment_status_detail
        FROM event2026_registrations r
        LEFT JOIN event2026_payments p ON p.registration_id = r.id
        WHERE r.event_id = :event_id AND r.registered_by_user_id = :user_id
        ORDER BY r.created_at DESC
        LIMIT 1");
    $registrationStmt->execute([
        ':event_id' => $eventId,
        ':user_id' => $auth['user_id'],
    ]);
    $registration = $registrationStmt->fetch(PDO::FETCH_ASSOC);

    $slotStmt = $pdo->prepare("SELECT
            s.id,
            s.registration_id,
            s.user_id,
            s.full_name,
            s.email,
            s.distance_km,
            s.pace_group,
            s.women_wave_opt_in,
            s.public_name_consent,
            s.jersey_interest,
            s.jersey_size,
            s.license_status,
            s.legal_accepted_at,
            l.version AS legal_version,
            w.wave_code,
            w.start_time,
            w.is_women_wave
        FROM event2026_participant_slots s
        INNER JOIN event2026_legal_versions l ON l.id = s.legal_version_id
        LEFT JOIN event2026_wave_assignments wa ON wa.slot_id = s.id
        LEFT JOIN event2026_waves w ON w.id = wa.wave_id
        WHERE s.event_id = :event_id AND (s.user_id = :user_id OR s.registration_id = :registration_id)
        ORDER BY s.id ASC");

    $slotStmt->execute([
        ':event_id' => $eventId,
        ':user_id' => $auth['user_id'],
        ':registration_id' => $registration['id'] ?? 0,
    ]);

    $slots = $slotStmt->fetchAll(PDO::FETCH_ASSOC);
    if (!$registration && !$slots) {
        http_response_code(403);
        throw new RuntimeException('Keine Event-Anmeldung für diesen Account gefunden.');
    }

    $ownSlot = null;
    foreach ($slots as $slotRow) {
        if ((int) ($slotRow['user_id'] ?? 0) === (int) $auth['user_id']) {
            $ownSlot = $slotRow;
            break;
        }
    }
    if (!$ownSlot && !empty($slots)) {
        $ownSlot = $slots[0];
    }
    $selectedDistance = (int) ($ownSlot['distance_km'] ?? 140);
    $selectedDistance = max(140, $selectedDistance);

    $checkpointStatsStmt = $pdo->prepare("SELECT
            c.id,
            c.name,
            c.shop_id,
            c.order_index,
            c.is_mandatory,
            c.min_distance_km,
            CASE WHEN p.id IS NULL THEN 0 ELSE 1 END AS passed,
            p.passed_at,
            p.source,
            p.slot_id
        FROM event2026_checkpoints c
        LEFT JOIN event2026_checkpoint_passages p
            ON p.checkpoint_id = c.id
            AND p.event_id = c.event_id
            AND p.user_id = :user_id
        WHERE c.event_id = :event_id
          AND c.min_distance_km <= :selected_distance
        ORDER BY c.order_index ASC, c.id ASC");
    $checkpointStatsStmt->execute([
        ':event_id' => $eventId,
        ':user_id' => $auth['user_id'],
        ':selected_distance' => $selectedDistance,
    ]);
    $checkpoints = $checkpointStatsStmt->fetchAll(PDO::FETCH_ASSOC);

    $mandatoryCount = 0;
    $mandatoryPassed = 0;
    foreach ($checkpoints as $cp) {
        if ((int) $cp['is_mandatory'] === 1) {
            $mandatoryCount++;
            if ((int) $cp['passed'] === 1) {
                $mandatoryPassed++;
            }
        }
    }

    $inviteStatus = [];
    if ($registration) {
        $inviteStmt = $pdo->prepare("SELECT
                s.id AS slot_id,
                s.full_name,
                s.user_id,
                MAX(CASE WHEN t.revoked_at IS NULL THEN t.expires_at END) AS latest_expires_at,
                MAX(CASE WHEN t.revoked_at IS NULL AND t.claimed_at IS NOT NULL THEN 1 ELSE 0 END) AS claimed
            FROM event2026_participant_slots s
            LEFT JOIN event2026_invite_tokens t ON t.slot_id = s.id
            WHERE s.registration_id = :registration_id
            GROUP BY s.id, s.full_name, s.user_id
            ORDER BY s.id ASC");
        $inviteStmt->execute([':registration_id' => (int) $registration['id']]);
        $inviteStatus = $inviteStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        'status' => 'success',
        'event' => [
            'id' => $eventId,
            'name' => $event['name'],
            'event_date' => $event['event_date'],
            'status' => $event['status'],
        ],
        'registration' => $registration ?: null,
        'payment' => $registration ? [
            'method' => $registration['payment_method'] ?: null,
            'expected_amount' => $registration['expected_amount'] !== null ? (float) $registration['expected_amount'] : null,
            'paid_amount' => $registration['paid_amount'] !== null ? (float) $registration['paid_amount'] : null,
            'status' => $registration['payment_status_detail'] ?: null,
        ] : null,
        'payment_instruction' => $registration
            ? 'Bitte per PayPal Freunde oder Überweisung zahlen und den Referenzcode im Verwendungszweck angeben. Nach Zahlung wird dein Status manuell bestätigt.'
            : null,
        'slots' => $slots,
        'invites' => $inviteStatus,
        'checkpoints' => $checkpoints,
        'progress' => [
            'mandatory_total' => $mandatoryCount,
            'mandatory_passed' => $mandatoryPassed,
            'is_finisher' => $mandatoryCount > 0 && $mandatoryCount === $mandatoryPassed,
        ],
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
