<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../evaluators/BirthdayChallengeEvaluator.php';

$userId = intval($_GET['user_id'] ?? $_GET['nutzer_id'] ?? 0);
$readOnly = in_array(
    strtolower((string)($_GET['readonly'] ?? $_GET['read_only'] ?? '0')),
    ['1', 'true', 'yes', 'on'],
    true
);
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id fehlt oder ungültig']);
    exit;
}

date_default_timezone_set('Europe/Berlin');
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

try {
    $now = new DateTime('now');
    $startDate = new DateTime($periodStart);
    $endDate = new DateTime($periodEnd);
    $eventUnlockDate = new DateTime($anniversaryUnlockAt);
    $inPeriod = ($now >= $startDate && $now <= $endDate);
    $today = $now->format('Y-m-d');

    $campaignPhase = 'closed';
    if ($now < $startDate) {
        $campaignPhase = 'prelaunch';
    } elseif ($now < $eventUnlockDate) {
        $campaignPhase = 'live';
    } elseif ($now <= $endDate) {
        $campaignPhase = 'anniversary';
    }

    $iceTourRegistrationOpen = false;
    $birthdayAwardLevels = [];
    $tableExistsStmt = $pdo->query(
        "SELECT COUNT(*)
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_name = 'event_flags'"
    );
    $eventFlagsTableExists = ((int)$tableExistsStmt->fetchColumn()) > 0;
    if ($eventFlagsTableExists) {
        $flagStmt = $pdo->prepare(
            "SELECT flag_value
             FROM event_flags
             WHERE event_key = :event_key
               AND flag_key = :flag_key
             ORDER BY id DESC
             LIMIT 1"
        );
        $flagStmt->execute([
            'event_key' => 'birthday_2026',
            'flag_key' => 'eis_tour_registration_open',
        ]);
        $rawFlagValue = $flagStmt->fetchColumn();
        if ($rawFlagValue !== false && $rawFlagValue !== null) {
            $normalizedFlag = strtolower((string)$rawFlagValue);
            $iceTourRegistrationOpen = in_array($normalizedFlag, ['1', 'true', 'yes', 'on'], true);
        }
    }

    $stmt = $pdo->prepare(
        "SELECT level, threshold, icon_path, title_de
         FROM award_levels
         WHERE award_id = :award_id
         ORDER BY threshold ASC, level ASC"
    );
    $stmt->execute(['award_id' => 57]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $awardRow) {
        $birthdayAwardLevels[] = [
            'level' => (int)($awardRow['level'] ?? 0),
            'threshold' => (int)($awardRow['threshold'] ?? 0),
            'icon_path' => (string)($awardRow['icon_path'] ?? ''),
            'title' => (string)($awardRow['title_de'] ?? ''),
        ];
    }

    $status = [];
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

    $stmt = $pdo->prepare(
        "SELECT
            COUNT(*) AS checkins_total,
            SUM(
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM bilder b
                        WHERE b.checkin_id = checkins.id
                    ) THEN 1
                    ELSE 0
                END
            ) AS checkins_with_photo,
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
             SELECT 1
             FROM checkins c2
             WHERE c2.group_id = c.group_id
               AND c2.nutzer_id <> :user_id
           )"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['group_checkins_count'] = (int)$stmt->fetchColumn();
    $status['group_checkin_with_other'] = $counts['group_checkins_count'] > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM preise
         WHERE gemeldet_von = :user_id
           AND gemeldet_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $priceReports = (int)$stmt->fetchColumn();
    $status['price_reported'] = $priceReports > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM favoriten
         WHERE nutzer_id = :user_id"
    );
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
             SELECT 1
             FROM checkins c
             WHERE c.nutzer_id = n.id
               AND c.datum BETWEEN :start AND :end
           )"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['invited_users_with_checkin_count'] = (int)$stmt->fetchColumn();
    $status['invited_user_with_checkin'] = $counts['invited_users_with_checkin_count'] > 0;

    $stmt = $pdo->prepare(
        "SELECT 1
         FROM user_profile_images
         WHERE user_id = :user_id
           AND avatar_path IS NOT NULL
           AND avatar_path <> ''
         LIMIT 1"
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

    // Ice-Tour-Seite besucht Event erst ab 14.03. zählen
    if ($now >= $eventUnlockDate) {
        $stmt = $pdo->prepare(
            "SELECT COUNT(*)
             FROM birthday_event_page_visits
             WHERE user_id = :user_id
               AND first_visited_at BETWEEN :start AND :end"
        );
        $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
        $status['rad_event_page_visited'] = ((int)$stmt->fetchColumn()) > 0;
    } else {
        $status['rad_event_page_visited'] = false;
    }

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

    $stmt = $pdo->prepare(
        "SELECT login_days, last_login_date
         FROM birthday_user_progress
         WHERE user_id = :user_id
         LIMIT 1"
    );
    $stmt->execute(['user_id' => $userId]);
    $progressRow = $stmt->fetch(PDO::FETCH_ASSOC);

    $loginDays = 0;
    $lastLoginDate = null;
    if ($progressRow) {
        $loginDays = (int)$progressRow['login_days'];
        $lastLoginDate = $progressRow['last_login_date'];
    }

    if (!$readOnly && $inPeriod && $today !== $lastLoginDate) {
        $loginDays += 1;
        $lastLoginDate = $today;
    }

    $counts['login_days'] = $loginDays;
    $status['login_days_7'] = $loginDays >= 7;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM eisdielen
         WHERE user_id = :user_id
           AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['new_shops_count'] = (int)$stmt->fetchColumn();
    $status['new_shop_submitted'] = $counts['new_shops_count'] > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM challenges
         WHERE nutzer_id = :user_id
           AND completed = 1
           AND completed_at BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['challenges_completed'] = (int)$stmt->fetchColumn();
    $status['challenge_completed'] = $counts['challenges_completed'] > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM bewertungen
         WHERE nutzer_id = :user_id
           AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['reviews_count'] = (int)$stmt->fetchColumn();
    $status['ice_shop_reviewed'] = $counts['reviews_count'] > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM routen
         WHERE nutzer_id = :user_id
           AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['routes_count'] = (int)$stmt->fetchColumn();
    $status['route_submitted'] = $counts['routes_count'] > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM photo_challenge_submissions
         WHERE nutzer_id = :user_id
           AND created_at BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $photoChallengeStart, 'end' => $periodEnd]);
    $counts['photo_challenge_submissions_count'] = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM photo_challenge_votes
         WHERE nutzer_id = :user_id
           AND created_at BETWEEN :start AND :end"
    );
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
    // Eis-Bonus erst ab 14.03. anzeigen
    $extraIceReward = false;
    if ($now >= $eventUnlockDate && $mandatoryCompleted === $mandatoryTotal) {
        $extraIceReward = true;
    }
    $rewardUnlocked = $mandatoryCompleted === $mandatoryTotal;

    $bonusCompleted = 0;
    foreach (['new_shop_submitted', 'challenge_completed', 'ice_shop_reviewed', 'route_submitted'] as $bonusKey) {
        if (!empty($status[$bonusKey])) {
            $bonusCompleted += 1;
        }
    }

    if (!$readOnly) {
        $stmt = $pdo->prepare(
            "INSERT INTO birthday_user_progress (user_id, total_xp, login_days, last_login_date, mandatory_completed, bonus_completed)
             VALUES (:user_id, :total_xp, :login_days, :last_login_date, :mandatory_completed, :bonus_completed)
             ON DUPLICATE KEY UPDATE
               total_xp = VALUES(total_xp),
               login_days = VALUES(login_days),
               last_login_date = VALUES(last_login_date),
               mandatory_completed = VALUES(mandatory_completed),
               bonus_completed = VALUES(bonus_completed)"
        );
        $stmt->execute([
            'user_id' => $userId,
            'total_xp' => $totalPoints,
            'login_days' => $loginDays,
            'last_login_date' => $lastLoginDate,
            'mandatory_completed' => $mandatoryCompleted,
            'bonus_completed' => $bonusCompleted,
        ]);
    }

    $newAwards = [];
    if (!$readOnly) {
        try {
            $evaluator = new BirthdayChallengeEvaluator($totalPoints);
            $newAwards = $evaluator->evaluate($userId);
        } catch (Exception $e) {
            error_log("Fehler beim BirthdayChallengeEvaluator: " . $e->getMessage());
        }
    }

    echo json_encode([
        'user_id' => $userId,
        'period' => [
            'start' => $periodStart,
            'end' => $periodEnd,
            'is_active' => $inPeriod,
            'is_results_only' => ($now > $endDate),
        ],
        'campaign_phase' => $campaignPhase,
        'anniversary_unlocked_at' => $eventUnlockDate->format(DateTime::ATOM),
        'eis_tour_registration_open' => $iceTourRegistrationOpen,
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
        'reward_unlocked' => $rewardUnlocked,
        'extra_ice_reward' => $extraIceReward,
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
            'levels' => $birthdayAwardLevels,
        ],
        'read_only' => $readOnly,
        'new_awards' => $newAwards,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
