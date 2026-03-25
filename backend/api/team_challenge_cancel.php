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
$challengeId = isset($payload['team_challenge_id']) ? (int)$payload['team_challenge_id'] : 0;

if ($userId <= 0 || $challengeId <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Fehlende Eingabedaten.']);
    exit;
}

try {
    $pdo->beginTransaction();
    $challenge = teamChallengeGetBaseRow($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Team-Challenge nicht gefunden.');
    }
    teamChallengeEnsureParticipant($challenge, $userId);
    if (!in_array($challenge['status'], teamChallengeActiveStatuses(), true)) {
        throw new RuntimeException('Diese Team-Challenge kann nicht mehr abgebrochen werden.');
    }

    $failedReason = (int)$challenge['inviter_user_id'] === $userId ? 'cancelled_by_inviter' : 'cancelled_by_invitee';
    $otherUserId = (int)$challenge['inviter_user_id'] === $userId ? (int)$challenge['invitee_user_id'] : (int)$challenge['inviter_user_id'];
    $actorName = (int)$challenge['inviter_user_id'] === $userId ? $challenge['inviter_username'] : $challenge['invitee_username'];

    $stmt = $pdo->prepare("
        UPDATE team_challenges
        SET status = 'cancelled', failed_reason = :failed_reason
        WHERE id = :id
    ");
    $stmt->execute([
        'failed_reason' => $failedReason,
        'id' => $challengeId,
    ]);

    teamChallengeInsertNotification($pdo, $otherUserId, $challengeId, "{$actorName} hat die Team-Challenge abgebrochen.", 'cancelled', 'cancelled');
    $pdo->commit();

    echo json_encode(['status' => 'success']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
