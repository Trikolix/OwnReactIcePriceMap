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

    $groups = fetchGroupStandings($pdo, $challengeId);
    if (!$groups) {
        throw new RuntimeException('Es liegen noch keine Gruppenergebnisse vor.');
    }

    $firstSeeds = [];
    $secondSeeds = [];
    $thirdCandidates = [];

    foreach ($groups as $group) {
        if (count($group['entries']) < 2) {
            throw new RuntimeException('Jede Gruppe benötigt mindestens zwei Einträge.');
        }
        $first = $group['entries'][0];
        $second = $group['entries'][1];
        $firstSeeds[] = [
            'image_id' => $first['image_id'],
            'label' => $group['group_name'] . ' – Platz 1',
        ];
        $secondSeeds[] = [
            'image_id' => $second['image_id'],
            'label' => $group['group_name'] . ' – Platz 2',
        ];
        if (isset($group['entries'][2])) {
            $thirdCandidates[] = [
                'image_id' => $group['entries'][2]['image_id'],
                'wins' => $group['entries'][2]['wins'],
                'votes_for' => $group['entries'][2]['votes_for'],
                'label' => $group['group_name'] . ' – Platz 3',
            ];
        }
    }

    if (count($thirdCandidates) < 2) {
        throw new RuntimeException('Es werden mindestens zwei Drittplatzierte benötigt.');
    }

    usort($thirdCandidates, function ($a, $b) {
        if ($a['wins'] !== $b['wins']) {
            return $b['wins'] <=> $a['wins'];
        }
        if ($a['votes_for'] !== $b['votes_for']) {
            return $b['votes_for'] <=> $a['votes_for'];
        }
        return $a['image_id'] <=> $b['image_id'];
    });
    $luckyLosers = array_slice($thirdCandidates, 0, 2);

    $secondSeedsRotated = rotateArray($secondSeeds, 1);
    $otherSeeds = array_merge($secondSeedsRotated, $luckyLosers);

    if (count($otherSeeds) < count($firstSeeds)) {
        throw new RuntimeException('Nicht genügend Gegner für die Gruppensieger.');
    }

    $pairings = [];
    $position = 1;
    for ($i = 0; $i < count($firstSeeds); $i++) {
        $pairings[] = [
            'image_a_id' => $firstSeeds[$i]['image_id'],
            'image_b_id' => $otherSeeds[$i]['image_id'],
            'label_a' => $firstSeeds[$i]['label'],
            'label_b' => $otherSeeds[$i]['label'],
            'position' => $position++,
        ];
    }

    $remaining = array_slice($otherSeeds, count($firstSeeds));
    if (count($remaining) === 2) {
        $pairings[] = [
            'image_a_id' => $remaining[0]['image_id'],
            'image_b_id' => $remaining[1]['image_id'],
            'label_a' => $remaining[0]['label'],
            'label_b' => $remaining[1]['label'],
            'position' => $position++,
        ];
    } elseif (count($remaining) !== 0) {
        throw new RuntimeException('Ungültige Teilnehmerzahl für das KO-Raster.');
    }

    if (count($pairings) % 2 !== 0) {
        throw new RuntimeException('Die KO-Runde benötigt eine gerade Anzahl an Matches.');
    }

    $pdo->beginTransaction();

    $stmtCloseMatches = $pdo->prepare("
        UPDATE photo_challenge_matches
        SET status = 'closed'
        WHERE challenge_id = :challenge_id AND phase = 'group'
    ");
    $stmtCloseMatches->execute(['challenge_id' => $challengeId]);

    deleteChallengeStructure($pdo, $challengeId, true);

    $insertMatch = $pdo->prepare("
        INSERT INTO photo_challenge_matches
            (challenge_id, phase, round, group_id, position, image_a_id, image_b_id, status)
        VALUES
            (:challenge_id, 'ko', 1, NULL, :position, :image_a_id, :image_b_id, 'open')
    ");
    foreach ($pairings as $pair) {
        $insertMatch->execute([
            'challenge_id' => $challengeId,
            'position' => $pair['position'],
            'image_a_id' => $pair['image_a_id'],
            'image_b_id' => $pair['image_b_id'],
        ]);
    }

    $stmt = $pdo->prepare("UPDATE photo_challenges SET status = 'ko_running' WHERE id = :id");
    $stmt->execute(['id' => $challengeId]);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'KO-Runde wurde gestartet.',
        'matches' => count($pairings),
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
        'message' => 'KO-Runde konnte nicht gestartet werden.',
        'details' => $e->getMessage(),
    ]);
}
