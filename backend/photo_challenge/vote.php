<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../evaluators/PhotoChallengeVoteCountEvaluator.php';

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
        SELECT m.*,
               c.status AS challenge_status,
               g.start_at AS group_start_at,
               g.end_at AS group_end_at
        FROM photo_challenge_matches m
        JOIN photo_challenges c ON c.id = m.challenge_id
        LEFT JOIN photo_challenge_groups g ON g.id = m.group_id
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
    if ($match['phase'] === 'group' && $match['challenge_status'] !== 'group_running') {
        throw new RuntimeException('Voting ist für diese Gruppenphase derzeit nicht geöffnet.');
    }
    if ($match['phase'] === 'ko' && $match['challenge_status'] !== 'ko_running') {
        throw new RuntimeException('Voting ist für diese KO-Phase derzeit nicht geöffnet.');
    }
    if ($match['phase'] === 'group') {
        $now = time();
        if (!empty($match['group_start_at']) && $now < strtotime((string)$match['group_start_at'])) {
            throw new RuntimeException('Diese Gruppe ist noch nicht freigeschaltet.');
        }
        if (!empty($match['group_end_at']) && $now > strtotime((string)$match['group_end_at'])) {
            throw new RuntimeException('Das Voting für diese Gruppe ist bereits beendet.');
        }
    }
    $imageA = (int)$match['image_a_id'];
    $imageB = (int)$match['image_b_id'];
    if ($imageId !== $imageA && $imageId !== $imageB) {
        throw new RuntimeException('Ungültiges Bild für dieses Match.');
    }

    $stmt = $pdo->prepare("
        SELECT image_id
        FROM photo_challenge_votes
        WHERE match_id = :match_id AND nutzer_id = :nutzer_id
        LIMIT 1
    ");
    $stmt->execute([
        'match_id' => $matchId,
        'nutzer_id' => $userId,
    ]);
    $existingVote = $stmt->fetchColumn();
    $voteAction = 'created';

    if ($existingVote !== false) {
        if ((int)$existingVote === $imageId) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Diese Stimme ist bereits aktiv.',
                'vote_action' => 'unchanged',
                'new_awards' => [],
                'match' => [
                    'id' => $matchId,
                    'image_a_id' => $imageA,
                    'image_b_id' => $imageB,
                    'user_choice' => $imageId,
                ],
            ]);
            exit;
        }

        $stmt = $pdo->prepare("
            UPDATE photo_challenge_votes
            SET image_id = :image_id
            WHERE match_id = :match_id AND nutzer_id = :nutzer_id
        ");
        $stmt->execute([
            'match_id' => $matchId,
            'nutzer_id' => $userId,
            'image_id' => $imageId,
        ]);
        $voteAction = 'updated';
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO photo_challenge_votes (match_id, nutzer_id, image_id)
            VALUES (:match_id, :nutzer_id, :image_id)
        ");
        $stmt->execute([
            'match_id' => $matchId,
            'nutzer_id' => $userId,
            'image_id' => $imageId,
        ]);
    }

    $votes = getMatchVoteSummary($pdo, [$matchId]);
    $summary = summarizeMatchVotes($match, $votes);
    $newAwards = (new PhotoChallengeVoteCountEvaluator())->evaluate($userId);

    echo json_encode([
        'status' => 'success',
        'message' => $voteAction === 'updated' ? 'Stimme wurde geändert.' : 'Stimme wurde gezählt.',
        'vote_action' => $voteAction,
        'new_awards' => $newAwards,
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
