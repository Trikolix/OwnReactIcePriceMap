<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/team_challenges.php';

ensureTeamChallengeSchema($pdo);

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$challengeId = isset($_GET['team_challenge_id']) ? (int)$_GET['team_challenge_id'] : 0;

if ($userId <= 0 || $challengeId <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Fehlende Parameter.']);
    exit;
}

try {
    $detail = teamChallengeFetchDetail($pdo, $challengeId, $userId);
    echo json_encode([
        'status' => 'success',
        'team_challenge' => $detail,
    ]);
} catch (RuntimeException $e) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

