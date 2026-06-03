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

    ensureUserProfileTable($pdo);

    $stmt = $pdo->prepare("
        SELECT n.instagram_account,
               n.strava_account,
               n.current_level,
               up.show_level_badge,
               up.avatar_frame_key
        FROM nutzer n
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE n.id = :id
    ");
    $stmt->execute(['id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $currentLevel = (int)($row['current_level'] ?? 0);
        $frameKey = $row['avatar_frame_key'] ?? null;
        if ($frameKey !== null && !isAvatarFrameUnlocked($frameKey, $currentLevel)) {
            $frameKey = null;
        }
        $row['current_level'] = $currentLevel;
        $row['show_level_badge'] = (int)($row['show_level_badge'] ?? 0);
        $row['avatar_frame_key'] = $frameKey;
        $row['available_avatar_frames'] = getAvailableAvatarFrames($currentLevel);
        echo json_encode($row);
    } else {
        echo json_encode([
            'instagram_account' => null,
            'strava_account' => null,
            'current_level' => 0,
            'show_level_badge' => 0,
            'avatar_frame_key' => null,
            'available_avatar_frames' => getAvailableAvatarFrames(0),
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
