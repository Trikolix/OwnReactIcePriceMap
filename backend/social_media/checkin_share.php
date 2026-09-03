<?php
ob_start();
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../lib/social_media_stories.php';

function checkinShareError(int $status, string $message): void
{
    if (ob_get_length()) ob_clean();
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'error', 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

$auth = requireAuth($pdo);
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if (!in_array($method, ['GET', 'POST'], true)) {
    checkinShareError(405, 'Nur GET und POST sind erlaubt.');
}

$input = $method === 'GET' ? $_GET : json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = [];
}
$checkinId = (int)($input['checkin_id'] ?? 0);
if ($checkinId <= 0) {
    checkinShareError(422, 'Eine gültige Check-in-ID ist erforderlich.');
}

$candidate = socialMediaFetchCheckinCandidate($pdo, $checkinId);
if (!$candidate) {
    checkinShareError(404, 'Check-in wurde nicht gefunden.');
}
if ((int)$candidate['user_id'] !== (int)$auth['user_id']) {
    checkinShareError(403, 'Du kannst nur eigene Check-ins als Story teilen.');
}

if ($method === 'GET') {
    if (ob_get_length()) ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'success',
        'data' => [
            'checkin_id' => $candidate['checkin_id'],
            'username' => $candidate['username'],
            'shop_name' => $candidate['shop_name'],
            'checkin_date' => $candidate['checkin_date'],
            'images' => $candidate['images'],
            'awards' => $candidate['awards'],
            'slides' => [
                'photo' => !empty($candidate['images']),
                'review' => true,
            ],
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$slide = (string)($input['slide'] ?? 'review');
if (!in_array($slide, ['photo', 'review'], true)) {
    checkinShareError(422, 'Ungültige Story-Folie.');
}
$includeAwards = filter_var($input['include_awards'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) !== false;
if (!$includeAwards) {
    $candidate['awards'] = [];
}

if ($slide === 'photo') {
    $imageId = (int)($input['image_id'] ?? 0);
    $selectedImage = null;
    foreach ($candidate['images'] as $image) {
        if ((int)$image['image_id'] === $imageId || ($imageId === 0 && $selectedImage === null)) {
            $selectedImage = $image;
            if ($imageId > 0) {
                break;
            }
        }
    }
    if (!$selectedImage) {
        checkinShareError(422, 'Das ausgewählte Foto gehört nicht zu diesem Check-in.');
    }
    $candidate['image_id'] = $selectedImage['image_id'];
    $candidate['image_url'] = $selectedImage['image_url'];
}

try {
    $image = $slide === 'photo'
        ? iceSocialMediaRenderPhotoSlide($candidate, 'story', 'composite')
        : iceSocialMediaRenderReviewSlide($candidate, 'story');
    ob_start();
    imagepng($image, null, 7);
    $png = ob_get_clean();
    imagedestroy($image);
    if (!is_string($png) || $png === '') {
        throw new RuntimeException('Story-PNG konnte nicht erzeugt werden.');
    }

    $slug = iceSocialMediaSlug((string)$candidate['shop_name']);
    $filename = sprintf('ice-story-%s-%d-%s.png', $slide, $checkinId, $slug);
    if (ob_get_length()) ob_clean();
    header('Content-Type: image/png');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($png));
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo $png;
    exit;
} catch (Throwable $e) {
    checkinShareError(500, $e->getMessage());
}

