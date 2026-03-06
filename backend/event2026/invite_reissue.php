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

    if ($slotId <= 0) {
        throw new InvalidArgumentException('slot_id fehlt.');
    }

    $slotStmt = $pdo->prepare("SELECT
            s.id,
            s.user_id,
            s.full_name,
            s.registration_id,
            r.event_id,
            r.registered_by_user_id
        FROM event2026_participant_slots s
        INNER JOIN event2026_registrations r ON r.id = s.registration_id
        WHERE s.id = :slot_id
        LIMIT 1");
    $slotStmt->execute([':slot_id' => $slotId]);
    $slot = $slotStmt->fetch(PDO::FETCH_ASSOC);

    if (!$slot) {
        http_response_code(404);
        throw new RuntimeException('Slot nicht gefunden.');
    }

    $isAdmin = $auth['user_id'] === 1;
    if (!$isAdmin && (int) $slot['registered_by_user_id'] !== $auth['user_id']) {
        http_response_code(403);
        throw new RuntimeException('Keine Berechtigung für diesen Slot.');
    }

    if ((int) ($slot['user_id'] ?? 0) > 0) {
        http_response_code(409);
        throw new RuntimeException('Slot ist bereits geclaimt.');
    }

    $pdo->beginTransaction();

    $revokeStmt = $pdo->prepare("UPDATE event2026_invite_tokens
        SET revoked_at = NOW()
        WHERE slot_id = :slot_id
          AND claimed_at IS NULL
          AND revoked_at IS NULL");
    $revokeStmt->execute([':slot_id' => $slotId]);

    $invite = event2026_create_invite_token($pdo, $slotId);

    event2026_log_action(
        $pdo,
        (int) $slot['event_id'],
        $auth['user_id'],
        'invite_reissue',
        'slot',
        (int) $slot['id'],
        ['expires_at' => $invite['expires_at']]
    );

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'token' => $invite['token'],
        'expires_at' => $invite['expires_at'],
        'slot_id' => (int) $slot['id'],
        'full_name' => (string) $slot['full_name'],
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
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
