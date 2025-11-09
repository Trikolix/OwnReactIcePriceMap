<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$challengeId = isset($_GET['challenge_id']) ? (int)$_GET['challenge_id'] : 0;
$viewerId = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : 0;

if (!$challengeId) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Challenge-ID fehlt.',
    ]);
    exit;
}

try {
    ensurePhotoChallengeSchema($pdo);
    $challenge = getChallengeById($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Challenge existiert nicht.');
    }

    $stmt = $pdo->prepare("
        SELECT g.id AS group_id,
               g.name AS group_name,
               g.position,
               g.start_at,
               g.end_at,
               ge.image_id,
               ge.seed,
               b.url,
               b.beschreibung,
               b.nutzer_id,
               n.username
        FROM photo_challenge_group_entries ge
        JOIN photo_challenge_groups g ON g.id = ge.group_id
        JOIN bilder b ON b.id = ge.image_id
        LEFT JOIN nutzer n ON n.id = b.nutzer_id
        WHERE ge.challenge_id = :challenge_id
        ORDER BY g.position ASC, ge.seed ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    $groupEntries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $groups = [];
    foreach ($groupEntries as $entry) {
        $groupId = (int)$entry['group_id'];
        if (!isset($groups[$groupId])) {
            $groups[$groupId] = [
                'id' => $groupId,
                'name' => $entry['group_name'],
                'position' => (int)$entry['position'],
                'start_at' => $entry['start_at'],
                'end_at' => $entry['end_at'],
                'entries' => [],
                'matches' => [],
            ];
        }
        $groups[$groupId]['entries'][] = [
            'image_id' => (int)$entry['image_id'],
            'seed' => (int)$entry['seed'],
            'url' => $entry['url'],
            'beschreibung' => $entry['beschreibung'],
            'nutzer_id' => (int)$entry['nutzer_id'],
            'username' => $entry['username'],
        ];
    }

    $stmt = $pdo->prepare("
        SELECT m.*,
               img_a.url AS image_a_url,
               img_b.url AS image_b_url
        FROM photo_challenge_matches m
        JOIN bilder img_a ON img_a.id = m.image_a_id
        JOIN bilder img_b ON img_b.id = m.image_b_id
        WHERE m.challenge_id = :challenge_id
        ORDER BY m.phase ASC, m.round ASC, m.position ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $matchIds = array_map(fn($match) => (int)$match['id'], $matches);
    $voteSummary = getMatchVoteSummary($pdo, $matchIds);

    $viewerVotes = [];
    $debugViewerVotes = [];
    if ($viewerId) {
        $stmt = $pdo->prepare("
            SELECT v.match_id, v.image_id
            FROM photo_challenge_votes v
            JOIN photo_challenge_matches m ON m.id = v.match_id
            WHERE m.challenge_id = :challenge_id AND v.nutzer_id = :viewer_id
        ");
        $stmt->execute([
            'challenge_id' => $challengeId,
            'viewer_id' => $viewerId,
        ]);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $voteRow) {
            $matchId = (int)$voteRow['match_id'];
            $imageId = (int)$voteRow['image_id'];
            $viewerVotes[$matchId] = $imageId;
            if (isset($_GET['debug'])) {
                $debugViewerVotes[] = ['match_id' => $matchId, 'image_id' => $imageId];
            }
        }
    }

    $koMatches = [];
    $userVotesPerGroup = [];
    foreach ($matches as $match) {
        $summary = summarizeMatchVotes($match, $voteSummary);
        $hasVoted = isset($viewerVotes[(int)$match['id']]);
        if ($hasVoted && $match['group_id']) {
            $gid = (int)$match['group_id'];
            if (!isset($userVotesPerGroup[$gid])) {
                $userVotesPerGroup[$gid] = 0;
            }
            $userVotesPerGroup[$gid]++;
        }
            $payload = [
                'id' => (int)$match['id'],
                'phase' => $match['phase'],
                'round' => (int)$match['round'],
                'group_id' => $match['group_id'] ? (int)$match['group_id'] : null,
            'position' => (int)$match['position'],
            'image_a_id' => (int)$match['image_a_id'],
            'image_b_id' => (int)$match['image_b_id'],
            'image_a_url' => $match['image_a_url'],
            'image_b_url' => $match['image_b_url'],
            'votes_a' => $summary['votes_a'],
            'votes_b' => $summary['votes_b'],
            'status' => $match['status'],
            'winner' => $summary['winner'],
            'user_choice' => $viewerVotes[(int)$match['id']] ?? null,
            'has_voted' => $hasVoted,
        ];
        if ($match['phase'] === 'group' && $match['group_id'] && isset($groups[(int)$match['group_id']])) {
            $groups[(int)$match['group_id']]['matches'][] = $payload;
        } else {
            $koMatches[] = $payload;
        }
    }

    $now = new DateTimeImmutable();
    foreach ($groups as &$group) {
        $groupId = (int)$group['id'];
        $startAt = $group['start_at'] ? new DateTimeImmutable($group['start_at']) : null;
        $endAt = $group['end_at'] ? new DateTimeImmutable($group['end_at']) : null;
        $status = 'active';
        if ($startAt && $now < $startAt) {
            $status = 'upcoming';
        } elseif ($endAt && $now > $endAt) {
            $status = 'finished';
        }
        $group['status'] = $status;
        $group['start_at'] = $startAt ? $startAt->format(DateTimeInterface::ATOM) : null;
        $group['end_at'] = $endAt ? $endAt->format(DateTimeInterface::ATOM) : null;
        if ($status === 'upcoming' && $startAt) {
            $group['status_label'] = 'Startet am ' . $startAt->format('d.m.Y');
        } elseif ($status === 'finished') {
            $group['status_label'] = 'Voting beendet';
        } elseif ($endAt) {
            $group['status_label'] = 'Aktiv bis ' . $endAt->format('d.m.Y');
        } else {
            $group['status_label'] = 'Aktiv';
        }
        if ($status === 'finished') {
            $results = [];
            foreach ($group['entries'] as $entry) {
                $results[$entry['image_id']] = [
                    'image_id' => $entry['image_id'],
                    'url' => $entry['url'],
                    'beschreibung' => $entry['beschreibung'],
                    'username' => $entry['username'],
                    'wins' => 0,
                ];
            }
            foreach ($group['matches'] as $match) {
                $winnerId = $match['winner'] ?? null;
                if ($winnerId && isset($results[$winnerId])) {
                    $results[$winnerId]['wins']++;
                }
            }
            usort($results, fn($a, $b) => $b['wins'] <=> $a['wins']);
            $group['results'] = array_values($results);
        } else {
            $group['results'] = [];
        }
        $group['user_votes'] = $userVotesPerGroup[$groupId] ?? 0;
    }
    unset($group);

    usort($koMatches, fn($a, $b) => $a['round'] <=> $b['round'] ?: $a['position'] <=> $b['position']);
    usort($groups, fn($a, $b) => $a['position'] <=> $b['position']);

    $response = [
        'status' => 'success',
        'challenge' => $challenge,
        'groups' => $groups,
        'ko_matches' => $koMatches,
    ];
    if (isset($_GET['debug'])) {
        $response['debug'] = [
            'viewer_id' => $viewerId,
            'votes_found' => $debugViewerVotes,
            'user_votes_per_group' => $userVotesPerGroup,
        ];
    }

    echo json_encode($response);
} catch (RuntimeException $e) {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Challenge-Details konnten nicht geladen werden.',
        'details' => $e->getMessage(),
    ]);
}
