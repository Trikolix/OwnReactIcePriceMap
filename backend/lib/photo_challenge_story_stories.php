<?php

require_once __DIR__ . '/social_report_stories.php';

const ICE_PHOTO_CHALLENGE_STORY_W = ICE_SOCIAL_STORY_WIDTH;
const ICE_PHOTO_CHALLENGE_STORY_H = ICE_SOCIAL_STORY_HEIGHT;

function icePhotoChallengeBuildStorySlides(PDO $pdo, int $challengeId, string $pack): array
{
    if (!extension_loaded('gd') || !function_exists('imagepng')) {
        throw new RuntimeException('GD ist nicht verfügbar. Story-Grafiken können nicht erzeugt werden.');
    }

    $data = icePhotoChallengeFetchStoryData($pdo, $challengeId);
    $pack = in_array($pack, ['groups', 'ko', 'results', 'all'], true) ? $pack : 'all';
    $slides = [];

    if ($pack === 'groups' || $pack === 'all') {
        $slides = array_merge($slides, icePhotoChallengeBuildGroupSlides($data));
    }
    if ($pack === 'ko' || $pack === 'all') {
        $slides = array_merge($slides, icePhotoChallengeBuildKoSlides($data));
    }
    if ($pack === 'results' || $pack === 'all') {
        $slides = array_merge($slides, icePhotoChallengeBuildResultSlides($data));
    }

    if (empty($slides)) {
        throw new RuntimeException('Für dieses Story-Paket sind noch keine passenden Challenge-Daten vorhanden.');
    }

    return $slides;
}

function icePhotoChallengeFetchStoryData(PDO $pdo, int $challengeId): array
{
    $challenge = getChallengeById($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Challenge existiert nicht.');
    }
    $challenge = enrichPhotoChallengeForApi($challenge);

    $groups = icePhotoChallengeFetchGroups($pdo, $challengeId, $challenge);
    $matches = icePhotoChallengeFetchMatches($pdo, $challengeId, $groups);
    $groupMatches = [];
    $koMatches = [];
    foreach ($matches as $match) {
        if (($match['phase'] ?? '') === 'group' && !empty($match['group_id'])) {
            $groupMatches[(int)$match['group_id']][] = $match;
        } else {
            $koMatches[] = $match;
        }
    }

    foreach ($groups as &$group) {
        $group['matches'] = $groupMatches[(int)$group['id']] ?? [];
        icePhotoChallengeEnrichGroupResults($group, (int)($challenge['group_advancers'] ?? 2));
    }
    unset($group);

    usort($groups, fn($a, $b) => ($a['position'] ?? 0) <=> ($b['position'] ?? 0));
    usort($koMatches, fn($a, $b) => ($a['round'] ?? 0) <=> ($b['round'] ?? 0) ?: ($a['position'] ?? 0) <=> ($b['position'] ?? 0));

    return [
        'challenge' => $challenge,
        'groups' => $groups,
        'ko_matches' => $koMatches,
        'winner' => icePhotoChallengeFindWinner($pdo, $challengeId, $challenge, $koMatches),
    ];
}

