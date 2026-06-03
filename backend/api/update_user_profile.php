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
$hasShowLevelBadgeInput = array_key_exists('show_level_badge', $data);
$hasAvatarFrameInput = array_key_exists('avatar_frame_key', $data);

try {
    ensureUserProfileColumns($pdo);
    ensureUserProfileTable($pdo);

    $existingImageSettings = getUserProfileImageSettings($pdo, $userId);
    $showLevelBadge = $hasShowLevelBadgeInput
        ? (!empty($data['show_level_badge']) ? 1 : 0)
        : (int)$existingImageSettings['show_level_badge'];
    $avatarFrameKey = $hasAvatarFrameInput
        ? trim((string)$data['avatar_frame_key'])
        : ($existingImageSettings['avatar_frame_key'] ?? null);
    $avatarFrameKey = ($avatarFrameKey === '' || $avatarFrameKey === 'none') ? null : $avatarFrameKey;

    $levelStmt = $pdo->prepare("SELECT current_level FROM nutzer WHERE id = :id LIMIT 1");
    $levelStmt->execute(['id' => $userId]);
    $currentLevel = (int)($levelStmt->fetchColumn() ?: 0);

    if ($avatarFrameKey !== null && !isAvatarFrameUnlocked($avatarFrameKey, $currentLevel)) {
        http_response_code(400);
        echo json_encode(['error' => 'Dieser Rahmen ist fuer dein Level noch nicht verfuegbar.']);
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
        setUserAvatarDecoration($pdo, $userId, $showLevelBadge, $avatarFrameKey);
        echo json_encode([
            'success' => true,
            'current_level' => $currentLevel,
            'show_level_badge' => $showLevelBadge,
            'avatar_frame_key' => $avatarFrameKey,
            'available_avatar_frames' => getAvailableAvatarFrames($currentLevel),
        ]);
    } else {
        echo json_encode(['error' => 'Update failed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
