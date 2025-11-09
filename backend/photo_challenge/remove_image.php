<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$challengeId = isset($_POST['challenge_id']) ? (int)$_POST['challenge_id'] : 0;
$imageId = isset($_POST['image_id']) ? (int)$_POST['image_id'] : 0;

if (!$userId || !$challengeId || !$imageId) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID, Challenge-ID oder Bild-ID fehlen.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

try {
    ensurePhotoChallengeSchema($pdo);

    $stmt = $pdo->prepare("
        DELETE FROM photo_challenge_images
        WHERE challenge_id = :challenge_id AND image_id = :image_id
    ");
    $stmt->execute([
        'challenge_id' => $challengeId,
        'image_id' => $imageId,
    ]);

    $updatedImages = fetchChallengeImages($pdo, $challengeId);

    echo json_encode([
        'status' => 'success',
        'message' => 'Bild wurde entfernt.',
        'data' => $updatedImages,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Bild konnte nicht entfernt werden.',
        'details' => $e->getMessage(),
    ]);
}