function icePhotoChallengeFetchGroups(PDO $pdo, int $challengeId, array $challenge): array
{
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
               n.username,
               CASE
                   WHEN ch.is_country_challenge = 1 THEN COALESCE(NULLIF(pci.title, ''), NULLIF(l.name, ''), NULLIF(s.title, ''), b.beschreibung)
                   ELSE COALESCE(NULLIF(s.title, ''), b.beschreibung)
               END AS title,
               CASE WHEN ch.is_country_challenge = 1 THEN l.name ELSE NULL END AS country_name,
               CASE WHEN ch.is_country_challenge = 1 THEN l.country_code ELSE NULL END AS country_code
        FROM photo_challenge_group_entries ge
        JOIN photo_challenge_groups g ON g.id = ge.group_id
        JOIN photo_challenges ch ON ch.id = ge.challenge_id
        JOIN bilder b ON b.id = ge.image_id
        LEFT JOIN nutzer n ON n.id = b.nutzer_id
        LEFT JOIN photo_challenge_images pci ON pci.challenge_id = ge.challenge_id AND pci.image_id = ge.image_id
        LEFT JOIN photo_challenge_submissions s ON s.challenge_id = ge.challenge_id AND s.image_id = ge.image_id
        LEFT JOIN laender l ON l.id = pci.land_id
        WHERE ge.challenge_id = :challenge_id
        ORDER BY g.position ASC, ge.seed ASC
    ");
    $stmt->execute(['challenge_id' => $challengeId]);

    $groups = [];
    $now = new DateTimeImmutable('now', getPhotoChallengeTimezone());
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $entry) {
        $groupId = (int)$entry['group_id'];
        if (!isset($groups[$groupId])) {
            $startAt = !empty($entry['start_at']) ? new DateTimeImmutable((string)$entry['start_at'], getPhotoChallengeTimezone()) : null;
            $endAt = !empty($entry['end_at']) ? new DateTimeImmutable((string)$entry['end_at'], getPhotoChallengeTimezone()) : null;
            $status = 'active';
            if ($startAt && $now < $startAt) {
                $status = 'upcoming';
            } elseif ($endAt && $now > $endAt) {
                $status = 'finished';
            }
            $groups[$groupId] = [
                'id' => $groupId,
                'name' => (string)$entry['group_name'],
                'position' => (int)$entry['position'],
                'start_at' => $startAt ? $startAt->format(DateTimeInterface::ATOM) : null,
                'end_at' => $endAt ? $endAt->format(DateTimeInterface::ATOM) : null,
                'status' => $status,
                'entries' => [],
                'matches' => [],
                'results' => [],
            ];
        }
        $groups[$groupId]['entries'][] = icePhotoChallengeNormalizeImageEntry($entry);
    }

    return array_values($groups);
}

function icePhotoChallengeFetchMatches(PDO $pdo, int $challengeId, array $groups): array
{
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
    $voteSummary = getMatchVoteSummary($pdo, array_map(static fn($match) => (int)$match['id'], $matches));
    $metaByImageId = [];
    foreach ($groups as $group) {
        foreach ($group['entries'] as $entry) {
            $metaByImageId[(int)$entry['image_id']] = $entry;
        }
    }

    return array_map(static function (array $match) use ($voteSummary, $metaByImageId): array {
        $summary = summarizeMatchVotes($match, $voteSummary);
        $imageA = (int)$match['image_a_id'];
        $imageB = (int)$match['image_b_id'];
        return [
            'id' => (int)$match['id'],
            'phase' => $match['phase'],
            'round' => (int)$match['round'],
            'group_id' => $match['group_id'] ? (int)$match['group_id'] : null,
            'position' => (int)$match['position'],
            'status' => $match['status'],
            'locked_at' => $match['locked_at'],
            'winner' => $summary['winner'],
            'image_a_id' => $imageA,
            'image_b_id' => $imageB,
            'image_a_url' => $match['image_a_url'],
            'image_b_url' => $match['image_b_url'],
            'image_a_title' => $metaByImageId[$imageA]['title'] ?? null,
            'image_b_title' => $metaByImageId[$imageB]['title'] ?? null,
            'image_a_country_name' => $metaByImageId[$imageA]['country_name'] ?? null,
            'image_b_country_name' => $metaByImageId[$imageB]['country_name'] ?? null,
            'votes_a' => $summary['votes_a'],
            'votes_b' => $summary['votes_b'],
        ];
    }, $matches);
}

function icePhotoChallengeNormalizeImageEntry(array $entry): array
{
    return [
        'image_id' => (int)$entry['image_id'],
        'seed' => (int)($entry['seed'] ?? 0),
        'url' => $entry['url'] ?? '',
        'title' => icePhotoChallengeCleanTitle($entry['title'] ?? $entry['beschreibung'] ?? null, (int)$entry['image_id']),
        'beschreibung' => $entry['beschreibung'] ?? null,
        'username' => $entry['username'] ?? null,
        'nutzer_id' => (int)($entry['nutzer_id'] ?? 0),
        'country_name' => $entry['country_name'] ?? null,
        'country_code' => $entry['country_code'] ?? null,
        'votes' => 0,
        'votes_against' => 0,
        'wins' => 0,
    ];
}

