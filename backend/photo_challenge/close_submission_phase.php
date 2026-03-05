<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$challengeId = isset($_POST['challenge_id']) ? (int)$_POST['challenge_id'] : 0;
$force = isset($_POST['force']) ? (int)$_POST['force'] === 1 : false;

if (!$userId || !$challengeId) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID oder Challenge-ID fehlen.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

try {
    ensurePhotoChallengeSchema($pdo);
    $challenge = getChallengeById($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Challenge existiert nicht.');
    }

    $rawStatus = (string)($challenge['status'] ?? 'draft');
    $effectiveStatus = getPhotoChallengeEffectiveStatus($challenge);

    if (in_array($rawStatus, ['group_running', 'ko_running', 'finished'], true)) {
        throw new RuntimeException('Die Einreichphase kann in dieser Challenge-Phase nicht mehr geschlossen werden.');
    }

    if ($rawStatus === 'submission_closed') {
        echo json_encode([
            'status' => 'success',
            'message' => 'Einreichphase ist bereits geschlossen.',
            'challenge' => enrichPhotoChallengeForApi($challenge),
        ]);
        exit;
    }

    if ($rawStatus !== 'submission_open') {
        throw new RuntimeException('Die Einreichphase kann nur aus dem Status "submission_open" geschlossen werden.');
    }

    if ($effectiveStatus !== 'submission_closed' && !$force) {
        throw new RuntimeException('Die Einreichdeadline ist noch nicht erreicht. Optional kann mit force=1 vorzeitig geschlossen werden.');
    }

    $stmt = $pdo->prepare("UPDATE photo_challenges SET status = 'submission_closed' WHERE id = :id");
    $stmt->execute(['id' => $challengeId]);

    $updated = getChallengeById($pdo, $challengeId);

    echo json_encode([
        'status' => 'success',
        'message' => 'Einreichphase wurde geschlossen.',
        'challenge' => $updated ? enrichPhotoChallengeForApi($updated) : null,
    ]);
} catch (RuntimeException $e) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Einreichphase konnte nicht geschlossen werden.',
        'details' => $e->getMessage(),
    ]);
}

