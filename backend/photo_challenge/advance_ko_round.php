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

try {
    ensurePhotoChallengeSchema($pdo);
    $challenge = getChallengeById($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Challenge existiert nicht.');
    }
    if ($challenge['status'] !== 'ko_running') {
        throw new RuntimeException('Die KO-Runde ist derzeit nicht aktiv.');
    }

    $stmt = $pdo->prepare("
        SELECT round
        FROM photo_challenge_matches
        WHERE challenge_id = :challenge_id AND phase = 'ko' AND status = 'open'
        ORDER BY round ASC
        LIMIT 1
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    $roundRow = $stmt->fetchColumn();
    if ($roundRow === false) {
        throw new RuntimeException('Keine offene KO-Runde vorhanden.');
    }
    $round = (int)$roundRow;

    $stmt = $pdo->prepare("
        SELECT *
        FROM photo_challenge_matches
        WHERE challenge_id = :challenge_id AND phase = 'ko' AND round = :round
        ORDER BY position ASC
    ");
    $stmt->execute([
        'challenge_id' => $challengeId,
        'round' => $round,
    ]);
    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!$matches) {
        throw new RuntimeException('Für diese Runde liegen keine Matches vor.');
    }

    $matchIds = array_map(fn($match) => (int)$match['id'], $matches);
    $voteSummary = getMatchVoteSummary($pdo, $matchIds);

    $pdo->beginTransaction();

    $updateMatch = $pdo->prepare("
        UPDATE photo_challenge_matches
        SET status = 'closed', winner_image_id = :winner, locked_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");

    $roundWinnerIds = [];
    $mainWinnerIds = [];
    $mainMatches = array_values(array_filter($matches, static fn(array $match): bool => ($match['bracket_type'] ?? 'main') === 'main'));
    $thirdPlaceMatches = array_values(array_filter($matches, static fn(array $match): bool => ($match['bracket_type'] ?? 'main') === 'third_place'));
    $mainLoserIds = [];

    foreach ($matches as $match) {
        if ($match['status'] !== 'open') {
            throw new RuntimeException('Mindestens ein Match dieser Runde ist bereits geschlossen.');
        }

        $summary = summarizeMatchVotes($match, $voteSummary);
        $winner = $summary['winner'];
        if ($winner === null) {
            $winner = min((int)$match['image_a_id'], (int)$match['image_b_id']);
        }
        $roundWinnerIds[] = $winner;

        if (($match['bracket_type'] ?? 'main') === 'main') {
            $mainWinnerIds[] = $winner;
            $mainLoserIds[] = $winner === (int)$match['image_a_id']
                ? (int)$match['image_b_id']
                : (int)$match['image_a_id'];
        }

        $updateMatch->execute([
            'winner' => $winner,
            'id' => $match['id'],
        ]);
    }

    // A two-match main round is the semifinal. Preserve both semifinal losers
    // for a separate third-place match alongside the final.
    if (!$thirdPlaceMatches && count($mainMatches) === 2) {
        $mainWinners = array_values(array_filter(array_map('intval', $mainWinnerIds)));
        if (count($mainWinners) === 2 && count($mainLoserIds) === 2) {
            $nextRound = $round + 1;
            $insertMatch = $pdo->prepare("
                INSERT INTO photo_challenge_matches
                    (challenge_id, phase, bracket_type, round, group_id, position, image_a_id, image_b_id, status)
                VALUES
                    (:challenge_id, 'ko', :bracket_type, :round, NULL, :position, :image_a, :image_b, 'open')
            ");
            $insertMatch->execute([
                'challenge_id' => $challengeId,
                'bracket_type' => 'main',
                'round' => $nextRound,
                'position' => 1,
                'image_a' => $mainWinners[0],
                'image_b' => $mainWinners[1],
            ]);
            $insertMatch->execute([
                'challenge_id' => $challengeId,
                'bracket_type' => 'third_place',
                'round' => $nextRound,
                'position' => 1,
                'image_a' => $mainLoserIds[0],
                'image_b' => $mainLoserIds[1],
            ]);

            $pdo->commit();
            echo json_encode([
                'status' => 'success',
                'message' => 'Halbfinale abgeschlossen. Finale und Duell um Platz 3 wurden angelegt.',
                'next_round_created' => true,
                'round_closed' => $round,
                'next_round' => $nextRound,
                'third_place_created' => true,
            ]);
            return;
        }
    }

    // The final and the third-place match are closed together. The main
    // bracket winner decides the champion; the third-place winner is exposed
    // by the overview endpoint.
    if (count($mainMatches) === 1) {
        $stmt = $pdo->prepare("UPDATE photo_challenges SET status = 'finished' WHERE id = :id");
        $stmt->execute(['id' => $challengeId]);
        $pdo->commit();
        $mainWinner = null;
        $mainWinner = (int)($mainWinnerIds[0] ?? 0) ?: null;
        echo json_encode([
            'status' => 'success',
            'message' => $thirdPlaceMatches ? 'Finale und Duell um Platz 3 abgeschlossen – Challenge ist beendet.' : 'Finale abgeschlossen – Challenge ist beendet.',
            'next_round_created' => false,
            'round_closed' => $round,
            'winner_image_id' => $mainWinner,
        ]);
        return;
    }

    $advancement = buildKoRoundAdvancers($matches, $voteSummary);
    $nextRoundParticipants = $advancement['participants'];
    $luckyLoser = $advancement['lucky_loser'];
    $nextRound = $round + 1;

    $insertMatch = $pdo->prepare("
        INSERT INTO photo_challenge_matches
            (challenge_id, phase, bracket_type, round, group_id, position, image_a_id, image_b_id, status)
        VALUES
            (:challenge_id, 'ko', 'main', :round, NULL, :position, :image_a, :image_b, 'open')
    ");
    $position = 1;
    for ($i = 0; $i < count($nextRoundParticipants); $i += 2) {
        $insertMatch->execute([
            'challenge_id' => $challengeId,
            'round' => $nextRound,
            'position' => $position++,
            'image_a' => $nextRoundParticipants[$i]['image_id'],
            'image_b' => $nextRoundParticipants[$i + 1]['image_id'],
        ]);
    }

    $pdo->commit();

    $message = 'KO-Runde abgeschlossen und nächste Runde angelegt.';
    if ($luckyLoser) {
        $message = sprintf(
            'KO-Runde abgeschlossen. Bild #%d zieht als Lucky Loser in Runde %d ein.',
            (int)$luckyLoser['image_id'],
            $nextRound
        );
    }

    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'next_round_created' => true,
        'round_closed' => $round,
        'next_round' => $nextRound,
        'lucky_loser' => $luckyLoser ? [
            'image_id' => (int)$luckyLoser['image_id'],
            'votes' => (int)$luckyLoser['votes'],
            'opponent_votes' => (int)$luckyLoser['opponent_votes'],
            'source_position' => (int)$luckyLoser['position'],
        ] : null,
    ]);
} catch (RuntimeException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'KO-Runde konnte nicht fortgesetzt werden.',
        'details' => $e->getMessage(),
    ]);
}
