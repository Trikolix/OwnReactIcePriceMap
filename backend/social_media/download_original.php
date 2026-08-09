<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../lib/social_media_stories.php';

requireSocialMediaAdmin($pdo);

$input = $_POST;
if (empty($input)) {
    $decoded = json_decode(file_get_contents('php://input'), true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
}

$imageId = (int)($input['image_id'] ?? 0);
$candidate = $imageId > 0 ? socialMediaFetchCandidate($pdo, $imageId) : null;
$path = $candidate ? iceSocialMediaResolveImagePath((string)$candidate['image_url']) : null;

if (!$candidate || !$path) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'error', 'message' => 'Originalbild konnte nicht gefunden werden.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$imageInfo = @getimagesize($path);
$mime = strtolower((string)($imageInfo['mime'] ?? ''));
$extensions = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];
if (!isset($extensions[$mime])) {
    http_response_code(415);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'error', 'message' => 'Bildformat wird nicht unterstützt.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$filename = sprintf('ice_original_%d.%s', $imageId, $extensions[$mime]);
header('Content-Type: ' . $mime);
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . filesize($path));
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
readfile($path);
exit;
