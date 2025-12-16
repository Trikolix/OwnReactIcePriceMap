<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/user_profile.php';
require_once __DIR__ . '/../lib/preset_avatars.php';
require_once __DIR__ . '/../lib/image_upload.php';
require_once __DIR__ . '/../lib/auth.php';

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

$presetAvatarPaths = listPresetAvatarPaths();

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
    echo json_encode(['success' => true, 'avatar_path' => null]);
    exit;
}

if (!empty($_POST['preset_avatar'])) {
    $selectedPreset = trim((string) $_POST['preset_avatar']);
    if (!in_array($selectedPreset, $presetAvatarPaths, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiges Preset-Bild']);
        exit;
    }

    deleteUploadedAvatarIfOwned($currentPath);
    setUserAvatarPath($pdo, $currentUserId, $selectedPreset);
    echo json_encode(['success' => true, 'avatar_path' => $selectedPreset]);
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
    // Komprimieren und auf max. 400px begrenzen
    resizeImage($file['tmp_name'], $targetPath, 1200, 80);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Bildverarbeitung fehlgeschlagen: ' . $e->getMessage()]);
    exit;
}

deleteUploadedAvatarIfOwned($currentPath);

$relativePath = 'uploads/user_avatars/' . $filename;
setUserAvatarPath($pdo, $currentUserId, $relativePath);

echo json_encode(['success' => true, 'avatar_path' => $relativePath]);
