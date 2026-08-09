<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../lib/social_media_stories.php';

requireSocialMediaAdmin($pdo);

function socialMediaDownloadError(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'error', 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = $_POST;
if (empty($input)) {
    $decoded = json_decode(file_get_contents('php://input'), true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
}

$imageIds = $input['image_ids'] ?? [];
if (!is_array($imageIds)) {
    $imageIds = [$imageIds];
}
$imageIds = array_values(array_unique(array_filter(array_map('intval', $imageIds), static function ($id) {
    return $id > 0;
})));
$imageIds = array_slice($imageIds, 0, 50);
$format = (string)($input['format'] ?? 'story');
$mode = (string)($input['mode'] ?? 'composite');
$requestedSlide = (string)($input['slide'] ?? 'all');
$includeReviewSlide = filter_var($input['include_review_slide'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
$includeReviewSlide = $includeReviewSlide !== false;
$single = filter_var($input['single'] ?? false, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === true;

if (!$imageIds) {
    socialMediaDownloadError(422, 'Bitte mindestens ein Bild auswählen.');
}
if (!in_array($format, ['story', 'feed'], true) || !in_array($mode, ['composite', 'overlay'], true) || !in_array($requestedSlide, ['all', 'photo', 'review'], true)) {
    socialMediaDownloadError(422, 'Ungültiges Exportformat.');
}
$zipPath = null;
$createdImages = [];
try {
    $slides = [];
    $skipped = [];
    foreach ($imageIds as $imageId) {
        $candidate = socialMediaFetchCandidate($pdo, $imageId);
        if (!$candidate) {
            continue;
        }

        try {
            $candidateSlides = iceSocialMediaBuildSlides(
                $candidate,
                $format,
                $mode,
                $requestedSlide === 'review' || ($requestedSlide === 'all' && $includeReviewSlide)
            );
            foreach ($candidateSlides as $slide) {
                $isReviewSlide = strpos((string)$slide['filename'], '02_checkin_') === 0;
                if ($requestedSlide === 'photo' && $isReviewSlide) {
                    imagedestroy($slide['image']);
                    continue;
                }
                if ($requestedSlide === 'review' && !$isReviewSlide) {
                    imagedestroy($slide['image']);
                    continue;
                }
                $slides[] = $slide;
            }
        } catch (Throwable $e) {
            $skipped[] = sprintf('Bild #%d (%s): %s', $imageId, $candidate['shop_name'], $e->getMessage());
        }
    }

    if (!$slides) {
        socialMediaDownloadError(422, $requestedSlide === 'review'
            ? 'Für dieses Bild ist kein Karten-/Bewertungs-Slide verfügbar.'
            : 'Es wurden keine verarbeitbaren Bilder ausgewählt.');
    }

    if ($single && count($slides) === 1) {
        $slide = $slides[0];
        ob_start();
        imagepng($slide['image'], null, 7);
        $pngData = ob_get_clean();
        imagedestroy($slide['image']);
        if ($pngData === false || $pngData === '') {
            socialMediaDownloadError(500, 'PNG konnte nicht erzeugt werden.');
        }
        $downloadName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', (string)$slide['filename']);
        header('Content-Type: image/png');
        header('Content-Disposition: attachment; filename="' . $downloadName . '"');
        header('Content-Length: ' . strlen($pngData));
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        echo $pngData;
        exit;
    }

    if (!class_exists('ZipArchive')) {
        socialMediaDownloadError(500, 'ZipArchive ist auf dem Server nicht verfügbar.');
    }

    $zipPath = tempnam(sys_get_temp_dir(), 'ice_social_media_');
    if ($zipPath === false) {
        throw new RuntimeException('Temporäre ZIP-Datei konnte nicht erstellt werden.');
    }
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::OVERWRITE) !== true) {
        throw new RuntimeException('ZIP-Datei konnte nicht geöffnet werden.');
    }

    foreach ($slides as $slide) {
        ob_start();
        imagepng($slide['image'], null, 7);
        $pngData = ob_get_clean();
        imagedestroy($slide['image']);
        if ($pngData !== false && $pngData !== '') {
            $zip->addFromString(preg_replace('/[^a-zA-Z0-9_.-]/', '_', (string)$slide['filename']), $pngData);
        }
    }
    if (!empty($skipped)) {
        $zip->addFromString('_hinweise.txt', "Nicht verarbeitet:\n\n" . implode("\n", $skipped) . "\n");
    }
    $zip->close();

    if (!is_file($zipPath) || filesize($zipPath) <= 0) {
        throw new RuntimeException('Es konnten keine PNGs erzeugt werden.');
    }

    $downloadName = sprintf('ice_instagram_%s_%s.zip', $format, date('Y-m-d'));
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Content-Length: ' . filesize($zipPath));
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    readfile($zipPath);
    @unlink($zipPath);
    exit;
} catch (Throwable $e) {
    foreach ($createdImages as $image) {
        if (is_resource($image)) {
            imagedestroy($image);
        }
    }
    if ($zipPath && is_file($zipPath)) {
        @unlink($zipPath);
    }
    socialMediaDownloadError(500, $e->getMessage());
}