function icePhotoChallengeEnrichGroupResults(array &$group, int $advancersPerGroup): void
{
    $votes = [];
    $votesAgainst = [];
    $wins = [];
    foreach ($group['matches'] as $match) {
        $imageA = (int)$match['image_a_id'];
        $imageB = (int)$match['image_b_id'];
        $votes[$imageA] = ($votes[$imageA] ?? 0) + (int)$match['votes_a'];
        $votes[$imageB] = ($votes[$imageB] ?? 0) + (int)$match['votes_b'];
        $votesAgainst[$imageA] = ($votesAgainst[$imageA] ?? 0) + (int)$match['votes_b'];
        $votesAgainst[$imageB] = ($votesAgainst[$imageB] ?? 0) + (int)$match['votes_a'];
        if (!empty($match['winner'])) {
            $wins[(int)$match['winner']] = ($wins[(int)$match['winner']] ?? 0) + 1;
        }
    }

    foreach ($group['entries'] as &$entry) {
        $imageId = (int)$entry['image_id'];
        $entry['votes'] = $votes[$imageId] ?? 0;
        $entry['votes_against'] = $votesAgainst[$imageId] ?? 0;
        $entry['wins'] = $wins[$imageId] ?? 0;
    }
    unset($entry);

    $results = $group['entries'];
    usort($results, 'icePhotoChallengeCompareResultEntries');
    $advancers = array_slice(array_column($results, 'image_id'), 0, max(1, $advancersPerGroup));
    foreach ($results as &$result) {
        $result['is_advancer'] = in_array((int)$result['image_id'], $advancers, true);
    }
    unset($result);
    $group['results'] = $results;
    $group['advancers'] = $group['status'] === 'finished' ? $advancers : [];
}

function icePhotoChallengeCompareResultEntries(array $a, array $b): int
{
    if (($a['votes'] ?? 0) !== ($b['votes'] ?? 0)) {
        return ($b['votes'] ?? 0) <=> ($a['votes'] ?? 0);
    }
    $diffA = ($a['votes'] ?? 0) - ($a['votes_against'] ?? 0);
    $diffB = ($b['votes'] ?? 0) - ($b['votes_against'] ?? 0);
    if ($diffA !== $diffB) {
        return $diffB <=> $diffA;
    }
    if (($a['wins'] ?? 0) !== ($b['wins'] ?? 0)) {
        return ($b['wins'] ?? 0) <=> ($a['wins'] ?? 0);
    }
    return ($a['image_id'] ?? 0) <=> ($b['image_id'] ?? 0);
}

