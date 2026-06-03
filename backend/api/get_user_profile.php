<?php
require_once '../db_connect.php';
require_once '../lib/auth.php';
require_once '../lib/user_profile.php';
header('Content-Type: application/json');

$authData = requireAuth($pdo);
$userId = (int)$authData['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    return;
}

try {
    ensureUserProfileColumns($pdo);

    $stmt = $pdo->prepare("
        SELECT instagram_account, strava_account, onboarding_completed_at, onboarding_dismissed_at
        FROM nutzer
        WHERE id = :id
    ");
    $stmt->execute(['id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $activityStmt = $pdo->prepare("
            SELECT
                (SELECT COUNT(*) FROM checkins WHERE nutzer_id = :user_id_checkins) AS checkins_count,
                (SELECT COUNT(*) FROM bewertungen WHERE nutzer_id = :user_id_reviews) AS reviews_count,
                (SELECT COUNT(*) FROM routen WHERE nutzer_id = :user_id_routes) AS routes_count
        ");
        $activityStmt->execute([
            'user_id_checkins' => $userId,
            'user_id_reviews' => $userId,
            'user_id_routes' => $userId,
        ]);
        $activity = $activityStmt->fetch(PDO::FETCH_ASSOC) ?: [];
        $checkinsCount = (int)($activity['checkins_count'] ?? 0);
        $reviewsCount = (int)($activity['reviews_count'] ?? 0);
        $routesCount = (int)($activity['routes_count'] ?? 0);

        $row['onboarding_eligible'] = empty($row['onboarding_completed_at'])
            && $checkinsCount <= 1
            && $reviewsCount <= 0
            && $routesCount <= 0;
        $row['onboarding_activity'] = [
            'checkins' => $checkinsCount,
            'bewertungen' => $reviewsCount,
            'routen' => $routesCount,
        ];
        echo json_encode($row);
    } else {
        echo json_encode([
            'instagram_account' => null,
            'strava_account' => null,
            'onboarding_completed_at' => null,
            'onboarding_dismissed_at' => null,
            'onboarding_eligible' => false,
            'onboarding_activity' => [
                'checkins' => 0,
                'bewertungen' => 0,
                'routen' => 0,
            ],
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
