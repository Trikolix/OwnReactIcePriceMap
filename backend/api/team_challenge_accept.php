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
$lat = isset($payload['lat']) ? (float)$payload['lat'] : null;
$lon = isset($payload['lon']) ? (float)$payload['lon'] : null;

if ($userId <= 0 || $challengeId <= 0 || $lat === null || $lon === null) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Fehlende Eingabedaten.']);
    exit;
}

try {
    teamChallengeSyncExpired($pdo);
    $pdo->beginTransaction();

    $challenge = teamChallengeGetBaseRow($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Team-Challenge nicht gefunden.');
    }
    if ((int)$challenge['invitee_user_id'] !== $userId) {
        throw new RuntimeException('Nur der eingeladene Nutzer kann annehmen.');
    }
    if ($challenge['status'] !== 'pending_acceptance') {
        throw new RuntimeException('Diese Einladung kann nicht mehr angenommen werden.');
    }

    teamChallengeRequireNoOtherActive($pdo, $userId, $challengeId);

    teamChallengeStoreLocation($pdo, $challengeId, $userId, $lat, $lon);
    $locations = teamChallengeFetchLocationsByUsers($pdo, $challengeId);
    if (empty($locations[(int)$challenge['inviter_user_id']])) {
        throw new RuntimeException('Standort des einladenden Nutzers fehlt.');
    }

    $calculated = teamChallengeCalculateCandidateShops(
        $pdo,
        (float)$locations[(int)$challenge['inviter_user_id']]['lat'],
        (float)$locations[(int)$challenge['inviter_user_id']]['lon'],
        $lat,
        $lon
    );

    if (count($calculated['shops']) < 4) {
        $update = $pdo->prepare("
            UPDATE team_challenges
            SET accepted_at = NOW(),
                center_lat = :center_lat,
                center_lon = :center_lon,
                radius_m = :radius_m,
                status = 'failed_no_shops',
                failed_reason = 'not_enough_shops'
            WHERE id = :id
        ");
        $update->execute([
            'center_lat' => $calculated['center_lat'],
            'center_lon' => $calculated['center_lon'],
            'radius_m' => $calculated['radius_m'],
            'id' => $challengeId,
        ]);

        teamChallengeInsertNotification($pdo, (int)$challenge['inviter_user_id'], $challengeId, 'Für diese Team-Challenge wurden im gemeinsamen Umkreis nicht genug Eisdielen gefunden.', 'failed_no_shops', 'failed_no_shops');
        teamChallengeInsertNotification($pdo, $userId, $challengeId, 'Für diese Team-Challenge wurden im gemeinsamen Umkreis nicht genug Eisdielen gefunden.', 'failed_no_shops', 'failed_no_shops');
        $pdo->commit();

        echo json_encode([
            'status' => 'success',
            'team_challenge' => teamChallengeFetchDetail($pdo, $challengeId, $userId),
        ]);
        exit;
    }

    teamChallengeReplaceCandidates($pdo, $challengeId, $calculated['shops']);

    $update = $pdo->prepare("
        UPDATE team_challenges
        SET accepted_at = NOW(),
            center_lat = :center_lat,
            center_lon = :center_lon,
            radius_m = :radius_m,
            status = 'proposal_open'
        WHERE id = :id
    ");
    $update->execute([
        'center_lat' => $calculated['center_lat'],
        'center_lon' => $calculated['center_lon'],
        'radius_m' => $calculated['radius_m'],
        'id' => $challengeId,
    ]);

    teamChallengeInsertNotification($pdo, (int)$challenge['inviter_user_id'], $challengeId, "{$challenge['invitee_username']} hat deine Team-Challenge angenommen.", 'accepted', 'proposal_open');
    teamChallengeSendEmail($pdo, (int)$challenge['inviter_user_id'], $challenge['invitee_username'], 'accepted', $challengeId);
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
