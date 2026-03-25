<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/team_challenges.php';

ensureTeamChallengeSchema($pdo);
teamChallengeSyncExpired($pdo);

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Nutzer-ID.']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT
        tc.*,
        inviter.username AS inviter_username,
        invitee.username AS invitee_username,
        shop.name AS final_shop_name,
        shop.adresse AS final_shop_address,
        shop.latitude AS final_shop_lat,
        shop.longitude AS final_shop_lon
    FROM team_challenges tc
    JOIN nutzer inviter ON inviter.id = tc.inviter_user_id
    JOIN nutzer invitee ON invitee.id = tc.invitee_user_id
    LEFT JOIN eisdielen shop ON shop.id = tc.final_shop_id
    WHERE tc.inviter_user_id = :user_id OR tc.invitee_user_id = :user_id
    ORDER BY
        CASE WHEN tc.status IN ('pending_acceptance', 'accepted', 'proposal_open', 'proposal_submitted', 'shop_finalized') THEN 0 ELSE 1 END,
        tc.created_at DESC
");
$stmt->execute(['user_id' => $userId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$active = null;
$activeChallenges = [];
$sent = [];
$received = [];
$history = [];

foreach ($rows as $row) {
    $summary = teamChallengeBuildSummary($row, $userId);
    $isActive = in_array($row['status'], teamChallengeActiveStatuses(), true);

    if ($isActive) {
        $activeChallenges[] = $summary;
        if ($active === null) {
            $active = $summary;
        }
    }

    if ($row['status'] === 'pending_acceptance' && (int)$row['invitee_user_id'] === $userId) {
        if (!$isActive) {
            $received[] = $summary;
        }
        continue;
    }

    if ($row['status'] === 'pending_acceptance' && (int)$row['inviter_user_id'] === $userId) {
        if (!$isActive) {
            $sent[] = $summary;
        }
        continue;
    }

    if (!$isActive) {
        $history[] = $summary;
    }
}

echo json_encode([
    'status' => 'success',
    'active' => $active,
    'active_challenges' => $activeChallenges,
    'received_invitations' => $received,
    'sent_invitations' => $sent,
    'history' => $history,
]);
