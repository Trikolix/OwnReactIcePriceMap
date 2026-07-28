<?php
require_once __DIR__ . '/tour_de_glace.php';
require_once __DIR__ . '/award_grants.php';

const TOUR_DE_GLACE_FEMME_ID = 'tour_de_glace_femme_2026';
const TOUR_DE_GLACE_FEMME_TIP_DEADLINE = '2026-08-01 14:15:00';
const TOUR_DE_GLACE_FEMME_EGG_MULTIPLIER = 1.25;
const TOUR_DE_GLACE_FEMME_AWARD_CODE = 'tour_de_glace_femme_2026';
const TOUR_DE_GLACE_FEMME_AWARD_LEVELS = [1, 2, 3, 4, 5, 6];

function tourDeGlaceFemmeTimezone(): DateTimeZone
{
    return new DateTimeZone('Europe/Berlin');
}

function getTourDeGlaceFemmeNow(): DateTimeImmutable
{
    return new DateTimeImmutable('now', tourDeGlaceFemmeTimezone());
}

function tourDeGlaceFemmeConfig(): array
{
    return [
        'id' => TOUR_DE_GLACE_FEMME_ID,
        'title' => 'Tour de Glace Femmes 2026',
        'pre_start' => '2026-07-28 00:00:00',
        'start' => '2026-08-01 00:00:00',
        'end' => '2026-08-09 23:59:59',
        'tip_deadline' => TOUR_DE_GLACE_FEMME_TIP_DEADLINE,
        'stages' => [
            1 => ['date' => '2026-08-01', 'start_at' => '2026-08-01 14:15:00', 'start' => 'Lausanne', 'finish' => 'Lausanne', 'lat' => 46.5197, 'lng' => 6.6323, 'hint' => 'Der Grand Depart startet am Genfersee.'],
            2 => ['date' => '2026-08-02', 'start_at' => '2026-08-02 14:20:00', 'start' => 'Aigle', 'finish' => 'Geneve', 'lat' => 46.3181, 'lng' => 6.9695, 'hint' => 'Von Aigle geht es Richtung Genfersee.'],
            3 => ['date' => '2026-08-03', 'start_at' => '2026-08-03 13:25:00', 'start' => 'Geneve', 'finish' => 'Poligny', 'lat' => 46.2044, 'lng' => 6.1432, 'hint' => 'Heute geht es von der Schweiz in den Jura.'],
            4 => ['date' => '2026-08-04', 'start_at' => '2026-08-04 14:34:00', 'start' => 'Gevrey-Chambertin', 'finish' => 'Dijon', 'lat' => 47.2250, 'lng' => 4.9680, 'hint' => 'Ein kurzes Zeitfahren zwischen Weinorten und Dijon.'],
            5 => ['date' => '2026-08-05', 'start_at' => '2026-08-05 13:45:00', 'start' => 'Macon', 'finish' => 'Belleville-en-Beaujolais', 'lat' => 46.3069, 'lng' => 4.8286, 'hint' => 'Das Beaujolais wartet mit kleinen Anstiegen.'],
            6 => ['date' => '2026-08-06', 'start_at' => '2026-08-06 13:35:00', 'start' => 'Montbrison', 'finish' => 'Tournon-sur-Rhone', 'lat' => 45.6076, 'lng' => 4.0669, 'hint' => 'Von der Loire ins Rhonetal.'],
            7 => ['date' => '2026-08-07', 'start_at' => '2026-08-07 12:50:00', 'start' => 'La Voulte-sur-Rhone', 'finish' => 'Mont Ventoux', 'lat' => 44.8007, 'lng' => 4.7804, 'hint' => 'Der Mont Ventoux ist das grosse Bergfinale.'],
            8 => ['date' => '2026-08-08', 'start_at' => '2026-08-08 13:40:00', 'start' => 'Sisteron', 'finish' => 'Nice', 'lat' => 44.1966, 'lng' => 5.9477, 'hint' => 'Von der Zitadelle in die Metropole an der Cote d Azur.'],
            9 => ['date' => '2026-08-09', 'start_at' => '2026-08-09 16:05:00', 'start' => 'Nice', 'finish' => 'Nice', 'lat' => 43.7102, 'lng' => 7.2620, 'hint' => 'Das Finale entscheidet sich rund um Nizza.'],
        ],
    ];
}

function tourDeGlaceFemmeStageTipPointRules(): array
{
    return [1 => 25, 2 => 18, 3 => 14, 4 => 11, 5 => 9, 6 => 7, 7 => 5, 8 => 4, 9 => 3, 10 => 2];
}

function tourDeGlaceFemmeOverallTipPointRules(): array
{
    return [
        'gc_exact' => [1 => 50, 2 => 30, 3 => 20],
        'gc_top3_wrong_position' => 10,
        'jersey_rank' => [1 => 35, 2 => 15, 3 => 10],
        'team_rank' => [1 => 25, 2 => 10, 3 => 5],
    ];
}

