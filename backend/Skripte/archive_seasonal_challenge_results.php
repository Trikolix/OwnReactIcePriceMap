<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/seasonal_results.php';

date_default_timezone_set('Europe/Berlin');

$cleanup = in_array('--cleanup', $argv ?? [], true);
$dryRun = in_array('--dry-run', $argv ?? [], true);

function computeBirthdayArchivePayload(PDO $pdo, int $userId): array
{
    $periodStart = '2026-03-06 00:00:00';
    $periodEnd = '2026-03-22 23:59:59';
    $photoChallengeStart = '2026-03-06 00:00:00';
    $anniversaryUnlockAt = '2026-03-15 18:00:00';
    $eggCooldownHours = 3;
    $easterEggEpSchedule = [12, 10, 8, 6, 4, 3];
    $easterEggRecurringEp = 2;
    $photoChallengeSubmissionEp = 25;
    $photoChallengeVoteEp = 5;
    $mandatoryKeys = [
        'checkin_with_photo',
        'price_reported',
        'favorite_shop_added',
        'invited_user_with_checkin',
        'login_days_7',
        'profile_image',
        'comment_written',
        'rad_event_page_visited',
        'easter_eggs_3',
        'group_checkin_with_other',
        'photo_challenge_participated',
    ];

    $now = new DateTime('2026-03-23 00:00:00');
    $eventUnlockDate = new DateTime($anniversaryUnlockAt);
    $counts = [
        'checkins_total' => 0,
        'checkins_with_photo' => 0,
        'checkins_on_site' => 0,
        'group_checkins_count' => 0,
        'invited_users_count' => 0,
        'invited_users_with_checkin_count' => 0,
        'login_days' => 0,
        'comments_unique_targets' => 0,
        'favorite_shops_added_count' => 0,
        'easter_eggs_found' => 0,
        'new_shops_count' => 0,
        'challenges_completed' => 0,
        'reviews_count' => 0,
        'routes_count' => 0,
        'photo_challenge_submissions_count' => 0,
        'photo_challenge_votes_count' => 0,
    ];
    $status = [];

    $stmt = $pdo->prepare(
        "SELECT
            COUNT(*) AS checkins_total,
            SUM(CASE WHEN EXISTS (SELECT 1 FROM bilder b WHERE b.checkin_id = checkins.id) THEN 1 ELSE 0 END) AS checkins_with_photo,
            SUM(CASE WHEN is_on_site = 1 THEN 1 ELSE 0 END) AS checkins_on_site
         FROM checkins
         WHERE nutzer_id = :user_id
           AND datum BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $checkinRow = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $counts['checkins_total'] = (int)($checkinRow['checkins_total'] ?? 0);
    $counts['checkins_with_photo'] = (int)($checkinRow['checkins_with_photo'] ?? 0);
    $counts['checkins_on_site'] = (int)($checkinRow['checkins_on_site'] ?? 0);
    $status['checkin_with_photo'] = $counts['checkins_with_photo'] > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(DISTINCT c.group_id)
         FROM checkins c
         WHERE c.nutzer_id = :user_id
           AND c.datum BETWEEN :start AND :end
           AND c.group_id IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM checkins c2 WHERE c2.group_id = c.group_id AND c2.nutzer_id <> :user_id
           )"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['group_checkins_count'] = (int)$stmt->fetchColumn();
    $status['group_checkin_with_other'] = $counts['group_checkins_count'] > 0;

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM preise WHERE gemeldet_von = :user_id AND gemeldet_am BETWEEN :start AND :end");
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $priceReports = (int)$stmt->fetchColumn();
    $status['price_reported'] = $priceReports > 0;

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM favoriten WHERE nutzer_id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $counts['favorite_shops_added_count'] = (int)$stmt->fetchColumn();
    $status['favorite_shop_added'] = $counts['favorite_shops_added_count'] > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM nutzer n
         WHERE n.invited_by = :user_id
           AND n.is_verified = 1
           AND n.erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['invited_users_count'] = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM nutzer n
         WHERE n.invited_by = :user_id
           AND n.is_verified = 1
           AND n.erstellt_am BETWEEN :start AND :end
           AND EXISTS (
             SELECT 1 FROM checkins c WHERE c.nutzer_id = n.id AND c.datum BETWEEN :start AND :end
           )"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['invited_users_with_checkin_count'] = (int)$stmt->fetchColumn();
    $status['invited_user_with_checkin'] = $counts['invited_users_with_checkin_count'] > 0;

    $stmt = $pdo->prepare(
        "SELECT 1 FROM user_profile_images WHERE user_id = :user_id AND avatar_path IS NOT NULL AND avatar_path <> '' LIMIT 1"
    );
    $stmt->execute(['user_id' => $userId]);
    $status['profile_image'] = (bool)$stmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT COUNT(DISTINCT CONCAT(IFNULL(checkin_id, ''), '-', IFNULL(bewertung_id, ''), '-', IFNULL(route_id, '')))
         FROM kommentare
         WHERE nutzer_id = :user_id
           AND erstellt_am BETWEEN :start AND :end
           AND (checkin_id IS NOT NULL OR bewertung_id IS NOT NULL OR route_id IS NOT NULL)"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['comments_unique_targets'] = (int)$stmt->fetchColumn();
    $status['comment_written'] = $counts['comments_unique_targets'] > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM birthday_event_page_visits
         WHERE user_id = :user_id
           AND first_visited_at BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $status['rad_event_page_visited'] = ((int)$stmt->fetchColumn()) > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(DISTINCT shop_id)
         FROM birthday_easter_eggs
         WHERE user_id = :user_id
           AND discovered_at BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['easter_eggs_found'] = (int)$stmt->fetchColumn();
    $status['easter_eggs_3'] = $counts['easter_eggs_found'] >= 3;

    $stmt = $pdo->prepare(
        "SELECT MAX(discovered_at)
         FROM birthday_easter_eggs
         WHERE user_id = :user_id
           AND discovered_at BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $latestEggAtRaw = $stmt->fetchColumn();
    $nextEggAvailableAt = null;
    if ($latestEggAtRaw) {
        $latestEggAt = new DateTime($latestEggAtRaw);
        $latestEggAt->modify("+{$eggCooldownHours} hours");
        $nextEggAvailableAt = $latestEggAt->format('Y-m-d H:i:s');
    }

    $stmt = $pdo->prepare("SELECT login_days FROM birthday_user_progress WHERE user_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $userId]);
    $counts['login_days'] = (int)$stmt->fetchColumn();
    $status['login_days_7'] = $counts['login_days'] >= 7;

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM eisdielen WHERE user_id = :user_id AND erstellt_am BETWEEN :start AND :end");
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['new_shops_count'] = (int)$stmt->fetchColumn();
    $status['new_shop_submitted'] = $counts['new_shops_count'] > 0;

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM challenges WHERE nutzer_id = :user_id AND completed = 1 AND completed_at BETWEEN :start AND :end");
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['challenges_completed'] = (int)$stmt->fetchColumn();
    $status['challenge_completed'] = $counts['challenges_completed'] > 0;

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM bewertungen WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end");
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['reviews_count'] = (int)$stmt->fetchColumn();
    $status['ice_shop_reviewed'] = $counts['reviews_count'] > 0;

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM routen WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end");
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['routes_count'] = (int)$stmt->fetchColumn();
    $status['route_submitted'] = $counts['routes_count'] > 0;

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM photo_challenge_submissions WHERE nutzer_id = :user_id AND created_at BETWEEN :start AND :end");
    $stmt->execute(['user_id' => $userId, 'start' => $photoChallengeStart, 'end' => $periodEnd]);
    $counts['photo_challenge_submissions_count'] = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM photo_challenge_votes WHERE nutzer_id = :user_id AND created_at BETWEEN :start AND :end");
    $stmt->execute(['user_id' => $userId, 'start' => $photoChallengeStart, 'end' => $periodEnd]);
    $counts['photo_challenge_votes_count'] = (int)$stmt->fetchColumn();
    $status['photo_challenge_participated'] =
        ($counts['photo_challenge_submissions_count'] + $counts['photo_challenge_votes_count']) > 0;

    $easterEggEp = 0;
    $eggCountForPoints = min($counts['easter_eggs_found'], count($easterEggEpSchedule));
    for ($i = 0; $i < $eggCountForPoints; $i++) {
        $easterEggEp += $easterEggEpSchedule[$i];
    }
    if ($counts['easter_eggs_found'] > count($easterEggEpSchedule)) {
        $easterEggEp += ($counts['easter_eggs_found'] - count($easterEggEpSchedule)) * $easterEggRecurringEp;
    }

    $breakdown = [
        'checkins_base_ep' => $counts['checkins_total'] * 15,
        'checkins_photo_ep' => $counts['checkins_with_photo'] * 5,
        'checkins_on_site_ep' => $counts['checkins_on_site'] * 5,
        'price_reported_ep' => $status['price_reported'] ? 15 : 0,
        'favorite_shop_added_ep' => $status['favorite_shop_added'] ? 5 : 0,
        'invite_registered_ep' => $counts['invited_users_count'] * 20,
        'invite_checkin_ep' => $counts['invited_users_with_checkin_count'] * 60,
        'login_days_ep' => $counts['login_days'] * 5,
        'profile_image_ep' => $status['profile_image'] ? 15 : 0,
        'comment_ep' => min($counts['comments_unique_targets'], 5) * 5,
        'rad_event_page_ep' => $status['rad_event_page_visited'] ? 15 : 0,
        'easter_eggs_ep' => $easterEggEp,
        'new_shop_ep' => min($counts['new_shops_count'], 3) * 15,
        'challenge_completed_ep' => $counts['challenges_completed'] * 45,
        'ice_shop_reviewed_ep' => min($counts['reviews_count'], 3) * 10,
        'route_submitted_ep' => min($counts['routes_count'], 3) * 15,
        'photo_challenge_submission_ep' => $counts['photo_challenge_submissions_count'] * $photoChallengeSubmissionEp,
        'photo_challenge_vote_ep' => $counts['photo_challenge_votes_count'] * $photoChallengeVoteEp,
    ];

    $totalPoints = array_sum($breakdown);
    $mandatoryCompleted = 0;
    foreach ($mandatoryKeys as $key) {
        if (!empty($status[$key])) {
            $mandatoryCompleted += 1;
        }
    }
    $mandatoryTotal = count($mandatoryKeys);
    $bonusCompleted = 0;
    foreach (['new_shop_submitted', 'challenge_completed', 'ice_shop_reviewed', 'route_submitted'] as $bonusKey) {
        if (!empty($status[$bonusKey])) {
            $bonusCompleted += 1;
        }
    }

    return [
        'user_id' => $userId,
        'period' => [
            'start' => $periodStart,
            'end' => $periodEnd,
            'is_active' => false,
            'is_results_only' => true,
        ],
        'campaign_phase' => 'closed',
        'anniversary_unlocked_at' => $eventUnlockDate->format(DateTime::ATOM),
        'eis_tour_registration_open' => false,
        'points' => [
            'total' => $totalPoints,
            'max' => null,
            'breakdown' => $breakdown,
        ],
        'counts' => $counts,
        'mandatory' => [
            'completed' => $mandatoryCompleted,
            'total' => $mandatoryTotal,
        ],
        'status' => $status,
        'reward_unlocked' => $mandatoryCompleted === $mandatoryTotal,
        'extra_ice_reward' => $mandatoryCompleted === $mandatoryTotal,
        'easter_egg_model' => [
            'cooldown_hours' => $eggCooldownHours,
            'ep_schedule_first_finds' => $easterEggEpSchedule,
            'recurring_ep_after_schedule' => $easterEggRecurringEp,
            'next_available_at' => $nextEggAvailableAt,
        ],
        'photo_challenge_model' => [
            'starts_at' => $photoChallengeStart,
            'submission_ep' => $photoChallengeSubmissionEp,
            'vote_ep' => $photoChallengeVoteEp,
        ],
        'birthday_awards' => [
            'award_id' => 57,
            'levels' => [],
        ],
        'read_only' => true,
        'new_awards' => [],
        'archived' => true,
        'leaderboard_entry' => [
            'mandatory_completed' => $mandatoryCompleted,
            'bonus_completed' => $bonusCompleted,
        ],
    ];
}

function computeOlympicsArchivePayload(PDO $pdo, int $userId): array
{
    $periodStart = '2026-02-06 00:00:00';
    $periodEnd = '2026-02-22 23:59:59';
    $points = [
        'login_active' => 0,
        'login_days' => 0,
        'profile_image' => 0,
        'checkins' => 0,
        'prices' => 0,
        'reviews' => 0,
        'comments' => 0,
        'new_shops' => 0,
        'routes' => 0,
        'secret_location' => 0,
        'challenges_completed' => 0,
    ];
    $counts = [
        'checkins' => 0,
        'prices' => 0,
        'reviews' => 0,
        'comments' => 0,
        'new_shops' => 0,
        'routes' => 0,
        'secret_location' => 0,
        'challenges_completed' => 0,
        'login_days' => 0,
    ];

    $stmt = $pdo->prepare("SELECT 1 FROM nutzer WHERE id = :user_id AND last_active_at BETWEEN :start AND :end LIMIT 1");
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    if ($stmt->fetchColumn()) {
        $points['login_active'] = 5;
    }

    $stmt = $pdo->prepare("SELECT 1 FROM user_profile_images WHERE user_id = :user_id AND avatar_path IS NOT NULL AND avatar_path <> '' LIMIT 1");
    $stmt->execute(['user_id' => $userId]);
    if ($stmt->fetchColumn()) {
        $points['profile_image'] = 5;
    }

    foreach ([
        ['checkins', "SELECT COUNT(*) FROM checkins WHERE nutzer_id = :user_id AND datum BETWEEN :start AND :end", 10],
        ['prices', "SELECT COUNT(*) FROM preise WHERE gemeldet_von = :user_id AND gemeldet_am BETWEEN :start AND :end", 5],
        ['reviews', "SELECT COUNT(*) FROM bewertungen WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end", 10],
        ['new_shops', "SELECT COUNT(*) FROM eisdielen WHERE user_id = :user_id AND erstellt_am BETWEEN :start AND :end", 15],
        ['routes', "SELECT COUNT(*) FROM routen WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end", 20],
        ['challenges_completed', "SELECT COUNT(*) FROM challenges WHERE nutzer_id = :user_id AND completed = 1 AND completed_at BETWEEN :start AND :end", 50],
    ] as [$key, $sql, $multiplier]) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
        $counts[$key] = (int)$stmt->fetchColumn();
        if ($counts[$key] > 0) {
            $points[$key] = $counts[$key] * $multiplier;
        }
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM kommentare WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end");
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['comments'] = (int)$stmt->fetchColumn();
    if ($counts['comments'] > 0) {
        $points['comments'] = 5;
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_awards WHERE user_id = :user_id AND award_id = 54 AND level = 3");
    $stmt->execute(['user_id' => $userId]);
    $counts['secret_location'] = (int)$stmt->fetchColumn();
    if ($counts['secret_location'] > 0) {
        $points['secret_location'] = 10;
    }

    $stmt = $pdo->prepare("SELECT login_days FROM olympics_user_progress WHERE user_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $userId]);
    $counts['login_days'] = (int)$stmt->fetchColumn();
    if ($counts['login_days'] > 0) {
        $points['login_days'] = $counts['login_days'] * 2;
    }

    return [
        'user_id' => $userId,
        'period' => [
            'start' => $periodStart,
            'end' => $periodEnd,
        ],
        'points' => [
            'total' => array_sum($points),
            'breakdown' => $points,
        ],
        'counts' => $counts,
        'new_awards' => [],
        'archived' => true,
    ];
}

function archiveBirthdayResults(PDO $pdo, bool $dryRun): int
{
    $stmt = $pdo->query(
        "SELECT bup.user_id, n.username, bup.total_xp, bup.mandatory_completed
         FROM birthday_user_progress bup
         JOIN nutzer n ON n.id = bup.user_id
         ORDER BY bup.total_xp DESC, bup.mandatory_completed DESC, bup.updated_at ASC, bup.user_id ASC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $count = 0;

    foreach ($rows as $index => $row) {
        $payload = computeBirthdayArchivePayload($pdo, (int)$row['user_id']);
        if (!$dryRun) {
            upsertArchivedCampaignResult(
                $pdo,
                'birthday_2026',
                (int)$row['user_id'],
                (string)$row['username'],
                $index + 1,
                (int)$payload['points']['total'],
                $payload,
                '2026-03-22 23:59:59'
            );
        }
        $count++;
    }

    return $count;
}

function archiveOlympicsResults(PDO $pdo, bool $dryRun): int
{
    $stmt = $pdo->query(
        "SELECT oup.user_id, n.username, oup.total_xp
         FROM olympics_user_progress oup
         JOIN nutzer n ON n.id = oup.user_id
         ORDER BY oup.total_xp DESC, oup.updated_at ASC, oup.user_id ASC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $count = 0;

    foreach ($rows as $index => $row) {
        $payload = computeOlympicsArchivePayload($pdo, (int)$row['user_id']);
        if (!$dryRun) {
            upsertArchivedCampaignResult(
                $pdo,
                'olympics_2026',
                (int)$row['user_id'],
                (string)$row['username'],
                $index + 1,
                (int)$payload['points']['total'],
                $payload,
                '2026-02-22 23:59:59'
            );
        }
        $count++;
    }

    return $count;
}

function cleanupLegacySeasonalTables(PDO $pdo, bool $dryRun): array
{
    $drops = [
        'birthday_event_page_visits',
        'birthday_easter_eggs',
        'birthday_user_progress',
        'olympics_user_progress',
    ];

    foreach ($drops as $table) {
        if (!$dryRun) {
            $pdo->exec("DROP TABLE IF EXISTS {$table}");
        }
    }

    return $drops;
}

try {
    ensureSeasonalCampaignResultsTable($pdo);
    $birthdayCount = archiveBirthdayResults($pdo, $dryRun);
    $olympicsCount = archiveOlympicsResults($pdo, $dryRun);
    $dropped = [];
    if ($cleanup) {
        $dropped = cleanupLegacySeasonalTables($pdo, $dryRun);
    }

    echo json_encode([
        'status' => 'success',
        'dry_run' => $dryRun,
        'cleanup' => $cleanup,
        'archived' => [
            'birthday_2026' => $birthdayCount,
            'olympics_2026' => $olympicsCount,
        ],
        'dropped_tables' => $dropped,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
