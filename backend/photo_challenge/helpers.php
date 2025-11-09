<?php

function ensurePhotoChallengeSchema(PDO $pdo): void
{
    static $initialized = false;
    if ($initialized) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS photo_challenges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            group_size INT NOT NULL DEFAULT 4,
            start_at DATETIME NULL,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS photo_challenge_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            challenge_id INT NOT NULL,
            image_id INT NOT NULL,
            assigned_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_challenge_image (challenge_id, image_id),
            CONSTRAINT fk_challenge FOREIGN KEY (challenge_id) REFERENCES photo_challenges(id) ON DELETE CASCADE,
            CONSTRAINT fk_challenge_image FOREIGN KEY (image_id) REFERENCES bilder(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS photo_challenge_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            challenge_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            position INT NOT NULL,
            start_at DATETIME NULL,
            end_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_challenge_group (challenge_id, position),
            CONSTRAINT fk_challenge_group FOREIGN KEY (challenge_id) REFERENCES photo_challenges(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");
    addColumnIfMissing($pdo, 'photo_challenge_groups', 'start_at', 'DATETIME NULL AFTER position');
    addColumnIfMissing($pdo, 'photo_challenge_groups', 'end_at', 'DATETIME NULL AFTER start_at');

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS photo_challenge_group_entries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            challenge_id INT NOT NULL,
            group_id INT NOT NULL,
            image_id INT NOT NULL,
            seed INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_group_image (group_id, image_id),
            CONSTRAINT fk_group_entry_group FOREIGN KEY (group_id) REFERENCES photo_challenge_groups(id) ON DELETE CASCADE,
            CONSTRAINT fk_group_entry_image FOREIGN KEY (image_id) REFERENCES bilder(id) ON DELETE CASCADE,
            CONSTRAINT fk_group_entry_challenge FOREIGN KEY (challenge_id) REFERENCES photo_challenges(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS photo_challenge_matches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            challenge_id INT NOT NULL,
            phase ENUM('group', 'ko') NOT NULL,
            round INT NOT NULL DEFAULT 1,
            group_id INT NULL,
            position INT NOT NULL,
            image_a_id INT NOT NULL,
            image_b_id INT NOT NULL,
            winner_image_id INT NULL,
            status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            locked_at TIMESTAMP NULL,
            UNIQUE KEY uniq_match_position (challenge_id, phase, round, position),
            CONSTRAINT fk_match_challenge FOREIGN KEY (challenge_id) REFERENCES photo_challenges(id) ON DELETE CASCADE,
            CONSTRAINT fk_match_group FOREIGN KEY (group_id) REFERENCES photo_challenge_groups(id) ON DELETE CASCADE,
            CONSTRAINT fk_match_image_a FOREIGN KEY (image_a_id) REFERENCES bilder(id) ON DELETE CASCADE,
            CONSTRAINT fk_match_image_b FOREIGN KEY (image_b_id) REFERENCES bilder(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS photo_challenge_votes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            match_id INT NOT NULL,
            nutzer_id INT NOT NULL,
            image_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_vote (match_id, nutzer_id),
            CONSTRAINT fk_vote_match FOREIGN KEY (match_id) REFERENCES photo_challenge_matches(id) ON DELETE CASCADE,
            CONSTRAINT fk_vote_image FOREIGN KEY (image_id) REFERENCES bilder(id) ON DELETE CASCADE,
            CONSTRAINT fk_vote_user FOREIGN KEY (nutzer_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    $initialized = true;
}

function addColumnIfMissing(PDO $pdo, string $table, string $column, string $definition): void
{
    $stmt = $pdo->prepare("SHOW COLUMNS FROM {$table} LIKE :column");
    $stmt->execute(['column' => $column]);
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
    }
}

function isPhotoChallengeAdmin($userId): bool
{
    return (int)$userId === 1;
}

function requirePhotoChallengeAdmin($userId): void
{
    if (!isPhotoChallengeAdmin($userId)) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Keine Berechtigung für diesen Bereich.',
        ]);
        exit;
    }
}

function normalizeDateTime(?string $value): ?string
{
    if (empty($value)) {
        return null;
    }

    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return null;
    }
    return date('Y-m-d H:i:s', $timestamp);
}

