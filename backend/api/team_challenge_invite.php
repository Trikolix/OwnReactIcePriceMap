<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/team_challenges.php';

ensureTeamChallengeSchema($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Nur POST erlaubt.']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
$userId = isset($payload['user_id']) ? (int)$payload['user_id'] : 0;
$inviteeUserId = isset($payload['invitee_user_id']) ? (int)$payload['invitee_user_id'] : 0;
$type = isset($payload['type']) && in_array($payload['type'], ['daily', 'weekly'], true) ? $payload['type'] : 'weekly';
$mode = teamChallengeNormalizeMode($payload['mode'] ?? 'midpoint');
$lat = isset($payload['lat']) ? (float)$payload['lat'] : null;
$lon = isset($payload['lon']) ? (float)$payload['lon'] : null;

if ($userId <= 0 || $inviteeUserId <= 0 || $lat === null || $lon === null) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Fehlende Eingabedaten.']);
    exit;
}

if ($userId === $inviteeUserId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Du kannst dich nicht selbst einladen.']);
    exit;
}

try {
    $inviter = teamChallengeGetUserById($pdo, $userId);
    $invitee = teamChallengeGetUserById($pdo, $inviteeUserId);
    if (!$inviter || !$invitee) {
        throw new RuntimeException('Ein Nutzer wurde nicht gefunden.');
    }

    teamChallengeSyncExpired($pdo);
    teamChallengeRequireNoOtherActive($pdo, $userId);
    teamChallengeRequireNoOtherActive($pdo, $inviteeUserId);

    $validUntil = teamChallengeGetValidUntil($type);
    $proposalDeadline = teamChallengeGetProposalDeadline($validUntil);

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO team_challenges (
            inviter_user_id,
            invitee_user_id,
            type,
            mode,
            status,
            proposal_deadline,
            valid_until,
            completion_window_minutes,
            created_by_user_id
        ) VALUES (
            :inviter_user_id,
            :invitee_user_id,
            :type,
            :mode,
            'pending_acceptance',
            :proposal_deadline,
            :valid_until,
            90,
            :created_by_user_id
        )
    ");
    $stmt->execute([
        'inviter_user_id' => $userId,
        'invitee_user_id' => $inviteeUserId,
        'type' => $type,
        'mode' => $mode,
        'proposal_deadline' => $proposalDeadline,
        'valid_until' => $validUntil,
        'created_by_user_id' => $userId,
    ]);

    $challengeId = (int)$pdo->lastInsertId();
    teamChallengeStoreLocation($pdo, $challengeId, $userId, $lat, $lon);

    $text = "{$inviter['username']} hat dich zu einer Team-Challenge eingeladen.";
    teamChallengeInsertNotification($pdo, $inviteeUserId, $challengeId, $text, 'invite', 'pending_acceptance');
    teamChallengeSendEmail($pdo, $inviteeUserId, $inviter['username'], 'invite', $challengeId);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'team_challenge' => teamChallengeFetchDetail($pdo, $challengeId, $userId),
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