function ensureTourDeGlaceFemmeTables(PDO $pdo): void
{
    ensureTourDeGlaceTables($pdo);
    $config = tourDeGlaceFemmeConfig();
    $insert = $pdo->prepare(
        "INSERT INTO tour_de_glace_easter_eggs
            (campaign_id, stage_number, stage_date, start_location, finish_location, latitude, longitude, hint_text, secret_code, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE stage_date = VALUES(stage_date), start_location = VALUES(start_location), finish_location = VALUES(finish_location),
            latitude = VALUES(latitude), longitude = VALUES(longitude), hint_text = VALUES(hint_text), secret_code = VALUES(secret_code)"
    );
    foreach ($config['stages'] as $stageNumber => $stage) {
        $insert->execute([
            TOUR_DE_GLACE_FEMME_ID,
            $stageNumber,
            $stage['date'],
            $stage['start'],
            $stage['finish'],
            $stage['lat'],
            $stage['lng'],
            $stage['hint'],
            'tdgf-' . $stageNumber . '-' . substr(sha1(TOUR_DE_GLACE_FEMME_ID . '|' . $stageNumber), 0, 8),
        ]);
    }
}

function getTourDeGlaceFemmePhase(?DateTimeImmutable $now = null): string
{
    $config = tourDeGlaceFemmeConfig();
    $reference = $now ?? getTourDeGlaceFemmeNow();
    $preStart = new DateTimeImmutable($config['pre_start'], tourDeGlaceFemmeTimezone());
    $start = new DateTimeImmutable($config['start'], tourDeGlaceFemmeTimezone());
    $end = new DateTimeImmutable($config['end'], tourDeGlaceFemmeTimezone());
    if ($reference < $preStart) return 'upcoming';
    if ($reference < $start) return 'pre';
    if ($reference <= $end) return 'active';
    return 'results';
}

function getTourDeGlaceFemmeStage(int $stageNumber): ?array
{
    $stage = tourDeGlaceFemmeConfig()['stages'][$stageNumber] ?? null;
    return $stage ? ['stage_number' => $stageNumber] + $stage : null;
}

function getTourDeGlaceFemmeStageStart(array $stage): DateTimeImmutable
{
    return new DateTimeImmutable((string)$stage['start_at'], tourDeGlaceFemmeTimezone());
}

function getTourDeGlaceFemmeStageTipDeadline(array $stage): DateTimeImmutable
{
    return getTourDeGlaceFemmeStageStart($stage)->modify('-5 minutes');
}

function normalizeTourDeGlaceFemmeName(string $value): string
{
    return normalizeTourDeGlaceTipName(trim((string)preg_replace('/\s+/u', ' ', $value)));
}

function getTourDeGlaceFemmeFinalResults(PDO $pdo): ?array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $stmt = $pdo->prepare('SELECT * FROM tour_de_glace_final_results WHERE campaign_id = ? LIMIT 1');
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

function getTourDeGlaceFemmeStageResults(PDO $pdo): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $stmt = $pdo->prepare('SELECT * FROM tour_de_glace_stage_results WHERE campaign_id = ? ORDER BY stage_number ASC');
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID]);
    $results = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $top10 = buildTourDeGlaceStageTop10FromRow($row);
        $results[(int)$row['stage_number']] = [
            'stage_number' => (int)$row['stage_number'],
            'stage_winner' => $top10[0] ?? $row['stage_winner'],
            'top10' => $top10,
            'updated_at' => $row['updated_at'],
        ];
    }
    return $results;
}

function hasTourDeGlaceFemmeCompleteResults(PDO $pdo): bool
{
    if (!getTourDeGlaceFemmeFinalResults($pdo)) {
        return false;
    }

    return hasTourDeGlaceFemmeCompleteStageResults($pdo);
}

function hasTourDeGlaceFemmeCompleteStageResults(PDO $pdo): bool
{
    $stageResults = getTourDeGlaceFemmeStageResults($pdo);
    foreach (tourDeGlaceFemmeConfig()['stages'] as $stageNumber => $_stage) {
        $top10 = $stageResults[$stageNumber]['top10'] ?? [];
        if (count($top10) !== 10 || count(array_unique(array_map('normalizeTourDeGlaceFemmeName', $top10))) !== 10) {
            return false;
        }
    }
    return true;
}

