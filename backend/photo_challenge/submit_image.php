<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';


$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$challengeId = isset($_POST['challenge_id']) ? (int)$_POST['challenge_id'] : 0;
$imageId = isset($_POST['image_id']) ? (int)$_POST['image_id'] : 0;
$title = isset($_POST['title']) ? trim($_POST['title']) : null;

if (!$userId || !$challengeId || !$imageId) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-, Challenge- oder Bild-ID fehlen.',
    ]);
    exit;
}

try {
    ensurePhotoChallengeSchema($pdo);
    $challenge = getChallengeById($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Challenge existiert nicht.');
    }
    if ($challenge['status'] !== 'submission_open') {
        throw new RuntimeException('Diese Challenge befindet sich nicht in der Einreichungsphase.');
    }
    if (!empty($challenge['submission_deadline']) && time() > strtotime($challenge['submission_deadline'])) {
        throw new RuntimeException('Die Einreichungsphase ist bereits beendet.');
    }

    $stmt = $pdo->prepare("SELECT id FROM bilder WHERE id = :image_id AND nutzer_id = :nutzer_id");
    $stmt->execute([
        'image_id' => $imageId,
        'nutzer_id' => $userId,
    ]);
    if (!$stmt->fetch()) {
        throw new RuntimeException('Dieses Bild gehört nicht dir.');
    }

    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM photo_challenge_submissions
        WHERE challenge_id = :challenge_id AND nutzer_id = :nutzer_id
    ");
    $stmt->execute([
        'challenge_id' => $challengeId,
        'nutzer_id' => $userId,
    ]);
    $submissionCount = (int)$stmt->fetchColumn();
    if (!empty($challenge['submission_limit_per_user']) && $submissionCount >= (int)$challenge['submission_limit_per_user']) {
        throw new RuntimeException('Du hast bereits das Limit deiner Einreichungen erreicht.');
    }

    $stmt = $pdo->prepare("
        INSERT INTO photo_challenge_submissions (challenge_id, image_id, nutzer_id, title)
        VALUES (:challenge_id, :image_id, :nutzer_id, :title)
    ");
    $stmt->execute([
        'challenge_id' => $challengeId,
        'image_id' => $imageId,
        'nutzer_id' => $userId,
        'title' => $title,
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Bild wurde eingereicht.',
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
        'message' => 'Einreichung konnte nicht gespeichert werden.',
        'details' => $e->getMessage(),
    ]);
}

