<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/team_challenges.php';

ensureTeamChallengeSchema($pdo);
ensurePushInfrastructureSchema($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Nur POST erlaubt.']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
$userId = isset($payload['user_id']) ? (int)$payload['user_id'] : 0;
$challengeId = isset($payload['team_challenge_id']) ? (int)$payload['team_challenge_id'] : 0;
$shopIds = $payload['shop_ids'] ?? [];

if ($userId <= 0 || $challengeId <= 0 || !is_array($shopIds)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Fehlende Eingabedaten.']);
    exit;
}

$shopIds = array_values(array_unique(array_filter(array_map('intval', $shopIds), static fn($id) => $id > 0)));
if (count($shopIds) < 1 || count($shopIds) > 3) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Bitte wähle 1 bis 3 Vorschläge aus.']);
    exit;
}

try {
    $pdo->beginTransaction();
    $challenge = teamChallengeGetBaseRow($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Team-Challenge nicht gefunden.');
    }
    if ((int)$challenge['invitee_user_id'] !== $userId) {
        throw new RuntimeException('Nur der eingeladene Nutzer kann Vorschläge senden.');
    }
    if (!in_array($challenge['status'], ['proposal_open', 'proposal_submitted'], true)) {
        throw new RuntimeException('Für diese Team-Challenge sind aktuell keine Vorschläge möglich.');
    }

    $candidateRows = teamChallengeFetchCandidates($pdo, $challengeId);
    $candidateIds = array_map(static fn(array $row): int => (int)$row['shop_id'], $candidateRows);
    foreach ($shopIds as $shopId) {
        if (!in_array($shopId, $candidateIds, true)) {
            throw new RuntimeException('Mindestens ein Vorschlag liegt außerhalb der Kandidatenliste.');
        }
    }

    $pdo->prepare("DELETE FROM team_challenge_proposals WHERE team_challenge_id = :challenge_id")
        ->execute(['challenge_id' => $challengeId]);

    $insert = $pdo->prepare("
        INSERT INTO team_challenge_proposals (team_challenge_id, shop_id, proposed_by_user_id, created_at)
        VALUES (:challenge_id, :shop_id, :user_id, NOW())
    ");
    foreach ($shopIds as $shopId) {
        $insert->execute([
            'challenge_id' => $challengeId,
            'shop_id' => $shopId,
            'user_id' => $userId,
        ]);
    }

    $pdo->prepare("UPDATE team_challenges SET status = 'proposal_submitted' WHERE id = :id")
        ->execute(['id' => $challengeId]);

    teamChallengeInsertNotification($pdo, (int)$challenge['inviter_user_id'], $challengeId, "{$challenge['invitee_username']} hat Eisdielen für eure Team-Challenge vorgeschlagen.", 'proposal_submitted', 'proposal_submitted');
    
    $pdo->commit();

    $detail = teamChallengeFetchDetail($pdo, $challengeId, $userId);

    echo json_encode([
        'status' => 'success',
        'team_challenge' => $detail,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        try {
            $pdo->rollBack();
        } catch (PDOException $rollbackEx) {
            if (stripos($rollbackEx->getMessage(), 'active transaction') === false) {
                throw $rollbackEx;
            }
        }
    }
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