function getTourDeGlaceFemmeAwardConfiguration(PDO $pdo): array
{
    $stmt = $pdo->prepare(
        'SELECT a.id AS award_id, al.level
         FROM awards a
         LEFT JOIN award_levels al ON al.award_id = a.id
         WHERE a.code = ?'
    );
    $stmt->execute([TOUR_DE_GLACE_FEMME_AWARD_CODE]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $awardId = null;
    $levels = [];
    foreach ($rows as $row) {
        $awardId = (int)$row['award_id'];
        if ($row['level'] !== null) {
            $levels[] = (int)$row['level'];
        }
    }
    $levels = array_values(array_unique($levels));
    sort($levels);
    $missingLevels = array_values(array_diff(TOUR_DE_GLACE_FEMME_AWARD_LEVELS, $levels));
    return [
        'award_id' => $awardId,
        'configured' => $awardId !== null && !$missingLevels,
        'levels' => $levels,
        'missing_levels' => $missingLevels,
    ];
}

function assertTourDeGlaceFemmeAwardConfiguration(PDO $pdo): array
{
    $configuration = getTourDeGlaceFemmeAwardConfiguration($pdo);
    if (!$configuration['configured']) {
        $missing = $configuration['award_id'] === null
            ? 'der Award-Code ' . TOUR_DE_GLACE_FEMME_AWARD_CODE
            : 'die Level ' . implode(', ', $configuration['missing_levels']);
        throw new RuntimeException('Die Award-Reihe Tour de Glace Femmes 2026 ist unvollstaendig: Bitte ' . $missing . ' im Award-Admin anlegen.');
    }
    return $configuration;
}

function getTourDeGlaceFemmeTips(PDO $pdo, int $userId): ?array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $stmt = $pdo->prepare('SELECT * FROM tour_de_glace_tips WHERE campaign_id = ? AND user_id = ? LIMIT 1');
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID, $userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

function scoreTourDeGlaceFemmeOverallTips(array $tips, ?array $results): array
{
    $summary = ['points' => 0, 'exact_hits' => 0, 'gc_top3_hits' => 0, 'breakdown' => []];
    if (!$results) return $summary;
    $rules = tourDeGlaceFemmeOverallTipPointRules();
    $actualTop3 = [
        normalizeTourDeGlaceFemmeName((string)$results['result_gc_winner']),
        normalizeTourDeGlaceFemmeName((string)$results['result_gc_second']),
        normalizeTourDeGlaceFemmeName((string)$results['result_gc_third']),
    ];
    $gcKeys = ['tip_gc_winner', 'tip_gc_second', 'tip_gc_third'];
    $resultKeys = ['result_gc_winner', 'result_gc_second', 'result_gc_third'];
    foreach ($gcKeys as $index => $tipKey) {
        $tipValue = trim((string)($tips[$tipKey] ?? ''));
        $tip = normalizeTourDeGlaceFemmeName($tipValue);
        $points = 0;
        $outcome = $tip === '' ? 'no_tip' : 'miss';
        if ($tip !== '' && $tip === $actualTop3[$index]) {
            $points = $rules['gc_exact'][$index + 1];
            $outcome = 'exact';
            $summary['exact_hits']++;
            $summary['gc_top3_hits']++;
        } elseif ($tip !== '' && in_array($tip, $actualTop3, true)) {
            $points = $rules['gc_top3_wrong_position'];
            $outcome = 'top3_wrong_position';
            $summary['gc_top3_hits']++;
        }
        $summary['points'] += $points;
        $summary['breakdown'][] = ['key' => $tipKey, 'tip' => $tipValue, 'result' => $results[$resultKeys[$index]], 'points' => $points, 'outcome' => $outcome];
    }
    $rankedClassifications = [
        'tip_green_winner' => ['result_green_winner', 'result_green_second', 'result_green_third'],
        'tip_mountain_winner' => ['result_mountain_winner', 'result_mountain_second', 'result_mountain_third'],
        'tip_white_winner' => ['result_white_winner', 'result_white_second', 'result_white_third'],
        'tip_team_winner' => ['result_team_winner', 'result_team_second', 'result_team_third'],
    ];
    foreach ($rankedClassifications as $tipKey => $resultKeys) {
        $tipValue = trim((string)($tips[$tipKey] ?? ''));
        $points = 0;
        $outcome = $tipValue === '' ? 'no_tip' : 'miss';
        $rank = null;
        foreach ($resultKeys as $index => $resultKey) {
            if ($tipValue !== '' && normalizeTourDeGlaceFemmeName($tipValue) === normalizeTourDeGlaceFemmeName((string)($results[$resultKey] ?? ''))) {
                $rank = $index + 1;
                break;
            }
        }
        if ($rank !== null) {
            $points = $tipKey === 'tip_team_winner' ? $rules['team_rank'][$rank] : $rules['jersey_rank'][$rank];
            $outcome = 'rank_' . $rank;
            if ($rank === 1) {
                $summary['exact_hits']++;
            }
        }
        $summary['points'] += $points;
        $summary['breakdown'][] = ['key' => $tipKey, 'tip' => $tipValue, 'result' => implode(' · ', array_map(static fn(string $key, int $index): string => '#' . ($index + 1) . ' ' . (string)($results[$key] ?? '-'), $resultKeys, array_keys($resultKeys))), 'points' => $points, 'outcome' => $outcome];
    }
    return $summary;
}

function scoreTourDeGlaceFemmeStageTip(string $tip, array $top10, bool $hasEgg): array
{
    $normalizedTip = normalizeTourDeGlaceFemmeName($tip);
    $rank = null;
    foreach (array_values($top10) as $index => $name) {
        if ($normalizedTip !== '' && $normalizedTip === normalizeTourDeGlaceFemmeName((string)$name)) {
            $rank = $index + 1;
            break;
        }
    }
    $base = $rank ? (int)(tourDeGlaceFemmeStageTipPointRules()[$rank] ?? 0) : 0;
    $final = $base > 0 ? (int)round($base * ($hasEgg ? TOUR_DE_GLACE_FEMME_EGG_MULTIPLIER : 1)) : 0;
    return ['predicted_rank' => $rank, 'base_ep' => $base, 'egg_bonus_ep' => $final - $base, 'final_ep' => $final, 'scored' => $rank !== null];
}

function getTourDeGlaceFemmeFoundEggStages(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare(
        'SELECT e.stage_number FROM tour_de_glace_user_easter_eggs u
         JOIN tour_de_glace_easter_eggs e ON e.id = u.easter_egg_id
         WHERE u.campaign_id = ? AND u.user_id = ? AND u.is_shadow_test = 0'
    );
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID, $userId]);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function getTourDeGlaceFemmeStageTipsForUser(PDO $pdo, int $userId): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $stmt = $pdo->prepare('SELECT * FROM tour_de_glace_stage_tips WHERE campaign_id = ? AND user_id = ?');
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID, $userId]);
    $byStage = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) $byStage[(int)$row['stage_number']] = $row;
    $results = getTourDeGlaceFemmeStageResults($pdo);
    $foundStages = getTourDeGlaceFemmeFoundEggStages($pdo, $userId);
    $now = getTourDeGlaceFemmeNow();
    $items = [];
    foreach (tourDeGlaceFemmeConfig()['stages'] as $stageNumber => $stage) {
        $tip = $byStage[$stageNumber]['tip_stage_winner'] ?? '';
        $top10 = $results[$stageNumber]['top10'] ?? [];
        $score = $top10 ? scoreTourDeGlaceFemmeStageTip($tip, $top10, in_array($stageNumber, $foundStages, true)) : null;
        $items[] = [
            'stage_number' => $stageNumber,
            'stage_date' => $stage['date'],
            'start_at' => $stage['start_at'],
            'tip_deadline_at' => getTourDeGlaceFemmeStageTipDeadline($stage)->format('Y-m-d H:i:s'),
            'start_location' => $stage['start'],
            'finish_location' => $stage['finish'],
            'tip_stage_winner' => $tip,
            'closed' => $now >= getTourDeGlaceFemmeStageTipDeadline($stage),
            'has_egg' => in_array($stageNumber, $foundStages, true),
            'stage_winner' => $top10[0] ?? null,
            'stage_top10' => $top10,
            'has_result' => (bool)$top10,
            ...($score ?? ['predicted_rank' => null, 'base_ep' => 0, 'egg_bonus_ep' => 0, 'final_ep' => 0, 'scored' => false]),
        ];
    }
    return $items;
}

