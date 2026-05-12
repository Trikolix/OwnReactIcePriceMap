<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/user_profile.php';
require_once __DIR__ . '/../lib/preset_avatars.php';
require_once __DIR__ . '/../lib/image_upload.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/levelsystem.php';
require_once __DIR__ . '/../evaluators/ProfileAvatarEvaluator.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

function deleteUploadedAvatarIfOwned(?string $path): void {
    if (!$path) {
        return;
    }
    $uploadsPrefix = 'uploads/user_avatars/';
    if (strncmp($path, $uploadsPrefix, strlen($uploadsPrefix)) !== 0) {
        return;
    }

    $absolute = __DIR__ . '/../../' . ltrim($path, '/');
    if (file_exists($absolute)) {
        @unlink($absolute);
    }
}

function evaluateProfileAvatarAwardResponse(PDO $pdo, int $userId, ?string $avatarPath): array {
    $evaluator = new ProfileAvatarEvaluator();
    $newAwards = $evaluator->evaluate($userId);
    $levelChange = updateUserLevelIfChanged($pdo, $userId);

    return [
        'success' => true,
        'avatar_path' => $avatarPath,
        'new_awards' => $newAwards,
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => ($levelChange['level_up'] ?? false) ? ($levelChange['new_level'] ?? null) : null,
        'current_level' => $levelChange['new_level'] ?? null,
        'level_name' => ($levelChange['level_up'] ?? false) ? ($levelChange['level_name'] ?? null) : null,
    ];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST Anfragen erlaubt']);
    exit;
}

if ($currentUserId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültige Nutzer-ID']);
    exit;
}

$uploadDir = __DIR__ . '/../../uploads/user_avatars/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$currentPath = getUserAvatarPath($pdo, $currentUserId);

if (!empty($_POST['remove_avatar'])) {
    deleteUploadedAvatarIfOwned($currentPath);
    setUserAvatarPath($pdo, $currentUserId, null);
    echo json_encode(['success' => true, 'avatar_path' => null, 'new_awards' => []]);
    exit;
}

if (!empty($_POST['preset_avatar'])) {
    $selectedPreset = trim((string) $_POST['preset_avatar']);
    $preset = findPresetAvatarByPath($selectedPreset);
    if (!$preset) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiges Preset-Bild']);
        exit;
    }

    $levelStmt = $pdo->prepare("SELECT current_level FROM nutzer WHERE id = ? LIMIT 1");
    $levelStmt->execute([$currentUserId]);
    $currentLevel = (int)($levelStmt->fetchColumn() ?: 0);
    $requiredLevel = (int)($preset['min_level'] ?? 0);
    if ($currentLevel < $requiredLevel) {
        http_response_code(403);
        echo json_encode(['error' => 'Dieser Avatar ist erst ab Level ' . $requiredLevel . ' verfügbar.']);
        exit;
    }

    deleteUploadedAvatarIfOwned($currentPath);
    setUserAvatarPath($pdo, $currentUserId, $selectedPreset);
    echo json_encode(evaluateProfileAvatarAwardResponse($pdo, $currentUserId, $selectedPreset));
    exit;
}

if (!isset($_FILES['avatar']) || !is_uploaded_file($_FILES['avatar']['tmp_name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Keine Datei hochgeladen']);
    exit;
}

$file = $_FILES['avatar'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload fehlgeschlagen']);
    exit;
}

$allowedMime = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$mime = mime_content_type($file['tmp_name']);
if (!isset($allowedMime[$mime])) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültiges Dateiformat']);
    exit;
}

$filename = sprintf('user_%d_%s.jpg', $currentUserId, uniqid('', true));
$targetPath = $uploadDir . $filename;

try {
    resizeImage($file['tmp_name'], $targetPath, 1200, 80);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Bildverarbeitung fehlgeschlagen: ' . $e->getMessage()]);
    exit;
}

deleteUploadedAvatarIfOwned($currentPath);

$relativePath = 'uploads/user_avatars/' . $filename;
setUserAvatarPath($pdo, $currentUserId, $relativePath);

echo json_encode(evaluateProfileAvatarAwardResponse($pdo, $currentUserId, $relativePath));
