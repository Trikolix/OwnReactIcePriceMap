<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : 0;
$challengeId = isset($_GET['challenge_id']) ? (int)$_GET['challenge_id'] : 0;

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

    $stmt = $pdo->prepare("SELECT * FROM photo_challenges WHERE id = :id");
    $stmt->execute(['id' => $challengeId]);
    $challenge = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$challenge) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Challenge wurde nicht gefunden.',
        ]);
        exit;
    }

    $images = fetchChallengeImages($pdo, $challengeId);

    echo json_encode([
        'status' => 'success',
        'challenge' => $challenge,
        'data' => $images,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Bilder konnten nicht geladen werden.',
        'details' => $e->getMessage(),
    ]);
}