function getTourDeGlaceFemmeStageSummary(array $tips): array
{
    return array_reduce($tips, static function (array $summary, array $tip): array {
        $summary['points'] += (int)$tip['final_ep'];
        $summary['winner_hits'] += (int)(($tip['predicted_rank'] ?? null) === 1);
        $summary['top10_hits'] += (int)!empty($tip['scored']);
        return $summary;
    }, ['points' => 0, 'winner_hits' => 0, 'top10_hits' => 0]);
}

function rankTourDeGlaceFemmeEntries(array $entries, int $limit = 50): array
{
    usort($entries, static function (array $left, array $right): int {
        $points = (int)$right['points'] <=> (int)$left['points'];
        return $points !== 0 ? $points : (strcasecmp((string)$left['username'], (string)$right['username']) ?: ((int)$left['user_id'] <=> (int)$right['user_id']));
    });
    $rank = 0;
    $lastPoints = null;
    foreach ($entries as $index => &$entry) {
        if ($lastPoints !== (int)$entry['points']) {
            $rank = $index + 1;
            $lastPoints = (int)$entry['points'];
        }
        $entry['rank'] = $rank;
    }
    unset($entry);
    return $limit > 0 ? array_slice($entries, 0, min(100, $limit)) : $entries;
}

function getTourDeGlaceFemmeStageLeaderboard(PDO $pdo, int $limit = 50, bool $details = false): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $results = getTourDeGlaceFemmeStageResults($pdo);
    $stmt = $pdo->prepare(
        'SELECT t.user_id, n.username, t.stage_number, t.tip_stage_winner
         FROM tour_de_glace_stage_tips t JOIN nutzer n ON n.id = t.user_id WHERE t.campaign_id = ? ORDER BY t.user_id, t.stage_number'
    );
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID]);
    $entries = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $stageNumber = (int)$row['stage_number'];
        $top10 = $results[$stageNumber]['top10'] ?? [];
        if (!$top10) continue;
        $userId = (int)$row['user_id'];
        if (!isset($entries[$userId])) $entries[$userId] = ['user_id' => $userId, 'username' => $row['username'], 'points' => 0, 'winner_hits' => 0, 'top10_hits' => 0, 'breakdown' => []];
        $hasEgg = in_array($stageNumber, getTourDeGlaceFemmeFoundEggStages($pdo, $userId), true);
        $score = scoreTourDeGlaceFemmeStageTip((string)$row['tip_stage_winner'], $top10, $hasEgg);
        $entries[$userId]['points'] += $score['final_ep'];
        $entries[$userId]['winner_hits'] += (int)($score['predicted_rank'] === 1);
        $entries[$userId]['top10_hits'] += (int)$score['scored'];
        if ($details) {
            $stage = getTourDeGlaceFemmeStage($stageNumber);
            $entries[$userId]['breakdown'][] = ['stage_number' => $stageNumber, 'start_location' => $stage['start'], 'finish_location' => $stage['finish'], 'tip' => $row['tip_stage_winner'], 'result' => $top10[0], 'predicted_rank' => $score['predicted_rank'], 'base_ep' => $score['base_ep'], 'egg_bonus_ep' => $score['egg_bonus_ep'], 'points' => $score['final_ep']];
        }
    }
    foreach ($entries as &$entry) if (!$details) unset($entry['breakdown']);
    unset($entry);
    return rankTourDeGlaceFemmeEntries(array_values($entries), $limit);
}

