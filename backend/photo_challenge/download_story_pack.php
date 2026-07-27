<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../lib/photo_challenge_story_stories.php';

$challengeId = isset($_GET['challenge_id']) ? (int)$_GET['challenge_id'] : 0;
$viewerId = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : 0;
$pack = isset($_GET['pack']) ? (string)$_GET['pack'] : 'all';
$allowedPacks = ['groups', 'ko', 'results', 'all'];

function icePhotoChallengeStoryError(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'status' => 'error',
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!$challengeId) {
    icePhotoChallengeStoryError(422, 'Challenge-ID fehlt.');
}

if (!in_array($pack, $allowedPacks, true)) {
    icePhotoChallengeStoryError(422, 'Unbekanntes Story-Paket.');
}

if (!class_exists('ZipArchive')) {
    icePhotoChallengeStoryError(500, 'ZipArchive ist auf dem Server nicht verfügbar.');
}

try {
    ensurePhotoChallengeSchema($pdo);
    requirePhotoChallengeAdmin($viewerId);

    $slides = icePhotoChallengeBuildStorySlides($pdo, $challengeId, $pack);
    $challenge = getChallengeById($pdo, $challengeId);
    $challengeSlug = icePhotoChallengeSlug((string)($challenge['title'] ?? ('challenge_' . $challengeId)));
    $zipPath = tempnam(sys_get_temp_dir(), 'ice_photo_challenge_stories_');
    if ($zipPath === false) {
        throw new RuntimeException('Temporäre ZIP-Datei konnte nicht erstellt werden.');
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::OVERWRITE) !== true) {
        @unlink($zipPath);
        throw new RuntimeException('ZIP-Datei konnte nicht geöffnet werden.');
    }

    foreach ($slides as $slide) {
        $filename = preg_replace('/[^a-zA-Z0-9_.-]/', '_', (string)$slide['filename']);
        ob_start();
        imagepng($slide['image']);
        $pngData = ob_get_clean();
        imagedestroy($slide['image']);
        if ($pngData === false || $pngData === '') {
            continue;
        }
        $zip->addFromString($filename, $pngData);
    }
    $zip->close();

    if (!is_file($zipPath) || filesize($zipPath) === 0) {
        @unlink($zipPath);
        throw new RuntimeException('Es konnten keine Story-PNGs erzeugt werden.');
    }

    $downloadName = sprintf('ice_foto_challenge_%s_%s_stories.zip', $challengeSlug, $pack);
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Content-Length: ' . filesize($zipPath));
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    readfile($zipPath);
    @unlink($zipPath);
    exit;
} catch (Throwable $e) {
    icePhotoChallengeStoryError(500, $e->getMessage());
}
