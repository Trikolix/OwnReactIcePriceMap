<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$challengeId = isset($_POST['challenge_id']) ? (int)$_POST['challenge_id'] : 0;

if (!$userId || !$challengeId) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID oder Challenge-ID fehlen.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

$imageIds = $_POST['image_ids'] ?? $_POST['image_id'] ?? [];
if (!is_array($imageIds)) {
    $imageIds = explode(',', (string)$imageIds);
}
$imageIds = array_values(array_unique(array_filter(array_map('intval', $imageIds))));

if (empty($imageIds)) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Keine gültigen Bilder ausgewählt.',
    ]);
    exit;
}

try {
    ensurePhotoChallengeSchema($pdo);

    $stmt = $pdo->prepare("SELECT id, status FROM photo_challenges WHERE id = :id");
    $stmt->execute(['id' => $challengeId]);
    $challenge = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$challenge) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Challenge existiert nicht.',
        ]);
        exit;
    }
    if (in_array($challenge['status'], ['group_running', 'ko_running', 'finished'], true)) {
        http_response_code(422);
        echo json_encode([
            'status' => 'error',
            'message' => 'Bilder können nach Start der Gruppenphase nicht mehr manuell geändert werden.',
        ]);
        exit;
    }

    $pdo->beginTransaction();
    $insertStmt = $pdo->prepare("
        INSERT IGNORE INTO photo_challenge_images (challenge_id, image_id, assigned_by)
        VALUES (:challenge_id, :image_id, :assigned_by)
    ");

    foreach ($imageIds as $imageId) {
        if ($imageId <= 0) {
            continue;
        }
        $insertStmt->execute([
            'challenge_id' => $challengeId,
            'image_id' => $imageId,
            'assigned_by' => $userId,
        ]);
    }

    $pdo->commit();

    $updatedImages = fetchChallengeImages($pdo, $challengeId);

    echo json_encode([
        'status' => 'success',
        'message' => 'Bilder wurden hinzugefügt.',
        'data' => array_map(function($img) {
            return array_merge(
                ['image_id' => $img['image_id'], 'title' => isset($img['title']) ? $img['title'] : null],
                $img
            );
        }, $updatedImages),
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Bilder konnten nicht hinzugefügt werden.',
        'details' => $e->getMessage(),
    ]);
}
