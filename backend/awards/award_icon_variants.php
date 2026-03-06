<?php

const AWARD_ICON_VARIANT_MAX_DIM = 512;
const AWARD_ICON_VARIANT_WEBP_QUALITY = 82;

function awardIconVariantRelativePath(string $originalRelativePath, int $maxDim = AWARD_ICON_VARIANT_MAX_DIM): ?string
{
    $originalRelativePath = trim($originalRelativePath);
    if ($originalRelativePath === '') {
        return null;
    }

    $path = parse_url($originalRelativePath, PHP_URL_PATH);
    if (!is_string($path) || $path === '') {
        return null;
    }

    $pathInfo = pathinfo($path);
    if (empty($pathInfo['dirname']) || empty($pathInfo['filename'])) {
        return null;
    }

    $extension = strtolower((string)($pathInfo['extension'] ?? ''));
    if ($extension === 'svg') {
        return null;
    }

    $dirname = $pathInfo['dirname'] === '.' ? '' : $pathInfo['dirname'];
    $filename = $pathInfo['filename'];

    $variantFile = $filename . '__w' . $maxDim . '.webp';
    return ($dirname !== '' ? rtrim($dirname, '/') . '/' : '') . $variantFile;
}

function awardIconProjectRoot(): string
{
    return dirname(__DIR__, 2);
}

function awardIconAbsolutePathFromRelative(string $relativePath): ?string
{
    $path = ltrim(parse_url($relativePath, PHP_URL_PATH) ?? '', '/');
    if ($path === '') {
        return null;
    }

    $absolutePath = awardIconProjectRoot() . '/' . $path;
    return $absolutePath;
}

function awardIconCreateVariant(string $originalRelativePath, bool $force = false, int $maxDim = AWARD_ICON_VARIANT_MAX_DIM, int $quality = AWARD_ICON_VARIANT_WEBP_QUALITY): ?string
{
    if (!extension_loaded('gd') || !function_exists('imagewebp')) {
        throw new RuntimeException('GD mit WebP-Unterstützung ist erforderlich.');
    }

    $variantRelativePath = awardIconVariantRelativePath($originalRelativePath, $maxDim);
    if ($variantRelativePath === null) {
        return null;
    }

    $sourcePath = awardIconAbsolutePathFromRelative($originalRelativePath);
    $targetPath = awardIconAbsolutePathFromRelative($variantRelativePath);

    if ($sourcePath === null || $targetPath === null) {
        return null;
    }

    if (!is_file($sourcePath)) {
        throw new RuntimeException('Originaldatei nicht gefunden: ' . $sourcePath);
    }

    if (!$force && is_file($targetPath)) {
        return $variantRelativePath;
    }

    $targetDir = dirname($targetPath);
    if (!is_dir($targetDir) && !@mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
        throw new RuntimeException('Konnte Zielordner nicht erstellen: ' . $targetDir);
    }

    [$srcImage, $srcWidth, $srcHeight, $mime] = awardIconLoadImageResource($sourcePath);

    try {
        [$targetWidth, $targetHeight] = awardIconCalculateTargetSize($srcWidth, $srcHeight, $maxDim);
        $dstImage = imagecreatetruecolor($targetWidth, $targetHeight);
        if ($dstImage === false) {
            throw new RuntimeException('Konnte Zielbild nicht erzeugen.');
        }

        try {
            if ($mime === 'image/png' || $mime === 'image/webp') {
                imagealphablending($dstImage, false);
                imagesavealpha($dstImage, true);
                $transparent = imagecolorallocatealpha($dstImage, 0, 0, 0, 127);
                imagefilledrectangle($dstImage, 0, 0, $targetWidth, $targetHeight, $transparent);
            } else {
                $white = imagecolorallocate($dstImage, 255, 255, 255);
                imagefilledrectangle($dstImage, 0, 0, $targetWidth, $targetHeight, $white);
            }

            imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $targetWidth, $targetHeight, $srcWidth, $srcHeight);

            if (!imagewebp($dstImage, $targetPath, $quality)) {
                throw new RuntimeException('Konnte WebP-Datei nicht schreiben: ' . $targetPath);
            }
        } finally {
            imagedestroy($dstImage);
        }
    } finally {
        imagedestroy($srcImage);
    }

    return $variantRelativePath;
}

function awardIconDeleteVariant(string $originalRelativePath, int $maxDim = AWARD_ICON_VARIANT_MAX_DIM): void
{
    $variantRelativePath = awardIconVariantRelativePath($originalRelativePath, $maxDim);
    if ($variantRelativePath === null) {
        return;
    }

    $variantAbsolutePath = awardIconAbsolutePathFromRelative($variantRelativePath);
    if ($variantAbsolutePath && is_file($variantAbsolutePath)) {
        @unlink($variantAbsolutePath);
    }
}

function awardIconLoadImageResource(string $sourcePath): array
{
    $imageInfo = @getimagesize($sourcePath);
    if ($imageInfo === false) {
        throw new RuntimeException('Ungültiges Bild: ' . $sourcePath);
    }

    [$width, $height] = $imageInfo;
    $mime = $imageInfo['mime'] ?? '';

    switch ($mime) {
        case 'image/jpeg':
            $image = @imagecreatefromjpeg($sourcePath);
            if ($image === false) {
                throw new RuntimeException('JPEG konnte nicht geladen werden: ' . $sourcePath);
            }
            $image = awardIconFixJpegOrientation($image, $sourcePath);
            $width = imagesx($image);
            $height = imagesy($image);
            break;
        case 'image/png':
            $image = @imagecreatefrompng($sourcePath);
            if ($image === false) {
                throw new RuntimeException('PNG konnte nicht geladen werden: ' . $sourcePath);
            }
            break;
        case 'image/webp':
            $image = @imagecreatefromwebp($sourcePath);
            if ($image === false) {
                throw new RuntimeException('WebP konnte nicht geladen werden: ' . $sourcePath);
            }
            break;
        default:
            throw new RuntimeException('Nicht unterstützter Bildtyp: ' . $mime);
    }

    return [$image, (int)$width, (int)$height, $mime];
}

function awardIconFixJpegOrientation($image, string $sourcePath)
{
    if (!function_exists('exif_read_data')) {
        return $image;
    }

    $exif = @exif_read_data($sourcePath);
    $orientation = $exif['Orientation'] ?? null;

    if ($orientation === 3) {
        $rotated = imagerotate($image, 180, 0);
    } elseif ($orientation === 6) {
        $rotated = imagerotate($image, -90, 0);
    } elseif ($orientation === 8) {
        $rotated = imagerotate($image, 90, 0);
    } else {
        return $image;
    }

    if ($rotated !== false) {
        imagedestroy($image);
        return $rotated;
    }

    return $image;
}

function awardIconCalculateTargetSize(int $width, int $height, int $maxDim): array
{
    if ($width <= 0 || $height <= 0) {
        throw new RuntimeException('Ungültige Bilddimensionen.');
    }

    if ($width <= $maxDim && $height <= $maxDim) {
        return [$width, $height];
    }

    $ratio = $width / $height;
    if ($width >= $height) {
        $targetWidth = $maxDim;
        $targetHeight = (int)round($maxDim / $ratio);
    } else {
        $targetHeight = $maxDim;
        $targetWidth = (int)round($maxDim * $ratio);
    }

    return [max(1, $targetWidth), max(1, $targetHeight)];
}