function fetchChallenges(PDO $pdo): array
{
    $stmt = $pdo->query("
        SELECT c.*,
               COALESCE(img_counts.total_images, 0) AS image_count
        FROM photo_challenges c
        LEFT JOIN (
            SELECT challenge_id, COUNT(*) AS total_images
            FROM photo_challenge_images
            GROUP BY challenge_id
        ) AS img_counts ON img_counts.challenge_id = c.id
        ORDER BY c.created_at DESC
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function fetchChallengeImages(PDO $pdo, int $challengeId): array
{
    $stmt = $pdo->prepare("
        SELECT pci.id,
               pci.image_id,
               pci.created_at,
               b.url,
               b.beschreibung,
               b.nutzer_id,
               n.username,
               b.checkin_id,
               c.datum AS checkin_datum,
               e.name AS eisdiele_name
        FROM photo_challenge_images pci
        JOIN bilder b ON b.id = pci.image_id
        LEFT JOIN nutzer n ON n.id = b.nutzer_id
        LEFT JOIN checkins c ON c.id = b.checkin_id
        LEFT JOIN eisdielen e ON e.id = c.eisdiele_id
        WHERE pci.challenge_id = :challenge_id
        ORDER BY pci.created_at DESC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getChallengeById(PDO $pdo, int $challengeId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM photo_challenges WHERE id = :id");
    $stmt->execute(['id' => $challengeId]);
    $challenge = $stmt->fetch(PDO::FETCH_ASSOC);
    return $challenge ?: null;
}

function getAssignedImageIds(PDO $pdo, int $challengeId): array
{
    $stmt = $pdo->prepare("
        SELECT image_id
        FROM photo_challenge_images
        WHERE challenge_id = :challenge_id
        ORDER BY created_at ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function deleteChallengeStructure(PDO $pdo, int $challengeId, bool $deleteKoOnly = false): void
{
    if ($deleteKoOnly) {
        $stmt = $pdo->prepare("
            DELETE FROM photo_challenge_votes
            WHERE match_id IN (
                SELECT id FROM photo_challenge_matches
                WHERE challenge_id = :challenge_id AND phase = 'ko'
            )
        ");
        $stmt->execute(['challenge_id' => $challengeId]);

        $stmt = $pdo->prepare("
            DELETE FROM photo_challenge_matches
            WHERE challenge_id = :challenge_id AND phase = 'ko'
        ");
        $stmt->execute(['challenge_id' => $challengeId]);
        return;
    }

    $stmt = $pdo->prepare("
        DELETE FROM photo_challenge_votes
        WHERE match_id IN (
            SELECT id FROM photo_challenge_matches WHERE challenge_id = :challenge_id
        )
    ");
    $stmt->execute(['challenge_id' => $challengeId]);

    $stmt = $pdo->prepare("DELETE FROM photo_challenge_matches WHERE challenge_id = :challenge_id");
    $stmt->execute(['challenge_id' => $challengeId]);

    $stmt = $pdo->prepare("DELETE FROM photo_challenge_group_entries WHERE challenge_id = :challenge_id");
    $stmt->execute(['challenge_id' => $challengeId]);

    $stmt = $pdo->prepare("DELETE FROM photo_challenge_groups WHERE challenge_id = :challenge_id");
    $stmt->execute(['challenge_id' => $challengeId]);
}

function buildRoundRobinPairs(array $imageIds): array
{
    $pairs = [];
    $count = count($imageIds);
    for ($i = 0; $i < $count; $i++) {
        for ($j = $i + 1; $j < $count; $j++) {
            $pairs[] = [$imageIds[$i], $imageIds[$j]];
        }
    }
    return $pairs;
}

function getMatchVoteSummary(PDO $pdo, array $matchIds): array
{
    if (empty($matchIds)) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($matchIds), '?'));
    $stmt = $pdo->prepare("
        SELECT match_id, image_id, COUNT(*) AS votes
        FROM photo_challenge_votes
        WHERE match_id IN ($placeholders)
        GROUP BY match_id, image_id
    ");
    $stmt->execute($matchIds);
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result = [];
    foreach ($raw as $row) {
        $matchId = (int)$row['match_id'];
        if (!isset($result[$matchId])) {
            $result[$matchId] = [];
        }
        $result[$matchId][(int)$row['image_id']] = (int)$row['votes'];
    }
    return $result;
}

function summarizeMatchVotes(array $match, array $voteSummary): array
{
    $matchId = (int)$match['id'];
    $imageA = (int)$match['image_a_id'];
    $imageB = (int)$match['image_b_id'];
    $votesA = $voteSummary[$matchId][$imageA] ?? 0;
    $votesB = $voteSummary[$matchId][$imageB] ?? 0;
    $winner = null;
    if ($votesA > $votesB) {
        $winner = $imageA;
    } elseif ($votesB > $votesA) {
        $winner = $imageB;
    } elseif ($votesA === $votesB && $votesA !== 0) {
        $winner = min($imageA, $imageB);
    }

    return [
        'votes_a' => $votesA,
        'votes_b' => $votesB,
        'winner'  => $winner,
    ];
}

function fetchGroupStandings(PDO $pdo, int $challengeId): array
{
    $stmt = $pdo->prepare("
        SELECT g.id AS group_id,
               g.name AS group_name,
               ge.image_id,
               b.url,
               b.beschreibung,
               g.start_at,
               g.end_at
        FROM photo_challenge_group_entries ge
        JOIN photo_challenge_groups g ON g.id = ge.group_id
        JOIN bilder b ON b.id = ge.image_id
        WHERE ge.challenge_id = :challenge_id
        ORDER BY g.position ASC, ge.id ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT * FROM photo_challenge_matches
        WHERE challenge_id = :challenge_id AND phase = 'group'
        ORDER BY id ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $matchIds = array_map(fn($row) => (int)$row['id'], $matches);
    $votes = getMatchVoteSummary($pdo, $matchIds);

    $groupStats = [];
    foreach ($entries as $entry) {
        $groupId = (int)$entry['group_id'];
        if (!isset($groupStats[$groupId])) {
            $groupStats[$groupId] = [
                'group_id' => $groupId,
                'group_name' => $entry['group_name'],
                'entries' => [],
            ];
        }
        $groupStats[$groupId]['entries'][(int)$entry['image_id']] = [
            'image_id' => (int)$entry['image_id'],
            'url' => $entry['url'],
            'beschreibung' => $entry['beschreibung'],
            'wins' => 0,
            'votes_for' => 0,
            'votes_against' => 0,
        ];
        if (!isset($groupStats[$groupId]['meta'])) {
            $groupStats[$groupId]['meta'] = [
                'start_at' => $entry['start_at'],
                'end_at' => $entry['end_at'],
            ];
        }
    }

    foreach ($matches as $match) {
        $groupId = (int)$match['group_id'];
        $imageA = (int)$match['image_a_id'];
        $imageB = (int)$match['image_b_id'];
        $summary = summarizeMatchVotes($match, $votes);
        $votesA = $summary['votes_a'];
        $votesB = $summary['votes_b'];
        $winner = $summary['winner'];

        if (!isset($groupStats[$groupId]['entries'][$imageA]) || !isset($groupStats[$groupId]['entries'][$imageB])) {
            continue;
        }

        $groupStats[$groupId]['entries'][$imageA]['votes_for'] += $votesA;
        $groupStats[$groupId]['entries'][$imageA]['votes_against'] += $votesB;
        $groupStats[$groupId]['entries'][$imageB]['votes_for'] += $votesB;
        $groupStats[$groupId]['entries'][$imageB]['votes_against'] += $votesA;

        if ($winner === $imageA) {
            $groupStats[$groupId]['entries'][$imageA]['wins']++;
        } elseif ($winner === $imageB) {
            $groupStats[$groupId]['entries'][$imageB]['wins']++;
        }
    }

    foreach ($groupStats as &$group) {
        $group['entries'] = array_values($group['entries']);
        usort($group['entries'], function ($a, $b) {
            if ($a['wins'] !== $b['wins']) {
                return $b['wins'] <=> $a['wins'];
            }
            if ($a['votes_for'] !== $b['votes_for']) {
                return $b['votes_for'] <=> $a['votes_for'];
            }
            $diffA = $a['votes_for'] - $a['votes_against'];
            $diffB = $b['votes_for'] - $b['votes_against'];
            if ($diffA !== $diffB) {
                return $diffB <=> $diffA;
            }
            return $a['image_id'] <=> $b['image_id'];
        });
    }
    unset($group);

    $resultGroups = [];
    foreach ($groupStats as $group) {
        $meta = $group['meta'] ?? [];
        unset($group['meta']);
        $resultGroups[] = [
            'group_id' => $group['group_id'],
            'group_name' => $group['group_name'],
            'entries' => $group['entries'],
            'meta' => $meta,
        ];
    }

    return $resultGroups;
}

function rotateArray(array $items, int $offset): array
{
    if (empty($items)) {
        return $items;
    }
    $offset = $offset % count($items);
    if ($offset === 0) {
        return $items;
    }
    return array_merge(array_slice($items, $offset), array_slice($items, 0, $offset));
}