function getTourDeGlaceFemmeCombinedLeaderboard(PDO $pdo, int $limit = 50, bool $details = false): array
{
    if (!hasTourDeGlaceFemmeCompleteResults($pdo)) return [];
    $finalResults = getTourDeGlaceFemmeFinalResults($pdo);
    $users = $pdo->prepare(
        'SELECT DISTINCT u.id AS user_id, u.username FROM nutzer u JOIN (
            SELECT user_id FROM tour_de_glace_tips WHERE campaign_id = ?
            UNION SELECT user_id FROM tour_de_glace_stage_tips WHERE campaign_id = ?
         ) participants ON participants.user_id = u.id'
    );
    $users->execute([TOUR_DE_GLACE_FEMME_ID, TOUR_DE_GLACE_FEMME_ID]);
    $entries = [];
    foreach ($users->fetchAll(PDO::FETCH_ASSOC) as $user) {
        $userId = (int)$user['user_id'];
        $overall = scoreTourDeGlaceFemmeOverallTips(getTourDeGlaceFemmeTips($pdo, $userId) ?: [], $finalResults);
        $stageTips = getTourDeGlaceFemmeStageTipsForUser($pdo, $userId);
        $stage = getTourDeGlaceFemmeStageSummary($stageTips);
        $entries[] = [
            'user_id' => $userId,
            'username' => $user['username'],
            'points' => $overall['points'] + $stage['points'],
            'overall_points' => $overall['points'],
            'stage_points' => $stage['points'],
            'exact_hits' => $overall['exact_hits'],
            'gc_top3_hits' => $overall['gc_top3_hits'],
            'winner_hits' => $stage['winner_hits'],
            'top10_hits' => $stage['top10_hits'],
            ...($details ? ['overall_breakdown' => $overall['breakdown'], 'stage_breakdown' => array_map(static function (array $tip): array {
                $rank = $tip['predicted_rank'];
                return [
                    'stage_number' => $tip['stage_number'],
                    'start_location' => $tip['start_location'],
                    'finish_location' => $tip['finish_location'],
                    'tip' => $tip['tip_stage_winner'],
                    'result' => $tip['stage_winner'],
                    'official_result' => $rank ? ($tip['stage_top10'][$rank - 1] ?? null) : null,
                    'predicted_rank' => $rank,
                    'base_ep' => $tip['base_ep'],
                    'egg_bonus_ep' => $tip['egg_bonus_ep'],
                    'points' => $tip['final_ep'],
                ];
            }, $stageTips)] : []),
        ];
    }
    return rankTourDeGlaceFemmeEntries($entries, $limit);
}

function getTourDeGlaceFemmeUserRank(PDO $pdo, int $userId, bool $combined = false): ?array
{
    $entries = $combined ? getTourDeGlaceFemmeCombinedLeaderboard($pdo, 0) : getTourDeGlaceFemmeStageLeaderboard($pdo, 0);
    foreach ($entries as $entry) if ((int)$entry['user_id'] === $userId) return $entry;
    return null;
}

function getTourDeGlaceFemmeEggCounts(PDO $pdo): array
{
    $stmt = $pdo->prepare(
        'SELECT user_id, COUNT(DISTINCT easter_egg_id) AS egg_count
         FROM tour_de_glace_user_easter_eggs
         WHERE campaign_id = ? AND is_shadow_test = 0
         GROUP BY user_id'
    );
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID]);
    $counts = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $counts[(int)$row['user_id']] = (int)$row['egg_count'];
    }
    return $counts;
}

function getTourDeGlaceFemmeFinisherUserIds(PDO $pdo): array
{
    $stmt = $pdo->prepare(
        'SELECT t.user_id
         FROM tour_de_glace_tips t
         JOIN tour_de_glace_stage_tips s ON s.user_id = t.user_id AND s.campaign_id = t.campaign_id
         WHERE t.campaign_id = ?
           AND LENGTH(TRIM(t.tip_gc_winner)) > 0 AND LENGTH(TRIM(t.tip_gc_second)) > 0 AND LENGTH(TRIM(t.tip_gc_third)) > 0
           AND LENGTH(TRIM(t.tip_green_winner)) > 0 AND LENGTH(TRIM(t.tip_mountain_winner)) > 0 AND LENGTH(TRIM(t.tip_white_winner)) > 0 AND LENGTH(TRIM(t.tip_team_winner)) > 0
           AND LENGTH(TRIM(s.tip_stage_winner)) > 0
         GROUP BY t.user_id
         HAVING COUNT(DISTINCT s.stage_number) = 9'
    );
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID]);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function determineTourDeGlaceFemmeAwardLevels(array $leaderboard, array $eggCounts, array $finisherUserIds): array
{
    $finishers = array_fill_keys(array_map('intval', $finisherUserIds), true);
    $qualifications = [];
    foreach ($leaderboard as $entry) {
        $userId = (int)$entry['user_id'];
        $levels = [];
        $rank = (int)($entry['rank'] ?? 0);
        if (in_array($rank, [1, 2, 3], true)) {
            $levels[] = $rank;
        }
        if ((int)($entry['winner_hits'] ?? 0) >= 1) {
            $levels[] = 4;
        }
        if ((int)($eggCounts[$userId] ?? 0) >= 6) {
            $levels[] = 5;
        }
        if (isset($finishers[$userId])) {
            $levels[] = 6;
        }
        if ($levels) {
            $qualifications[$userId] = array_values(array_unique($levels));
        }
    }
    return $qualifications;
}