function icePhotoChallengeFindWinner(PDO $pdo, int $challengeId, array $challenge, array $koMatches): ?array
{
    if (($challenge['status'] ?? '') !== 'finished') {
        return null;
    }
    $finalMatch = null;
    foreach ($koMatches as $match) {
        if (($match['status'] ?? '') !== 'closed' || empty($match['winner'])) {
            continue;
        }
        if (!$finalMatch || $match['round'] > $finalMatch['round'] || ($match['round'] === $finalMatch['round'] && $match['position'] > $finalMatch['position'])) {
            $finalMatch = $match;
        }
    }
    if (!$finalMatch) {
        return null;
    }

    $stmt = $pdo->prepare("
        SELECT b.id AS image_id,
               b.url,
               b.beschreibung,
               n.username,
               CASE
                   WHEN ch.is_country_challenge = 1 THEN COALESCE(NULLIF(pci.title, ''), NULLIF(l.name, ''), NULLIF(s.title, ''), b.beschreibung)
                   ELSE COALESCE(NULLIF(s.title, ''), b.beschreibung)
               END AS title,
               CASE WHEN ch.is_country_challenge = 1 THEN l.name ELSE NULL END AS country_name
        FROM bilder b
        JOIN photo_challenges ch ON ch.id = :challenge_id
        LEFT JOIN nutzer n ON n.id = b.nutzer_id
        LEFT JOIN photo_challenge_images pci ON pci.challenge_id = ch.id AND pci.image_id = b.id
        LEFT JOIN photo_challenge_submissions s ON s.challenge_id = ch.id AND s.image_id = b.id
        LEFT JOIN laender l ON l.id = pci.land_id
        WHERE b.id = :image_id
        LIMIT 1
    ");
    $stmt->execute([
        'challenge_id' => $challengeId,
        'image_id' => (int)$finalMatch['winner'],
    ]);
    $winner = $stmt->fetch(PDO::FETCH_ASSOC);
    return $winner ? icePhotoChallengeNormalizeImageEntry($winner) : null;
}

function icePhotoChallengeBuildGroupSlides(array $data): array
{
    if (empty($data['groups'])) {
        return [];
    }

    $slides = [];
    $allImages = [];
    foreach ($data['groups'] as $group) {
        $allImages = array_merge($allImages, array_slice($group['entries'], 0, 2));
    }
    $slides[] = [
        'filename' => '01_gruppenphase_startet.png',
        'image' => icePhotoChallengeRenderCoverSlide(
            $data,
            'Gruppenphase startet',
            count($data['groups']) . ' Gruppen warten auf deine Stimme',
            'Jetzt abstimmen in der Ice-App',
            array_slice($allImages, 0, 4)
        ),
    ];

    $index = 2;
    foreach ($data['groups'] as $group) {
        $slides[] = [
            'filename' => sprintf('%02d_gruppe_%s.png', $index++, icePhotoChallengeSlug((string)$group['name'])),
            'image' => icePhotoChallengeRenderGroupSlide($data, $group),
        ];
    }
    return $slides;
}

function icePhotoChallengeBuildKoSlides(array $data): array
{
    $openMatches = array_values(array_filter($data['ko_matches'], static fn($match) => ($match['status'] ?? '') === 'open'));
    if (empty($openMatches)) {
        return [];
    }
    $firstRound = min(array_map(static fn($match) => (int)$match['round'], $openMatches));
    $currentMatches = array_values(array_filter($openMatches, static fn($match) => (int)$match['round'] === $firstRound));
    $images = [];
    foreach ($currentMatches as $match) {
        $images[] = ['url' => $match['image_a_url'], 'title' => $match['image_a_title'], 'image_id' => $match['image_a_id']];
        $images[] = ['url' => $match['image_b_url'], 'title' => $match['image_b_title'], 'image_id' => $match['image_b_id']];
    }
    $roundLabel = icePhotoChallengeKoRoundLabel($currentMatches);

    $slides = [[
        'filename' => '01_ko_runde_voting.png',
        'image' => icePhotoChallengeRenderCoverSlide(
            $data,
            $roundLabel . ': Jetzt voten',
            count($currentMatches) . ' Duelle sind offen',
            'Wer kommt weiter?',
            array_slice($images, 0, 4)
        ),
    ]];

    $index = 2;
    foreach ($currentMatches as $match) {
        $slides[] = [
            'filename' => sprintf('%02d_ko_match_%02d.png', $index++, (int)$match['position']),
            'image' => icePhotoChallengeRenderKoMatchSlide($data, $match, $roundLabel),
        ];
    }
    return $slides;
}

function icePhotoChallengeBuildResultSlides(array $data): array
{
    $slides = [];
    if (!empty($data['winner'])) {
        $slides[] = [
            'filename' => '01_gewinner.png',
            'image' => icePhotoChallengeRenderWinnerSlide($data, $data['winner']),
        ];
    }

    $finishedGroups = array_values(array_filter($data['groups'], static fn($group) => ($group['status'] ?? '') === 'finished' && !empty($group['results'])));
    $index = count($slides) + 1;
    foreach ($finishedGroups as $group) {
        $slides[] = [
            'filename' => sprintf('%02d_ergebnis_%s.png', $index++, icePhotoChallengeSlug((string)$group['name'])),
            'image' => icePhotoChallengeRenderGroupResultSlide($data, $group),
        ];
    }

    return $slides;
}

function icePhotoChallengeRenderBase(array $data, string $label)
{
    $image = iceSocialReportCreateCanvas();
    iceSocialReportLogo($image, 70, 40, 220);
    iceSocialReportWrapText($image, $label, 330, 125, 680, 48, '#2f2100', 'bold', 1.08);
    iceSocialReportWrapText($image, icePhotoChallengeShortTitle($data['challenge']['title'] ?? 'Foto-Challenge'), 330, 190, 680, 28, '#503000', 'regular', 1.1);
    iceSocialReportText($image, 'ice-app.de', 90, 1810, 32, '#503000', 'bold');
    iceSocialReportText($image, 'Foto-Challenge', 690, 1810, 24, '#7a5a00', 'regular');
    return $image;
}

function icePhotoChallengeRenderCoverSlide(array $data, string $headline, string $subline, string $cta, array $images)
{
    $image = icePhotoChallengeRenderBase($data, 'Foto-Challenge');
    iceSocialReportWrapText($image, $headline, 90, 430, 900, 74, '#2f2100', 'bold', 1.03);
    iceSocialReportWrapText($image, $subline, 90, 600, 860, 38, '#503000', 'bold', 1.12);
    icePhotoChallengeDrawImageGrid($image, $images, 90, 720, 900, 650);
    icePhotoChallengeCta($image, $cta, 90, 1475, 900, 'arrow');
    return $image;
}

function icePhotoChallengeRenderGroupSlide(array $data, array $group)
{
    $image = icePhotoChallengeRenderBase($data, 'Gruppenphase');
    iceSocialReportWrapText($image, (string)$group['name'], 90, 425, 900, 82, '#2f2100', 'bold', 1.02);
    iceSocialReportWrapText($image, icePhotoChallengeGroupStatusLine($group), 90, 525, 900, 34, '#503000', 'bold', 1.12);
    icePhotoChallengeDrawImageGrid($image, array_slice($group['entries'], 0, 4), 90, 660, 900, 760);
    icePhotoChallengeCta($image, 'Stimme für deine Favoriten ab', 90, 1510, 900, 'arrow');
    return $image;
}

function icePhotoChallengeRenderKoMatchSlide(array $data, array $match, string $roundLabel)
{
    $image = icePhotoChallengeRenderBase($data, $roundLabel);
    iceSocialReportWrapText($image, 'Welches Foto kommt weiter?', 90, 420, 900, 64, '#2f2100', 'bold', 1.05);
    icePhotoChallengeDrawImage($image, ['url' => $match['image_a_url'], 'title' => $match['image_a_title'], 'image_id' => $match['image_a_id']], 90, 560, 420, 700);
    icePhotoChallengeDrawImage($image, ['url' => $match['image_b_url'], 'title' => $match['image_b_title'], 'image_id' => $match['image_b_id']], 570, 560, 420, 700);
    icePhotoChallengeVsBadge($image, 540, 940);
    icePhotoChallengeImageCaption($image, icePhotoChallengeCleanTitle($match['image_a_title'] ?? null, (int)$match['image_a_id']), 110, 1330, 380);
    icePhotoChallengeImageCaption($image, icePhotoChallengeCleanTitle($match['image_b_title'] ?? null, (int)$match['image_b_id']), 590, 1330, 380);
    icePhotoChallengeCta($image, 'Jetzt abstimmen', 90, 1535, 900, 'arrow');
    return $image;
}

function icePhotoChallengeRenderWinnerSlide(array $data, array $winner)
{
    $image = icePhotoChallengeRenderBase($data, 'Gewinner');
    iceSocialReportWrapText($image, 'Das Gewinnerfoto steht fest', 90, 420, 900, 62, '#2f2100', 'bold', 1.06);
    icePhotoChallengeDrawImage($image, $winner, 90, 575, 900, 860);
    iceSocialReportWrapText($image, icePhotoChallengeCleanTitle($winner['title'] ?? null, (int)$winner['image_id']), 120, 1505, 840, 44, '#2f2100', 'bold', 1.12);
    if (!empty($winner['username'])) {
        iceSocialReportWrapText($image, 'von ' . $winner['username'], 120, 1600, 840, 30, '#503000', 'regular', 1.12);
    }
    return $image;
}

function icePhotoChallengeRenderGroupResultSlide(array $data, array $group)
{
    $image = icePhotoChallengeRenderBase($data, 'Ergebnis');
    iceSocialReportWrapText($image, (string)$group['name'] . ': die Top-Fotos', 90, 420, 900, 58, '#2f2100', 'bold', 1.06);
    $top = array_slice($group['results'], 0, 3);
    $y = 560;
    foreach ($top as $index => $entry) {
        icePhotoChallengeDrawResultRow($image, $entry, $index + 1, $y);
        $y += 315;
    }
    icePhotoChallengeCta($image, 'Danke fürs Voten', 90, 1535, 900, 'heart');
    return $image;
}

function icePhotoChallengeDrawImageGrid($image, array $images, int $x, int $y, int $w, int $h): void
{
    $slots = [
        [$x, $y, (int)(($w - 24) / 2), (int)(($h - 24) / 2)],
        [$x + (int)(($w + 24) / 2), $y, (int)(($w - 24) / 2), (int)(($h - 24) / 2)],
        [$x, $y + (int)(($h + 24) / 2), (int)(($w - 24) / 2), (int)(($h - 24) / 2)],
        [$x + (int)(($w + 24) / 2), $y + (int)(($h + 24) / 2), (int)(($w - 24) / 2), (int)(($h - 24) / 2)],
    ];
    for ($i = 0; $i < min(4, count($slots)); $i++) {
        icePhotoChallengeDrawImage($image, $images[$i] ?? [], $slots[$i][0], $slots[$i][1], $slots[$i][2], $slots[$i][3]);
    }
}

function icePhotoChallengeDrawResultRow($image, array $entry, int $rank, int $y): void
{
    icePhotoChallengeDrawImage($image, $entry, 90, $y, 250, 250);
    iceSocialReportText($image, '#' . $rank, 380, $y + 82, 58, '#2f2100', 'bold');

    $title = icePhotoChallengeCleanTitle($entry['title'] ?? null, (int)$entry['image_id']);
    $titleLines = icePhotoChallengeFitTextLines($title, 470, 34, 'bold', 2);
    $lineY = $y + 68;
    foreach ($titleLines as $line) {
        iceSocialReportText($image, $line, 480, $lineY, 34, '#2f2100', 'bold');
        $lineY += 40;
    }

    iceSocialReportText(
        $image,
        iceSocialReportFormatNumber((int)($entry['votes'] ?? 0)) . ' Stimmen',
        480,
        $y + 178,
        28,
        '#503000',
        'regular'
    );
}

function icePhotoChallengeDrawImage($image, array $entry, int $x, int $y, int $w, int $h): void
{
    iceSocialReportRoundedRect($image, $x + 8, $y + 12, $w, $h, 28, '#d49c35', 45);
    iceSocialReportRoundedRect($image, $x, $y, $w, $h, 28, '#ffffff');
    $source = icePhotoChallengeLoadImage($entry['url'] ?? '');
    if (!$source) {
        iceSocialReportRoundedRect($image, $x + 16, $y + 16, $w - 32, $h - 32, 20, '#ffe8aa');
        iceSocialReportWrapText($image, 'Bild nicht verfügbar', $x + 42, $y + (int)($h / 2), $w - 84, 30, '#503000', 'bold', 1.1);
        return;
    }

    $srcW = imagesx($source);
    $srcH = imagesy($source);
    $scale = max($w / max(1, $srcW), $h / max(1, $srcH));
    $copyW = (int)round($w / $scale);
    $copyH = (int)round($h / $scale);
    $srcX = max(0, (int)round(($srcW - $copyW) / 2));
    $srcY = max(0, (int)round(($srcH - $copyH) / 2));
    imagecopyresampled($image, $source, $x, $y, $srcX, $srcY, $w, $h, $copyW, $copyH);
    imagedestroy($source);
}

function icePhotoChallengeLoadImage(string $url)
{
    $url = trim($url);
    if ($url === '') {
        return false;
    }

    $data = false;
    $localPath = icePhotoChallengeResolveLocalImagePath($url);
    if ($localPath) {
        $data = @file_get_contents($localPath);
    } elseif (preg_match('/^https?:\/\//i', $url)) {
        $context = stream_context_create([
            'http' => ['timeout' => 5],
            'https' => ['timeout' => 5],
        ]);
        $data = @file_get_contents($url, false, $context);
    }

    if ($data === false || $data === '') {
        return false;
    }
    return function_exists('imagecreatefromstring') ? @imagecreatefromstring($data) : false;
}

function icePhotoChallengeResolveLocalImagePath(string $url): ?string
{
    if (preg_match('/^https?:\/\//i', $url)) {
        $parts = parse_url($url);
        $path = $parts['path'] ?? '';
    } else {
        $path = $url;
    }
    $path = ltrim(str_replace('\\', '/', $path), '/');
    $root = iceSocialReportProjectRoot();
    $candidates = [
        $root . '/' . $path,
        $root . '/public/' . $path,
        $root . '/backend/' . $path,
    ];
    foreach ($candidates as $candidate) {
        $real = realpath($candidate);
        if ($real && is_file($real) && is_readable($real)) {
            return $real;
        }
    }
    return null;
}

function icePhotoChallengeImageCaption($image, string $text, int $x, int $y, int $w): void
{
    iceSocialReportRoundedRect($image, $x, $y, $w, 120, 24, '#ffffff');
    iceSocialReportWrapText($image, $text, $x + 24, $y + 48, $w - 48, 28, '#2f2100', 'bold', 1.08);
}

function icePhotoChallengeVsBadge($image, int $centerX, int $centerY): void
{
    imagefilledellipse($image, $centerX + 8, $centerY + 12, 118, 118, iceSocialReportColor($image, '#d49c35', 45));
    imagefilledellipse($image, $centerX, $centerY, 118, 118, iceSocialReportColor($image, '#fff7df'));
    imagesetthickness($image, 8);
    imageellipse($image, $centerX, $centerY, 118, 118, iceSocialReportColor($image, '#ffb522'));
    imagesetthickness($image, 1);
    iceSocialReportText($image, 'VS', $centerX - 34, $centerY + 22, 38, '#2f2100', 'bold');
}

function icePhotoChallengeCta($image, string $text, int $x, int $y, int $w, ?string $icon = null): void
{
    iceSocialReportPanel($image, $x, $y, $w, 155, '#ffffff', '#14923a');
    $textWidth = $icon ? $w - 210 : $w - 90;
    iceSocialReportWrapText($image, $text, $x + 45, $y + 70, $textWidth, 42, '#2f2100', 'bold', 1.08);

    if ($icon === 'arrow') {
        icePhotoChallengeDrawArrow($image, $x + $w - 125, $y + 78);
    } elseif ($icon === 'heart') {
        icePhotoChallengeDrawHeart($image, $x + $w - 115, $y + 76, 44);
    }
}

function icePhotoChallengeDrawArrow($image, int $x, int $y): void
{
    $color = iceSocialReportColor($image, '#2f2100');
    imagesetthickness($image, 10);
    imageline($image, $x - 42, $y, $x + 42, $y, $color);
    imageline($image, $x + 42, $y, $x + 14, $y - 26, $color);
    imageline($image, $x + 42, $y, $x + 14, $y + 26, $color);
    imagesetthickness($image, 1);
}

function icePhotoChallengeDrawHeart($image, int $centerX, int $centerY, int $size): void
{
    $color = iceSocialReportColor($image, '#7a5a00');
    $half = (int)round($size / 2);
    imagefilledellipse($image, $centerX - (int)round($size * 0.22), $centerY - (int)round($size * 0.12), $half, $half, $color);
    imagefilledellipse($image, $centerX + (int)round($size * 0.22), $centerY - (int)round($size * 0.12), $half, $half, $color);
    imagefilledpolygon(
        $image,
        [
            $centerX - (int)round($size * 0.46), $centerY,
            $centerX + (int)round($size * 0.46), $centerY,
            $centerX, $centerY + (int)round($size * 0.52),
        ],
        3,
        $color
    );
}

function icePhotoChallengeGroupStatusLine(array $group): string
{
    if (($group['status'] ?? '') === 'finished') {
        return 'Voting beendet';
    }
    if (($group['status'] ?? '') === 'upcoming' && !empty($group['start_at'])) {
        return 'Startet am ' . date('d.m.Y', strtotime((string)$group['start_at']));
    }
    if (!empty($group['end_at'])) {
        return 'Aktiv bis ' . date('d.m.Y', strtotime((string)$group['end_at']));
    }
    return 'Jetzt live';
}

function icePhotoChallengeKoRoundLabel(array $matches): string
{
    $count = count($matches);
    if ($count === 1) {
        return 'Finale';
    }
    if ($count === 2) {
        return 'Halbfinale';
    }
    if ($count === 4) {
        return 'Viertelfinale';
    }
    if ($count === 8) {
        return 'Achtelfinale';
    }
    $round = !empty($matches[0]['round']) ? (int)$matches[0]['round'] : 1;
    return 'KO-Runde ' . $round;
}

function icePhotoChallengeCleanTitle(?string $title, int $imageId): string
{
    $title = trim((string)$title);
    if ($title === '') {
        return 'Bild #' . $imageId;
    }
    return icePhotoChallengeLimitText($title, 70);
}

function icePhotoChallengeShortTitle(string $title): string
{
    $title = trim($title);
    return icePhotoChallengeLimitText($title, 52);
}

function icePhotoChallengeLimitText(string $text, int $limit): string
{
    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        return mb_strlen($text, 'UTF-8') > $limit
            ? mb_substr($text, 0, max(0, $limit - 3), 'UTF-8') . '...'
            : $text;
    }

    return strlen($text) > $limit ? substr($text, 0, max(0, $limit - 3)) . '...' : $text;
}

