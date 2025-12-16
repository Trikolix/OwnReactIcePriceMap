<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$matchId = isset($_POST['match_id']) ? (int)$_POST['match_id'] : 0;
$imageId = isset($_POST['image_id']) ? (int)$_POST['image_id'] : 0;

if (!$userId || !$matchId || !$imageId) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID, Match-ID oder Bild-ID fehlen.',
    ]);
    exit;
}

try {
    ensurePhotoChallengeSchema($pdo);

    $stmt = $pdo->prepare("
        SELECT m.*, c.status AS challenge_status
        FROM photo_challenge_matches m
        JOIN photo_challenges c ON c.id = m.challenge_id
        WHERE m.id = :id
    ");
    $stmt->execute(['id' => $matchId]);
    $match = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$match) {
        throw new RuntimeException('Match wurde nicht gefunden.');
    }
    if ($match['status'] !== 'open') {
        throw new RuntimeException('Dieses Match ist bereits geschlossen.');
    }
    $imageA = (int)$match['image_a_id'];
    $imageB = (int)$match['image_b_id'];
    if ($imageId !== $imageA && $imageId !== $imageB) {
        throw new RuntimeException('Ungültiges Bild für dieses Match.');
    }

    $stmt = $pdo->prepare("
        INSERT INTO photo_challenge_votes (match_id, nutzer_id, image_id)
        VALUES (:match_id, :nutzer_id, :image_id)
        ON DUPLICATE KEY UPDATE image_id = VALUES(image_id), created_at = CURRENT_TIMESTAMP
    ");
    $stmt->execute([
        'match_id' => $matchId,
        'nutzer_id' => $userId,
        'image_id' => $imageId,
    ]);

    $votes = getMatchVoteSummary($pdo, [$matchId]);
    $summary = summarizeMatchVotes($match, $votes);

    echo json_encode([
        'status' => 'success',
        'message' => 'Stimme wurde gezählt.',
        'match' => [
            'id' => $matchId,
            'votes_a' => $summary['votes_a'],
            'votes_b' => $summary['votes_b'],
            'image_a_id' => $imageA,
            'image_b_id' => $imageB,
            'user_choice' => $imageId,
        ],
    ]);
} catch (RuntimeException $e) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Stimme konnte nicht gespeichert werden.',
        'details' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unbekannter Fehler beim Abstimmen.',
        'details' => $e->getMessage(),
    ]);
}