function grantTourDeGlaceFemmeAwards(PDO $pdo, int $awardId): array
{
    $qualifications = determineTourDeGlaceFemmeAwardLevels(
        getTourDeGlaceFemmeCombinedLeaderboard($pdo, 0),
        getTourDeGlaceFemmeEggCounts($pdo),
        getTourDeGlaceFemmeFinisherUserIds($pdo)
    );
    $grants = [];
    foreach ($qualifications as $userId => $levels) {
        $createdLevels = [];
        foreach ($levels as $level) {
            $grant = grantAwardToUser($pdo, $userId, $awardId, $level, true);
            if ($grant['created']) {
                $createdLevels[] = $level;
            }
        }
        $grants[] = ['user_id' => $userId, 'levels' => $levels, 'created_levels' => $createdLevels];
    }
    return $grants;
}

function submitTourDeGlaceFemmeTips(PDO $pdo, int $userId, array $tips): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    if (getTourDeGlaceFemmeNow() >= new DateTimeImmutable(TOUR_DE_GLACE_FEMME_TIP_DEADLINE, tourDeGlaceFemmeTimezone())) throw new RuntimeException('Die Tour-Tipps sind geschlossen.');
    $fields = ['tip_gc_winner', 'tip_gc_second', 'tip_gc_third', 'tip_green_winner', 'tip_mountain_winner', 'tip_white_winner', 'tip_team_winner'];
    $clean = [];
    foreach ($fields as $field) {
        $value = trim((string)preg_replace('/\s+/u', ' ', (string)($tips[$field] ?? '')));
        if ($value === '') throw new RuntimeException('Bitte alle Tour-Tipps ausfuellen.');
        $clean[$field] = function_exists('mb_substr') ? mb_substr($value, 0, 160, 'UTF-8') : substr($value, 0, 160);
    }
    $gc = array_map('normalizeTourDeGlaceFemmeName', [$clean['tip_gc_winner'], $clean['tip_gc_second'], $clean['tip_gc_third']]);
    if (count(array_unique($gc)) !== 3) throw new RuntimeException('Eine Fahrerin darf in der GC Top 3 nur einmal getippt werden.');
    $stmt = $pdo->prepare('INSERT INTO tour_de_glace_tips (campaign_id, user_id, tip_gc_winner, tip_gc_second, tip_gc_third, tip_green_winner, tip_mountain_winner, tip_white_winner, tip_team_winner, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE tip_gc_winner = VALUES(tip_gc_winner), tip_gc_second = VALUES(tip_gc_second), tip_gc_third = VALUES(tip_gc_third), tip_green_winner = VALUES(tip_green_winner), tip_mountain_winner = VALUES(tip_mountain_winner), tip_white_winner = VALUES(tip_white_winner), tip_team_winner = VALUES(tip_team_winner), updated_at = NOW()');
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID, $userId, ...array_values($clean)]);
    return getTourDeGlaceFemmeTips($pdo, $userId) ?: [];
}

function submitTourDeGlaceFemmeStageTip(PDO $pdo, int $userId, int $stageNumber, string $tip): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $stage = getTourDeGlaceFemmeStage($stageNumber);
    if (!$stage) throw new RuntimeException('Ungueltige Etappe.');
    if (getTourDeGlaceFemmeNow() >= getTourDeGlaceFemmeStageTipDeadline($stage)) throw new RuntimeException('Die Tippabgabe fuer diese Etappe ist geschlossen.');
    $clean = trim((string)preg_replace('/\s+/u', ' ', $tip));
    if ($clean === '') throw new RuntimeException('Bitte tippe eine Etappensiegerin.');
    $stmt = $pdo->prepare('INSERT INTO tour_de_glace_stage_tips (campaign_id, user_id, stage_number, tip_stage_winner, submitted_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE tip_stage_winner = VALUES(tip_stage_winner), updated_at = NOW()');
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID, $userId, $stageNumber, function_exists('mb_substr') ? mb_substr($clean, 0, 160, 'UTF-8') : substr($clean, 0, 160)]);
    return getTourDeGlaceFemmeStageTipsForUser($pdo, $userId)[$stageNumber - 1] ?? [];
}

