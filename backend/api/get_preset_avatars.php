<?php
require_once __DIR__ . '/../lib/preset_avatars.php';
require_once __DIR__ . '/../lib/auth.php';
require_once  __DIR__ . '/../db_connect.php';

$authData = authenticateRequest($pdo);
$currentLevel = 0;
if ($authData) {
    $stmt = $pdo->prepare("SELECT current_level FROM nutzer WHERE id = ? LIMIT 1");
    $stmt->execute([(int)$authData['user_id']]);
    $currentLevel = (int)($stmt->fetchColumn() ?: 0);
}

$avatars = listPresetAvatars($currentLevel);
echo json_encode([
    'avatars' => $avatars,
    'current_level' => $currentLevel,
]);
