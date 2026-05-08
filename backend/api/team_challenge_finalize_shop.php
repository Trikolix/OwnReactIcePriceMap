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
$shopId = isset($payload['shop_id']) ? (int)$payload['shop_id'] : 0;

if ($userId <= 0 || $challengeId <= 0 || $shopId <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Fehlende Eingabedaten.']);
    exit;
}

try {
    $pdo->beginTransaction();

    try {
        $challenge = teamChallengeGetBaseRow($pdo, $challengeId);
        if (!$challenge) {
            throw new RuntimeException('Team-Challenge nicht gefunden.');
        }
        
        // In the simplified workflow, ONLY the invitee can finalize the shop (by picking it)
        if ((int)$challenge['invitee_user_id'] !== $userId) {
            throw new RuntimeException('Nur der eingeladene Nutzer kann die Eisdiele wählen.');
        }
        if ($challenge['status'] !== 'proposal_open') {
            throw new RuntimeException('Die Eisdiele kann aktuell nicht gewählt werden.');
        }

        // Verify it is a candidate shop
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM team_challenge_candidates
            WHERE team_challenge_id = :challenge_id AND shop_id = :shop_id
        ");
        $stmt->execute([
            'challenge_id' => $challengeId,
            'shop_id' => $shopId,
        ]);
        if ((int)$stmt->fetchColumn() < 1) {
            throw new RuntimeException('Die gewählte Eisdiele ist kein gültiges Ziel.');
        }

        $stmt = $pdo->prepare("
            UPDATE team_challenges
            SET final_shop_id = :shop_id,
                finalized_at = NOW(),
                status = 'shop_finalized'
            WHERE id = :id
        ");
        $stmt->execute([
            'shop_id' => $shopId,
            'id' => $challengeId,
        ]);

        $shopStmt = $pdo->prepare("SELECT name FROM eisdielen WHERE id = :id LIMIT 1");
        $shopStmt->execute(['id' => $shopId]);
        $shopName = (string)$shopStmt->fetchColumn();

        teamChallengeInsertNotification($pdo, (int)$challenge['inviter_user_id'], $challengeId, "{$challenge['invitee_username']} hat eure Team-Challenge angenommen und {$shopName} als Ziel gewählt!", 'shop_finalized', 'shop_finalized');
        teamChallengeSendEmail($pdo, (int)$challenge['inviter_user_id'], $challenge['invitee_username'], 'shop_finalized', $challengeId, ['shopName' => $shopName]);
        
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    $detail = teamChallengeFetchDetail($pdo, $challengeId, $userId);

    echo json_encode([
        'status' => 'success',
        'team_challenge' => $detail,
    ]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

