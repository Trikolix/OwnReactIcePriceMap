<?php
require_once __DIR__ . '/bootstrap.php';

function event2026_invite_claim_load_token(PDO $pdo, string $rawToken, bool $forUpdate = false): ?array
{
    $sql = "SELECT
            t.id AS token_id,
            t.slot_id,
            t.expires_at,
            t.claimed_at,
            t.revoked_at,
            s.user_id,
            s.full_name,
            s.distance_km,
            s.registration_id,
            r.event_id,
            r.payment_status
        FROM event2026_invite_tokens t
        INNER JOIN event2026_participant_slots s ON s.id = t.slot_id
        INNER JOIN event2026_registrations r ON r.id = s.registration_id
        WHERE t.token_hash = :token_hash
        LIMIT 1";

    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':token_hash' => hash('sha256', $rawToken),
    ]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function event2026_invite_claim_status(array $row): array
{
    $nowTs = time();
    $expiresTs = strtotime((string) $row['expires_at']);
    $expired = $expiresTs !== false && $expiresTs < $nowTs;
    $revoked = !empty($row['revoked_at']);
    $claimed = !empty($row['claimed_at']) || (int) ($row['user_id'] ?? 0) > 0;

    return [
        'claimed' => $claimed,
        'revoked' => $revoked,
        'expired' => $expired,
        'can_claim' => !$claimed && !$revoked && !$expired,
        'expires_at' => $row['expires_at'],
    ];
}

try {
    event2026_ensure_schema($pdo);

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, ['GET', 'POST'], true)) {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $token = trim((string) ($_GET['token'] ?? ''));
    if ($token === '') {
        throw new InvalidArgumentException('token fehlt.');
    }

    if ($method === 'GET') {
        $tokenRow = event2026_invite_claim_load_token($pdo, $token, false);
        if (!$tokenRow) {
            http_response_code(404);
            throw new RuntimeException('Invite-Token nicht gefunden.');
        }

        $status = event2026_invite_claim_status($tokenRow);
        echo json_encode([
            'status' => 'success',
            'token_status' => $status,
            'slot_preview' => [
                'slot_id' => (int) $tokenRow['slot_id'],
                'full_name' => (string) $tokenRow['full_name'],
                'distance_km' => (int) $tokenRow['distance_km'],
                'payment_status' => (string) $tokenRow['payment_status'],
            ],
        ]);
        exit;
    }

    $auth = event2026_require_auth_user($pdo);

    $pdo->beginTransaction();
    $tokenRow = event2026_invite_claim_load_token($pdo, $token, true);
    if (!$tokenRow) {
        $pdo->rollBack();
        http_response_code(404);
        throw new RuntimeException('Invite-Token nicht gefunden.');
    }

    $status = event2026_invite_claim_status($tokenRow);
    if (!$status['can_claim']) {
        $slotUserId = (int) ($tokenRow['user_id'] ?? 0);
        if ($slotUserId === $auth['user_id']) {
            $pdo->commit();
            echo json_encode([
                'status' => 'success',
                'message' => 'Starterplatz ist bereits mit deinem Account verknüpft.',
            ]);
            exit;
        }

        $pdo->rollBack();
        http_response_code(409);
        throw new RuntimeException('Invite-Token kann nicht mehr geclaimt werden.');
    }

    $existingSlotStmt = $pdo->prepare("SELECT id
        FROM event2026_participant_slots
        WHERE event_id = :event_id AND user_id = :user_id
        LIMIT 1");
    $existingSlotStmt->execute([
        ':event_id' => (int) $tokenRow['event_id'],
        ':user_id' => $auth['user_id'],
    ]);
    $existingSlotId = (int) ($existingSlotStmt->fetchColumn() ?: 0);
    if ($existingSlotId > 0 && $existingSlotId !== (int) $tokenRow['slot_id']) {
        $pdo->rollBack();
        http_response_code(409);
        throw new RuntimeException('Dein Account hat bereits einen Starterplatz für dieses Event.');
    }

    $bindSlotStmt = $pdo->prepare("UPDATE event2026_participant_slots
        SET user_id = :user_id
        WHERE id = :slot_id AND (user_id IS NULL OR user_id = 0)");
    $bindSlotStmt->execute([
        ':user_id' => $auth['user_id'],
        ':slot_id' => (int) $tokenRow['slot_id'],
    ]);

    if ($bindSlotStmt->rowCount() < 1) {
        $pdo->rollBack();
        http_response_code(409);
        throw new RuntimeException('Starterplatz ist bereits vergeben.');
    }

    $claimTokenStmt = $pdo->prepare("UPDATE event2026_invite_tokens
        SET claimed_at = NOW()
        WHERE id = :token_id AND claimed_at IS NULL AND revoked_at IS NULL");
    $claimTokenStmt->execute([
        ':token_id' => (int) $tokenRow['token_id'],
    ]);

    $revokeOthersStmt = $pdo->prepare("UPDATE event2026_invite_tokens
        SET revoked_at = NOW()
        WHERE slot_id = :slot_id
          AND id <> :token_id
          AND claimed_at IS NULL
          AND revoked_at IS NULL");
    $revokeOthersStmt->execute([
        ':slot_id' => (int) $tokenRow['slot_id'],
        ':token_id' => (int) $tokenRow['token_id'],
    ]);

    event2026_log_action(
        $pdo,
        (int) $tokenRow['event_id'],
        $auth['user_id'],
        'invite_claim',
        'slot',
        (int) $tokenRow['slot_id'],
        ['token_id' => (int) $tokenRow['token_id']]
    );

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Starterplatz erfolgreich geclaimt.',
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
