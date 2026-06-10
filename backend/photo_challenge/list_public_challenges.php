<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

function fetchPublicChallengePreviewImages(PDO $pdo, int $challengeId, int $limit = 4): array
{
    $stmt = $pdo->prepare("
        SELECT pci.image_id,
               b.url,
               b.beschreibung,
               CASE
                   WHEN ch.is_country_challenge = 1 THEN COALESCE(NULLIF(pci.title, ''), NULLIF(l.name, ''), NULLIF(sub.title, ''), b.beschreibung)
                   ELSE COALESCE(NULLIF(sub.title, ''), b.beschreibung)
               END AS title,
               CASE WHEN ch.is_country_challenge = 1 THEN l.name ELSE NULL END AS country_name,
               CASE WHEN ch.is_country_challenge = 1 THEN l.country_code ELSE NULL END AS country_code
        FROM photo_challenge_images pci
        JOIN photo_challenges ch ON ch.id = pci.challenge_id
        JOIN bilder b ON b.id = pci.image_id
        LEFT JOIN photo_challenge_submissions sub ON sub.challenge_id = pci.challenge_id AND sub.image_id = pci.image_id
        LEFT JOIN laender l ON l.id = pci.land_id
        WHERE pci.challenge_id = :challenge_id
        ORDER BY pci.created_at DESC
        LIMIT :limit
    ");
    $stmt->bindValue(':challenge_id', $challengeId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', max(1, $limit), PDO::PARAM_INT);
    $stmt->execute();

    return array_map(static function (array $row): array {
        return [
            'image_id' => (int)$row['image_id'],
            'url' => $row['url'],
            'title' => $row['title'] ?? null,
            'beschreibung' => $row['beschreibung'] ?? null,
            'country_name' => $row['country_name'] ?? null,
            'country_code' => $row['country_code'] ?? null,
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function fetchPublicChallengeWinnerImage(PDO $pdo, int $challengeId): ?array
{
    $stmt = $pdo->prepare("
        SELECT m.winner_image_id AS image_id,
               b.url,
               b.beschreibung,
               CASE
                   WHEN ch.is_country_challenge = 1 THEN COALESCE(NULLIF(pci.title, ''), NULLIF(l.name, ''), NULLIF(sub.title, ''), b.beschreibung)
                   ELSE COALESCE(NULLIF(sub.title, ''), b.beschreibung)
               END AS title,
               CASE WHEN ch.is_country_challenge = 1 THEN l.name ELSE NULL END AS country_name,
               CASE WHEN ch.is_country_challenge = 1 THEN l.country_code ELSE NULL END AS country_code
        FROM photo_challenge_matches m
        JOIN photo_challenges ch ON ch.id = m.challenge_id
        JOIN bilder b ON b.id = m.winner_image_id
        LEFT JOIN photo_challenge_images pci ON pci.challenge_id = m.challenge_id AND pci.image_id = m.winner_image_id
        LEFT JOIN photo_challenge_submissions sub ON sub.challenge_id = m.challenge_id AND sub.image_id = m.winner_image_id
        LEFT JOIN laender l ON l.id = pci.land_id
        WHERE m.challenge_id = :challenge_id
          AND m.phase = 'ko'
          AND m.status = 'closed'
          AND m.winner_image_id IS NOT NULL
        ORDER BY m.round DESC, m.position ASC
        LIMIT 1
    ");
    $stmt->execute(['challenge_id' => $challengeId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    return [
        'image_id' => (int)$row['image_id'],
        'url' => $row['url'],
        'title' => $row['title'] ?? null,
        'beschreibung' => $row['beschreibung'] ?? null,
        'country_name' => $row['country_name'] ?? null,
        'country_code' => $row['country_code'] ?? null,
    ];
}

try {
    ensurePhotoChallengeSchema($pdo);
    $challenges = array_values(array_filter(
        fetchChallenges($pdo),
        fn($challenge) => ($challenge['status'] ?? '') !== 'draft'
    ));

    $challenges = array_map(static function (array $challenge) use ($pdo): array {
        $challengeId = (int)$challenge['id'];
        $challenge['preview_images'] = fetchPublicChallengePreviewImages($pdo, $challengeId);
        $challenge['winner_image'] = ($challenge['status'] ?? '') === 'finished'
            ? fetchPublicChallengeWinnerImage($pdo, $challengeId)
            : null;
        return $challenge;
    }, $challenges);

    echo json_encode([
        'status' => 'success',
        'data' => $challenges,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Challenges konnten nicht geladen werden.',
        'details' => $e->getMessage(),
    ]);
}