function findTourDeGlaceFemmeEgg(PDO $pdo, int $userId, int $stageNumber, string $secretCode): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $stage = getTourDeGlaceFemmeStage($stageNumber);
    if (!$stage || getTourDeGlaceFemmeNow()->format('Y-m-d') !== $stage['date']) throw new RuntimeException('Dieses Easter Egg ist heute nicht verfuegbar.');
    $stmt = $pdo->prepare('SELECT * FROM tour_de_glace_easter_eggs WHERE campaign_id = ? AND stage_number = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID, $stageNumber]);
    $egg = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$egg || !hash_equals((string)$egg['secret_code'], trim($secretCode))) throw new RuntimeException('Easter Egg nicht gefunden.');
    $insert = $pdo->prepare('INSERT IGNORE INTO tour_de_glace_user_easter_eggs (campaign_id, easter_egg_id, user_id, is_shadow_test) VALUES (?, ?, ?, 0)');
    $insert->execute([TOUR_DE_GLACE_FEMME_ID, $egg['id'], $userId]);
    return ['found' => true, 'is_new' => $insert->rowCount() > 0, 'stage_number' => $stageNumber];
}

function saveTourDeGlaceFemmeStageResult(PDO $pdo, int $adminUserId, int $stageNumber, array $top10): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    if (!getTourDeGlaceFemmeStage($stageNumber)) throw new RuntimeException('Ungueltige Etappe.');
    $clean = normalizeTourDeGlaceStageTop10($top10, (string)($top10[0] ?? ''));
    if (count($clean) !== 10 || count(array_unique(array_map('normalizeTourDeGlaceFemmeName', $clean))) !== 10) {
        throw new RuntimeException('Bitte alle zehn unterschiedlichen Fahrerinnen der Etappen-Top-10 eintragen.');
    }
    $columns = [];
    $values = [];
    for ($place = 2; $place <= 10; $place++) { $columns[] = 'stage_place_' . $place; $values[] = $clean[$place - 1] ?? null; }
    $stmt = $pdo->prepare('INSERT INTO tour_de_glace_stage_results (campaign_id, stage_number, stage_winner, ' . implode(', ', $columns) . ', top10_json, updated_by_user_id, updated_at) VALUES (?, ?, ?, ' . implode(', ', array_fill(0, 9, '?')) . ', ?, ?, NOW()) ON DUPLICATE KEY UPDATE stage_winner = VALUES(stage_winner), ' . implode(', ', array_map(static fn(string $column): string => $column . ' = VALUES(' . $column . ')', $columns)) . ', top10_json = VALUES(top10_json), updated_by_user_id = VALUES(updated_by_user_id), updated_at = NOW()');
    $stmt->execute([TOUR_DE_GLACE_FEMME_ID, $stageNumber, $clean[0], ...$values, json_encode($clean, JSON_UNESCAPED_UNICODE), $adminUserId]);
    return getTourDeGlaceFemmeStageResults($pdo)[$stageNumber] ?? [];
}