function icePhotoChallengeFitTextLines(string $text, int $maxWidth, int $size, string $weight, int $maxLines): array
{
    $words = preg_split('/\s+/', trim($text));
    $lines = [];
    $line = '';

    foreach ($words as $word) {
        if ($word === '') {
            continue;
        }
        $test = trim($line . ' ' . $word);
        if ($line !== '' && icePhotoChallengeTextWidth($test, $size, $weight) > $maxWidth) {
            $lines[] = $line;
            $line = $word;
        } else {
            $line = $test;
        }
    }

    if ($line !== '') {
        $lines[] = $line;
    }

    if (empty($lines)) {
        return [];
    }

    if (count($lines) > $maxLines) {
        $lines = array_slice($lines, 0, $maxLines);
        $lines[$maxLines - 1] = icePhotoChallengeEllipsize($lines[$maxLines - 1], $maxWidth, $size, $weight);
    }

    foreach ($lines as &$line) {
        $line = icePhotoChallengeEllipsize($line, $maxWidth, $size, $weight);
    }
    unset($line);

    return $lines;
}

function icePhotoChallengeEllipsize(string $text, int $maxWidth, int $size, string $weight): string
{
    $text = trim($text);
    if (icePhotoChallengeTextWidth($text, $size, $weight) <= $maxWidth) {
        return $text;
    }

    $ellipsis = '...';
    while ($text !== '' && icePhotoChallengeTextWidth($text . $ellipsis, $size, $weight) > $maxWidth) {
        $text = icePhotoChallengeRemoveLastCharacter($text);
    }

    return rtrim($text) . $ellipsis;
}

function icePhotoChallengeRemoveLastCharacter(string $text): string
{
    if (function_exists('mb_substr') && function_exists('mb_strlen')) {
        return mb_substr($text, 0, max(0, mb_strlen($text, 'UTF-8') - 1), 'UTF-8');
    }

    return substr($text, 0, max(0, strlen($text) - 1));
}

function icePhotoChallengeTextWidth(string $text, int $size, string $weight): int
{
    $font = iceSocialReportFont($weight);
    if ($font !== '' && function_exists('imagettfbbox')) {
        $box = imagettfbbox($size, 0, $font, $text);
        return $box ? (int)abs($box[2] - $box[0]) : 0;
    }

    return (int)round(strlen($text) * $size * 0.58);
}

function icePhotoChallengeSlug(string $value): string
{
    $value = strtolower(trim($value));
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT', $value);
        if ($converted !== false) {
            $value = $converted;
        }
    }
    $value = preg_replace('/[^a-z0-9]+/', '_', $value);
    return trim((string)$value, '_') ?: 'story';
}
