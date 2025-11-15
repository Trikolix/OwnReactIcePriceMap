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
    $stmt = $pdo->prepare("
        SELECT s.*,
               b.url,
               b.beschreibung,
               n.username
        FROM photo_challenge_submissions s
        JOIN bilder b ON b.id = s.image_id
        LEFT JOIN nutzer n ON n.id = s.nutzer_id
        WHERE s.challenge_id = :challenge_id
        ORDER BY FIELD(s.status, 'pending', 'accepted', 'rejected'), s.created_at DESC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    $submissions = array_map(function ($row) {
        $row['id'] = (int)$row['id'];
        $row['challenge_id'] = (int)$row['challenge_id'];
        $row['image_id'] = (int)$row['image_id'];
        $row['nutzer_id'] = (int)$row['nutzer_id'];
        $row['reviewer_id'] = $row['reviewer_id'] !== null ? (int)$row['reviewer_id'] : null;
        return $row;
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode([
        'status' => 'success',
        'data' => $submissions,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Einreichungen konnten nicht geladen werden.',
        'details' => $e->getMessage(),
    ]);
}

