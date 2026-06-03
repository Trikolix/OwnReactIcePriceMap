<?php
require_once '../db_connect.php';
require_once '../lib/auth.php';
require_once '../lib/user_profile.php';
header('Content-Type: application/json');

$authData = requireAuth($pdo);
$userId = (int)$authData['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    return;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    echo json_encode(['error' => 'Invalid JSON']);
    return;
}

$instagramAccount = isset($data['instagram_account']) ? trim($data['instagram_account']) : null;
$stravaAccount = isset($data['strava_account']) ? trim($data['strava_account']) : null;
$onboardingAction = isset($data['onboarding_action']) ? trim((string)$data['onboarding_action']) : null;

try {
    ensureUserProfileColumns($pdo);

    if ($onboardingAction !== null) {
        if ($onboardingAction === 'complete') {
            $stmt = $pdo->prepare("
                UPDATE nutzer
                SET onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
                    onboarding_dismissed_at = COALESCE(onboarding_dismissed_at, NOW())
                WHERE id = :id
            ");
        } elseif ($onboardingAction === 'dismiss') {
            $stmt = $pdo->prepare("
                UPDATE nutzer
                SET onboarding_dismissed_at = NOW()
                WHERE id = :id
            ");
        } else {
            http_response_code(422);
            echo json_encode(['error' => 'Invalid onboarding_action']);
            return;
        }

        $success = $stmt->execute(['id' => $userId]);
        echo json_encode($success ? ['success' => true] : ['error' => 'Update failed']);
        return;
    }

    $stmt = $pdo->prepare("
        UPDATE nutzer
        SET instagram_account = :instagram_account,
            strava_account = :strava_account
        WHERE id = :id
    ");

    $success = $stmt->execute([
        'instagram_account' => $instagramAccount,
        'strava_account' => $stravaAccount,
        'id' => $userId
    ]);

    if ($success) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Update failed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
