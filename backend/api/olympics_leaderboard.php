<?php
require_once __DIR__ . '/../db_connect.php';

$userId = intval($_GET['user_id'] ?? $_GET['nutzer_id'] ?? 0);
$periodStart = '2026-02-06 00:00:00';
$periodEnd = '2026-02-22 23:59:59';

function calculateBreakdownForUser(PDO $pdo, int $userId, string $periodStart, string $periodEnd): array
{
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
        'referred_users' => 0,
    ];

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM nutzer WHERE invited_by = :user_id AND is_verified = 1 AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $referredUsersRegistered = (int)$stmt->fetchColumn();
    $referredXp = $referredUsersRegistered * 5;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM nutzer n WHERE n.invited_by = :user_id AND n.is_verified = 1 AND EXISTS (SELECT 1 FROM checkins c WHERE c.nutzer_id = n.id AND c.datum BETWEEN :start AND :end) AND n.erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $referredUsersCheckedIn = (int)$stmt->fetchColumn();
    $referredXp += $referredUsersCheckedIn * 60;

    if ($referredXp > 0) {
        $points['referred_users'] = $referredXp;
    }

    $stmt = $pdo->prepare(
        "SELECT 1 FROM olympics_user_progress WHERE user_id = :user_id AND total_xp > 0"
    );
    $stmt->execute(['user_id' => $userId]);
    if ($stmt->fetchColumn()) {
        $points['login_active'] = 5;
    }

    $stmt = $pdo->prepare(
        "SELECT 1 FROM user_profile_images WHERE user_id = :user_id AND avatar_path IS NOT NULL AND avatar_path <> '' LIMIT 1"
    );
    $stmt->execute(['user_id' => $userId]);
    if ($stmt->fetchColumn()) {
        $points['profile_image'] = 5;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM checkins WHERE nutzer_id = :user_id AND datum BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $checkins = (int)$stmt->fetchColumn();
    if ($checkins > 0) {
        $points['checkins'] = $checkins * 10;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM preise WHERE gemeldet_von = :user_id AND gemeldet_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $prices = (int)$stmt->fetchColumn();
    if ($prices > 0) {
        $points['prices'] = $prices * 5;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM bewertungen WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $reviews = (int)$stmt->fetchColumn();
    if ($reviews > 0) {
        $points['reviews'] = $reviews * 10;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM kommentare WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $comments = (int)$stmt->fetchColumn();
    if ($comments > 0) {
        $points['comments'] = 5;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM eisdielen WHERE user_id = :user_id AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $newShops = (int)$stmt->fetchColumn();
    if ($newShops > 0) {
        $points['new_shops'] = $newShops * 15;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM routen WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $routes = (int)$stmt->fetchColumn();
    if ($routes > 0) {
        $points['routes'] = $routes * 20;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM user_awards WHERE user_id = :user_id AND award_id = 54 AND level = 3"
    );
    $stmt->execute(['user_id' => $userId]);
    $secretLocation = (int)$stmt->fetchColumn();
    if ($secretLocation > 0) {
        $points['secret_location'] = 10;
    }

    $stmt = $pdo->prepare(
        "SELECT login_days FROM olympics_user_progress WHERE user_id = :user_id LIMIT 1"
    );
    $stmt->execute(['user_id' => $userId]);
    $loginDays = (int)($stmt->fetchColumn() ?: 0);
    if ($loginDays > 0) {
        $points['login_days'] = $loginDays * 2;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM challenges WHERE nutzer_id = :user_id AND completed = 1 AND completed_at BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $challengesCompleted = (int)$stmt->fetchColumn();
    if ($challengesCompleted > 0) {
        $points['challenges_completed'] = $challengesCompleted * 50;
    }

    return [
        'total_xp' => array_sum($points),
        'breakdown' => $points,
    ];
}

try {
    $stmt = $pdo->prepare(
        "SELECT oup.user_id, n.username, oup.total_xp
         FROM olympics_user_progress oup
         JOIN nutzer n ON n.id = oup.user_id
         ORDER BY oup.total_xp DESC, oup.updated_at ASC, oup.user_id ASC"
    );
    $stmt->execute();
    $topRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $leaderboard = [];
    $currentRank = 0;
    $lastXp = null;
    foreach ($topRows as $index => $row) {
        $xp = (int)$row['total_xp'];
        if ($lastXp === null || $xp < $lastXp) {
            $currentRank = $index + 1;
            $lastXp = $xp;
        }
        $leaderboard[] = [
            'rank' => $currentRank,
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'total_xp' => $xp,
        ];
    }

    $userRank = null;
    if ($userId > 0) {
        $stmt = $pdo->prepare(
            "SELECT total_xp FROM olympics_user_progress WHERE user_id = :user_id LIMIT 1"
        );
        $stmt->execute(['user_id' => $userId]);
        $userXp = $stmt->fetchColumn();

        if ($userXp !== false) {
            $userXp = (int)$userXp;
            $stmt = $pdo->prepare(
                "SELECT COUNT(DISTINCT total_xp) FROM olympics_user_progress WHERE total_xp > :xp"
            );
            $stmt->execute(['xp' => $userXp]);
            $higherDistinct = (int)$stmt->fetchColumn();
            $userRank = [
                'rank' => $higherDistinct + 1,
                'user_id' => $userId,
                'total_xp' => $userXp,
            ];
        }
    }

    $breakdowns = [];
    foreach ($leaderboard as $entry) {
        $uid = (int)$entry['user_id'];
        $breakdowns[$uid] = calculateBreakdownForUser($pdo, $uid, $periodStart, $periodEnd);
    }

    echo json_encode([
        'leaderboard' => $leaderboard,
        'user_rank' => $userRank,
        'breakdowns' => $breakdowns,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
