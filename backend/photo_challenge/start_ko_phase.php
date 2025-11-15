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

    $groupSize = max(1, (int)$challenge['group_size']);
    $groupAdvancers = (int)($challenge['group_advancers'] ?? 2);
    if ($groupAdvancers < 1) {
        $groupAdvancers = 1;
    }
    if ($groupAdvancers > $groupSize) {
        $groupAdvancers = $groupSize;
    }
    $luckySlots = max(0, (int)($challenge['lucky_loser_slots'] ?? 0));
    $requestedBracketSize = isset($challenge['ko_bracket_size']) ? (int)$challenge['ko_bracket_size'] : 0;
    if ($requestedBracketSize < 0) {
        $requestedBracketSize = 0;
    }

    $directAdvancers = [];
    $luckyCandidates = [];

    foreach ($groups as $group) {
        if (count($group['entries']) < $groupAdvancers) {
            throw new RuntimeException(sprintf('Gruppe %s hat nicht genug Bilder für %d weiterkommende Plätze.', $group['group_name'], $groupAdvancers));
        }
        for ($rank = 0; $rank < $groupAdvancers; $rank++) {
            $entry = $group['entries'][$rank];
            $directAdvancers[] = [
                'image_id' => (int)$entry['image_id'],
                'label' => $group['group_name'] . ' – Platz ' . ($rank + 1),
                'wins' => (int)($entry['wins'] ?? 0),
                'votes_for' => (int)($entry['votes_for'] ?? 0),
                'group_rank' => $rank + 1,
                'is_lucky' => false,
            ];
        }
        for ($rank = $groupAdvancers; $rank < count($group['entries']); $rank++) {
            $entry = $group['entries'][$rank];
            $luckyCandidates[] = [
                'image_id' => (int)$entry['image_id'],
                'label' => $group['group_name'] . ' – Platz ' . ($rank + 1),
                'wins' => (int)($entry['wins'] ?? 0),
                'votes_for' => (int)($entry['votes_for'] ?? 0),
                'group_rank' => $rank + 1,
                'is_lucky' => true,
            ];
        }
    }

    $directCount = count($directAdvancers);
    if ($directCount < 2) {
        throw new RuntimeException('Es werden mindestens zwei Teilnehmer für die KO-Runde benötigt.');
    }

    usort($luckyCandidates, function ($a, $b) {
        if ($a['wins'] !== $b['wins']) {
            return $b['wins'] <=> $a['wins'];
        }
        if ($a['votes_for'] !== $b['votes_for']) {
            return $b['votes_for'] <=> $a['votes_for'];
        }
        if ($a['group_rank'] !== $b['group_rank']) {
            return $a['group_rank'] <=> $b['group_rank'];
        }
        return $a['image_id'] <=> $b['image_id'];
    });

    $maxLuckyAvailable = min($luckySlots, count($luckyCandidates));
    $maxPossibleParticipants = $directCount + $maxLuckyAvailable;

    if ($requestedBracketSize > 0) {
        if ($requestedBracketSize % 2 !== 0) {
            throw new RuntimeException('Die Teilnehmerzahl für die KO-Runde muss gerade sein.');
        }
        if ($requestedBracketSize < $directCount) {
            throw new RuntimeException('Die KO-Teilnehmerzahl darf nicht kleiner als die Zahl der gesetzten Plätze sein.');
        }
        if ($requestedBracketSize > $maxPossibleParticipants) {
            throw new RuntimeException('Für das gewünschte KO-Feld fehlen Lucky-Loser-Slots oder qualifizierte Bilder.');
        }
        $targetParticipants = $requestedBracketSize;
    } else {
        $targetParticipants = $directCount;
        if ($targetParticipants % 2 !== 0) {
            if ($maxPossibleParticipants <= $targetParticipants) {
                throw new RuntimeException('Ungerade Anzahl an Teilnehmern – erhöhe die Lucky-Loser-Anzahl oder passe die Gruppenregeln an.');
            }
            $targetParticipants++;
        }
        $nextPower = nextPowerOfTwo($targetParticipants);
        if ($nextPower <= $maxPossibleParticipants) {
            $targetParticipants = $nextPower;
        } elseif ($targetParticipants > $maxPossibleParticipants) {
            throw new RuntimeException('Nicht genügend Lucky-Loser-Slots, um das KO-Feld zu vervollständigen. Bitte erhöhe die Slots oder lege eine feste KO-Größe fest.');
        }
    }

    $luckyNeeded = $targetParticipants - $directCount;
    if ($luckyNeeded > $maxLuckyAvailable) {
        throw new RuntimeException('Es stehen nicht genügend Lucky-Loser zur Verfügung.');
    }

    $selectedLucky = array_map(function ($participant) {
        $participant['label'] .= ' (Lucky Loser)';
        return $participant;
    }, array_slice($luckyCandidates, 0, $luckyNeeded));

    $participants = array_merge($directAdvancers, $selectedLucky);
    usort($participants, function ($a, $b) {
        if ($a['group_rank'] !== $b['group_rank']) {
            return $a['group_rank'] <=> $b['group_rank'];
        }
        if ($a['wins'] !== $b['wins']) {
            return $b['wins'] <=> $a['wins'];
        }
        if ($a['votes_for'] !== $b['votes_for']) {
            return $b['votes_for'] <=> $a['votes_for'];
        }
        if (($a['is_lucky'] ?? false) !== ($b['is_lucky'] ?? false)) {
            return ($a['is_lucky'] ?? false) <=> ($b['is_lucky'] ?? false);
        }
        return $a['image_id'] <=> $b['image_id'];
    });

    if (count($participants) % 2 !== 0) {
        throw new RuntimeException('Die Teilnehmerzahl für die KO-Runde muss gerade sein.');
    }

    $pairings = [];
    $position = 1;
    $left = 0;
    $right = count($participants) - 1;
    while ($left < $right) {
        $pairings[] = [
            'image_a_id' => $participants[$left]['image_id'],
            'image_b_id' => $participants[$right]['image_id'],
            'label_a' => $participants[$left]['label'],
            'label_b' => $participants[$right]['label'],
            'position' => $position++,
        ];
        $left++;
        $right--;
    }

    $pdo->beginTransaction();

    $stmtCloseMatches = $pdo->prepare("
        UPDATE photo_challenge_matches
        SET status = 'closed'
        WHERE challenge_id = :challenge_id AND phase = 'group'
    ");
    $stmtCloseMatches->execute(['challenge_id' => $challengeId]);

    $stmtCloseGroups = $pdo->prepare("
        UPDATE photo_challenge_groups
        SET end_at = CURRENT_TIMESTAMP
        WHERE challenge_id = :challenge_id AND (end_at IS NULL OR end_at > CURRENT_TIMESTAMP)
    ");
    $stmtCloseGroups->execute(['challenge_id' => $challengeId]);

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
