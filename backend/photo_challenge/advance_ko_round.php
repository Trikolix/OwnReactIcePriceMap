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
        SELECT * FROM photo_challenge_matches
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

    $winners = [];
    foreach ($matches as $match) {
        if ($match['status'] !== 'open') {
            throw new RuntimeException('Mindestens ein Match dieser Runde ist bereits geschlossen.');
        }
        $summary = summarizeMatchVotes($match, $voteSummary);
        $winner = $summary['winner'];
        if ($winner === null) {
            $winner = min((int)$match['image_a_id'], (int)$match['image_b_id']);
        }
        $updateMatch->execute([
            'winner' => $winner,
            'id' => $match['id'],
        ]);
        $winners[] = [
            'image_id' => $winner,
            'position' => (int)$match['position'],
        ];
    }

    usort($winners, fn($a, $b) => $a['position'] <=> $b['position']);
    $winnerIds = array_column($winners, 'image_id');
    $nextRound = $round + 1;

    if (count($winnerIds) < 2) {
        $stmt = $pdo->prepare("UPDATE photo_challenges SET status = 'finished' WHERE id = :id");
        $stmt->execute(['id' => $challengeId]);
        $pdo->commit();
        echo json_encode([
            'status' => 'success',
            'message' => 'Finale abgeschlossen – Challenge ist beendet.',
            'next_round_created' => false,
            'round_closed' => $round,
        ]);
        return;
    }

    if (count($winnerIds) % 2 !== 0) {
        throw new RuntimeException('Ungültige Anzahl an Gewinnern – KO-Raster nicht fortsetzbar.');
    }

    $insertMatch = $pdo->prepare("
        INSERT INTO photo_challenge_matches
            (challenge_id, phase, round, group_id, position, image_a_id, image_b_id, status)
        VALUES
            (:challenge_id, 'ko', :round, NULL, :position, :image_a, :image_b, 'open')
    ");
    $position = 1;
    for ($i = 0; $i < count($winnerIds); $i += 2) {
        $insertMatch->execute([
            'challenge_id' => $challengeId,
            'round' => $nextRound,
            'position' => $position++,
            'image_a' => $winnerIds[$i],
            'image_b' => $winnerIds[$i + 1],
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'KO-Runde abgeschlossen und nächste Runde angelegt.',
        'next_round_created' => true,
        'round_closed' => $round,
        'next_round' => $nextRound,
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

