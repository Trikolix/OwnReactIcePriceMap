<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/tour_de_glace_story_stories.php';

function iceTourDeGlaceStoryError(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'status' => 'error',
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$auth = requireAuth($pdo);
if ((int)($auth['user_id'] ?? 0) !== 1) {
    iceTourDeGlaceStoryError(403, 'Kein Zugriff.');
}

$pack = isset($_GET['pack']) ? (string)$_GET['pack'] : 'all';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
if (!in_array($pack, ['rankings', 'participation', 'all'], true)) {
    iceTourDeGlaceStoryError(422, 'Unbekanntes Story-Paket.');
}
if (!class_exists('ZipArchive')) {
    iceTourDeGlaceStoryError(500, 'ZipArchive ist auf dem Server nicht verfügbar.');
}

try {
    $slides = iceTourDeGlaceBuildStorySlides($pdo, $pack, $limit);
    if (empty($slides)) {
        throw new RuntimeException('Es konnten keine Tour-de-Glace-Storys erzeugt werden.');
    }

    $zipPath = tempnam(sys_get_temp_dir(), 'ice_tour_de_glace_stories_');
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
        if ($pngData !== false && $pngData !== '') {
            $zip->addFromString($filename, $pngData);
        }
    }
    $zip->close();

    if (!is_file($zipPath) || filesize($zipPath) === 0) {
        @unlink($zipPath);
        throw new RuntimeException('ZIP-Datei ist leer.');
    }

    $downloadName = sprintf('ice_tour_de_glace_%s_stories.zip', $pack);
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Content-Length: ' . filesize($zipPath));
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    readfile($zipPath);
    @unlink($zipPath);
    exit;
} catch (Throwable $e) {
    iceTourDeGlaceStoryError(500, $e->getMessage());
}