function saveTourDeGlaceFemmeFinalResults(PDO $pdo, int $adminUserId, array $results): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $fields = ['result_gc_winner', 'result_gc_second', 'result_gc_third', 'result_green_winner', 'result_green_second', 'result_green_third', 'result_mountain_winner', 'result_mountain_second', 'result_mountain_third', 'result_white_winner', 'result_white_second', 'result_white_third', 'result_team_winner', 'result_team_second', 'result_team_third'];
    $clean = [];
    foreach ($fields as $field) {
        $value = trim((string)preg_replace('/\s+/u', ' ', (string)($results[$field] ?? '')));
        if ($value === '') throw new RuntimeException('Bitte alle Endergebnisse eintragen.');
        $clean[$field] = $value;
    }
    if (count(array_unique(array_map('normalizeTourDeGlaceFemmeName', [$clean['result_gc_winner'], $clean['result_gc_second'], $clean['result_gc_third']]))) !== 3) throw new RuntimeException('Eine Fahrerin darf in der GC Top 3 nur einmal stehen.');
    if (!hasTourDeGlaceFemmeCompleteStageResults($pdo)) {
        throw new RuntimeException('Bitte zuerst die vollstaendigen Top 10 aller neun Etappen speichern.');
    }
    $awardConfiguration = assertTourDeGlaceFemmeAwardConfiguration($pdo);
    ensureAwardShownAtColumn($pdo);

    $startedTransaction = !$pdo->inTransaction();
    if ($startedTransaction) {
        $pdo->beginTransaction();
    }
    try {
        $stmt = $pdo->prepare('INSERT INTO tour_de_glace_final_results (campaign_id, ' . implode(', ', $fields) . ', updated_by_user_id, updated_at) VALUES (?, ' . implode(', ', array_fill(0, count($fields), '?')) . ', ?, NOW()) ON DUPLICATE KEY UPDATE ' . implode(', ', array_map(static fn(string $field): string => $field . ' = VALUES(' . $field . ')', $fields)) . ', updated_by_user_id = VALUES(updated_by_user_id), updated_at = NOW()');
        $stmt->execute([TOUR_DE_GLACE_FEMME_ID, ...array_values($clean), $adminUserId]);
        $awardGrants = grantTourDeGlaceFemmeAwards($pdo, (int)$awardConfiguration['award_id']);
        $finalResults = getTourDeGlaceFemmeFinalResults($pdo) ?: [];
        if ($startedTransaction) {
            $pdo->commit();
        }
        return ['final_results' => $finalResults, 'award_grants' => $awardGrants];
    } catch (Throwable $e) {
        if ($startedTransaction && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function buildTourDeGlaceFemmeProgress(PDO $pdo, ?int $userId): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $phase = getTourDeGlaceFemmePhase();
    $completeResults = hasTourDeGlaceFemmeCompleteResults($pdo);
    $finalResults = $completeResults ? getTourDeGlaceFemmeFinalResults($pdo) : null;
    $tips = $userId ? getTourDeGlaceFemmeTips($pdo, $userId) : null;
    $stageTips = $userId ? getTourDeGlaceFemmeStageTipsForUser($pdo, $userId) : [];
    $today = getTourDeGlaceFemmeNow()->format('Y-m-d');
    $currentStage = null;
    foreach (tourDeGlaceFemmeConfig()['stages'] as $number => $stage) if ($stage['date'] === $today) $currentStage = ['stage_number' => $number] + $stage;
    $egg = null;
    if ($currentStage && $phase === 'active') {
        $stmt = $pdo->prepare('SELECT * FROM tour_de_glace_easter_eggs WHERE campaign_id = ? AND stage_number = ? LIMIT 1');
        $stmt->execute([TOUR_DE_GLACE_FEMME_ID, $currentStage['stage_number']]);
        $rawEgg = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($rawEgg) {
            $egg = [
                'stage_number' => $currentStage['stage_number'],
                'start_location' => $rawEgg['start_location'],
                'finish_location' => $rawEgg['finish_location'],
                'latitude' => isset($rawEgg['latitude']) ? (float)$rawEgg['latitude'] : null,
                'longitude' => isset($rawEgg['longitude']) ? (float)$rawEgg['longitude'] : null,
                'hint_text' => $rawEgg['hint_text'],
                'map_secret_code' => $rawEgg['secret_code'],
                'found' => $userId ? in_array($currentStage['stage_number'], getTourDeGlaceFemmeFoundEggStages($pdo, $userId), true) : false,
            ];
        }
    }
    $overall = $userId ? scoreTourDeGlaceFemmeOverallTips($tips ?: [], $finalResults) : null;
    $stageSummary = getTourDeGlaceFemmeStageSummary($stageTips);
    $combined = $completeResults;
    return [
        'campaign' => ['id' => TOUR_DE_GLACE_FEMME_ID, 'title' => tourDeGlaceFemmeConfig()['title'], 'phase' => $phase, 'tip_deadline' => TOUR_DE_GLACE_FEMME_TIP_DEADLINE],
        'stages' => array_values(array_map(static fn(array $stage, int $number): array => ['stage_number' => $number] + $stage, tourDeGlaceFemmeConfig()['stages'], array_keys(tourDeGlaceFemmeConfig()['stages']))),
        'tips' => $tips,
        'stage_tips' => $stageTips,
        'stage_tip_summary' => $stageSummary,
        'stage_tip_rank' => $userId ? getTourDeGlaceFemmeUserRank($pdo, $userId) : null,
        'final_results' => $finalResults,
        'overall_tip_summary' => $overall,
        'combined_summary' => $overall ? ['points' => $overall['points'] + $stageSummary['points'], 'overall_points' => $overall['points'], 'stage_points' => $stageSummary['points']] : null,
        'combined_rank' => $userId && $combined ? getTourDeGlaceFemmeUserRank($pdo, $userId, true) : null,
        'leaderboard' => $combined ? getTourDeGlaceFemmeCombinedLeaderboard($pdo, 5) : getTourDeGlaceFemmeStageLeaderboard($pdo, 5),
        'current_stage' => $currentStage,
        'easter_egg' => $egg,
    ];
}

function buildTourDeGlaceFemmeAdminState(PDO $pdo): array
{
    ensureTourDeGlaceFemmeTables($pdo);
    $tips = $pdo->prepare('SELECT t.*, n.username FROM tour_de_glace_tips t JOIN nutzer n ON n.id = t.user_id WHERE t.campaign_id = ? ORDER BY t.updated_at DESC');
    $tips->execute([TOUR_DE_GLACE_FEMME_ID]);
    $stageTips = $pdo->prepare('SELECT t.*, n.username FROM tour_de_glace_stage_tips t JOIN nutzer n ON n.id = t.user_id WHERE t.campaign_id = ? ORDER BY t.stage_number, n.username');
    $stageTips->execute([TOUR_DE_GLACE_FEMME_ID]);
    $campaign = tourDeGlaceFemmeConfig();
    $campaign['stages'] = array_values(array_map(
        static fn(array $stage, int $stageNumber): array => ['stage_number' => $stageNumber] + $stage,
        $campaign['stages'],
        array_keys($campaign['stages'])
    ));
    return ['status' => 'success', 'campaign' => $campaign, 'stage_results' => array_values(getTourDeGlaceFemmeStageResults($pdo)), 'final_results' => getTourDeGlaceFemmeFinalResults($pdo), 'award_configuration' => getTourDeGlaceFemmeAwardConfiguration($pdo), 'tips' => $tips->fetchAll(PDO::FETCH_ASSOC), 'stage_tips' => $stageTips->fetchAll(PDO::FETCH_ASSOC)];
}

?>
