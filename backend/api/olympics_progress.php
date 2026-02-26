<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../evaluators/OlympicsChallengeEvaluator.php';

$userId = intval($_GET['user_id'] ?? $_GET['nutzer_id'] ?? 0);
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id fehlt oder ungültig']);
    exit;
}

$periodStart = '2026-02-06 00:00:00';
$periodEnd = '2026-02-22 23:59:59';
date_default_timezone_set('Europe/Berlin');

try {
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
        'referred_users_registered' => 0,
        'referred_users_checked_in' => 0,
    ];
    // XP für geworbene Nutzer: 5 XP für Registrierung, 60 XP für ersten Check-in
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM nutzer WHERE invited_by = :user_id AND is_verified = 1 AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['referred_users_registered'] = (int)$stmt->fetchColumn();
    $referredXp = $counts['referred_users_registered'] * 5;

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM nutzer n WHERE n.invited_by = :user_id AND n.is_verified = 1 AND EXISTS (SELECT 1 FROM checkins c WHERE c.nutzer_id = n.id AND c.datum BETWEEN :start AND :end) AND n.erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['referred_users_checked_in'] = (int)$stmt->fetchColumn();
    $referredXp += $counts['referred_users_checked_in'] * 60;

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
    $counts['checkins'] = (int)$stmt->fetchColumn();
    if ($counts['checkins'] > 0) {
        $points['checkins'] = $counts['checkins'] * 10;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM preise WHERE gemeldet_von = :user_id AND gemeldet_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['prices'] = (int)$stmt->fetchColumn();
    if ($counts['prices'] > 0) {
        $points['prices'] = $counts['prices'] * 5;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM bewertungen WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['reviews'] = (int)$stmt->fetchColumn();
    if ($counts['reviews'] > 0) {
        $points['reviews'] = $counts['reviews'] * 10;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM kommentare WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['comments'] = (int)$stmt->fetchColumn();
    if ($counts['comments'] > 0) {
        $points['comments'] = 5;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM eisdielen WHERE user_id = :user_id AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['new_shops'] = (int)$stmt->fetchColumn();
    if ($counts['new_shops'] > 0) {
        $points['new_shops'] = $counts['new_shops'] * 15;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM routen WHERE nutzer_id = :user_id AND erstellt_am BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['routes'] = (int)$stmt->fetchColumn();
    if ($counts['routes'] > 0) {
        $points['routes'] = $counts['routes'] * 20;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM user_awards WHERE user_id = :user_id AND award_id = 54 AND level = 3"
    );
    $stmt->execute(['user_id' => $userId]);
    $counts['secret_location'] = (int)$stmt->fetchColumn();
    if ($counts['secret_location'] > 0) {
        $points['secret_location'] = 10;
    }

    $now = new DateTime('now');
    $startDate = new DateTime($periodStart);
    $endDate = new DateTime($periodEnd);
    $today = $now->format('Y-m-d');
    $inPeriod = ($now >= $startDate && $now <= $endDate);

    $stmt = $pdo->prepare(
        "SELECT login_days, last_login_date FROM olympics_user_progress WHERE user_id = :user_id LIMIT 1"
    );
    $stmt->execute(['user_id' => $userId]);
    $progressRow = $stmt->fetch(PDO::FETCH_ASSOC);

    $loginDays = 0;
    $lastLoginDate = null;
    if ($progressRow) {
        $loginDays = (int)$progressRow['login_days'];
        $lastLoginDate = $progressRow['last_login_date'];
    }

    if ($inPeriod && $today !== $lastLoginDate) {
        $loginDays += 1;
        $lastLoginDate = $today;
    }

    $counts['login_days'] = $loginDays;
    if ($loginDays > 0) {
        $points['login_days'] = $loginDays * 2;
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM challenges WHERE nutzer_id = :user_id AND completed = 1 AND completed_at BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $counts['challenges_completed'] = (int)$stmt->fetchColumn();
    if ($counts['challenges_completed'] > 0) {
        $points['challenges_completed'] = $counts['challenges_completed'] * 50;
    }

    $totalPoints = array_sum($points);

    $stmt = $pdo->prepare(
        "INSERT INTO olympics_user_progress (user_id, total_xp, login_days, last_login_date)
         VALUES (:user_id, :total_xp, :login_days, :last_login_date)
         ON DUPLICATE KEY UPDATE total_xp = VALUES(total_xp), login_days = VALUES(login_days), last_login_date = VALUES(last_login_date)"
    );
    $stmt->execute([
        'user_id' => $userId,
        'total_xp' => $totalPoints,
        'login_days' => $loginDays,
        'last_login_date' => $lastLoginDate,
    ]);

    $newAwards = [];
    try {
        $evaluator = new OlympicsChallengeEvaluator($totalPoints);
        $newAwards = $evaluator->evaluate($userId);
    } catch (Exception $e) {
        error_log("Fehler beim OlympicsChallengeEvaluator: " . $e->getMessage());
    }

    echo json_encode([
        'total_xp' => $totalPoints,
        'breakdown' => $points,
        'new_awards' => $newAwards,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
