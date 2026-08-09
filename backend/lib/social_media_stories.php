<?php

require_once __DIR__ . '/social_report_stories.php';

const ICE_SOCIAL_MEDIA_STORY_WIDTH = 1080;
const ICE_SOCIAL_MEDIA_STORY_HEIGHT = 1920;
const ICE_SOCIAL_MEDIA_FEED_WIDTH = 1080;
const ICE_SOCIAL_MEDIA_FEED_HEIGHT = 1350;

function iceSocialMediaDimensions(string $format): array
{
    return $format === 'feed'
        ? [ICE_SOCIAL_MEDIA_FEED_WIDTH, ICE_SOCIAL_MEDIA_FEED_HEIGHT]
        : [ICE_SOCIAL_MEDIA_STORY_WIDTH, ICE_SOCIAL_MEDIA_STORY_HEIGHT];
}

function iceSocialMediaSlug(string $value): string
{
    $value = trim($value);
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($converted !== false) {
            $value = $converted;
        }
    }
    $value = strtolower($value);
    $value = preg_replace('/[^a-z0-9]+/', '-', $value);
    return trim((string)$value, '-') ?: 'eisfoto';
}

function iceSocialMediaCleanText($value, int $maxLength = 180): string
{
    $value = trim(preg_replace('/\s+/', ' ', strip_tags((string)$value)));
    return function_exists('mb_substr') ? mb_substr($value, 0, $maxLength) : substr($value, 0, $maxLength);
}

function iceSocialMediaCreateCanvas(int $width, int $height, bool $transparent = false)
{
    if (!extension_loaded('gd') || !function_exists('imagepng')) {
        throw new RuntimeException('GD ist auf dem Server nicht verfügbar.');
    }

    $image = imagecreatetruecolor($width, $height);
    imagealphablending($image, false);
    imagesavealpha($image, true);
    $clear = imagecolorallocatealpha($image, 0, 0, 0, 127);
    imagefilledrectangle($image, 0, 0, $width, $height, $clear);
    imagealphablending($image, true);

    if (!$transparent) {
        imagefilledrectangle($image, 0, 0, $width, $height, iceSocialReportColor($image, '#fff7df'));
    }

    return $image;
}

function iceSocialMediaResolveImagePath(string $url): ?string
{
    $url = trim($url);
    if ($url === '' || preg_match('/^[a-z][a-z0-9+.-]*:\/\//i', $url)) {
        return null;
    }

    $root = realpath(dirname(__DIR__, 2));
    $uploadsRoot = realpath(dirname(__DIR__, 2) . '/uploads');
    if ($root === false || $uploadsRoot === false) {
        return null;
    }

    $relative = ltrim(str_replace('\\', '/', $url), '/');
    $path = realpath($root . '/' . $relative);
    if ($path === false || !is_file($path) || !is_readable($path)) {
        return null;
    }

    $uploadsPrefix = rtrim($uploadsRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    if (strpos($path, $uploadsPrefix) !== 0) {
        return null;
    }

    return $path;
}

function iceSocialMediaLoadImage(string $url)
{
    $path = iceSocialMediaResolveImagePath($url);
    if (!$path) {
        throw new RuntimeException('Originalbild konnte nicht gefunden werden.');
    }

    $info = @getimagesize($path);
    if (!$info || empty($info['mime'])) {
        throw new RuntimeException('Originalbild ist ungültig.');
    }

    switch (strtolower((string)$info['mime'])) {
        case 'image/jpeg':
            $image = @imagecreatefromjpeg($path);
            break;
        case 'image/png':
            $image = @imagecreatefrompng($path);
            break;
        case 'image/webp':
            $image = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false;
            break;
        default:
            $image = false;
    }

    if (!$image) {
        throw new RuntimeException('Originalbild konnte nicht verarbeitet werden.');
    }

    imagealphablending($image, true);
    imagesavealpha($image, true);
    return $image;
}

function iceSocialMediaTryLoadImage(string $url)
{
    if (trim($url) === '') {
        return null;
    }

    try {
        return iceSocialMediaLoadImage($url);
    } catch (Throwable $exception) {
        return null;
    }
}

function iceSocialMediaCopyCover($target, $source, int $targetWidth, int $targetHeight): void
{
    $sourceWidth = imagesx($source);
    $sourceHeight = imagesy($source);
    if ($sourceWidth <= 0 || $sourceHeight <= 0) {
        throw new RuntimeException('Originalbild hat keine gültigen Abmessungen.');
    }

    $scale = max($targetWidth / $sourceWidth, $targetHeight / $sourceHeight);
    $scaledWidth = (int)ceil($sourceWidth * $scale);
    $scaledHeight = (int)ceil($sourceHeight * $scale);
    $sourceX = (int)floor(($scaledWidth - $targetWidth) / 2);
    $sourceY = (int)floor(($scaledHeight - $targetHeight) / 2);

    $scaled = imagecreatetruecolor($scaledWidth, $scaledHeight);
    imagealphablending($scaled, false);
    imagesavealpha($scaled, true);
    $clear = imagecolorallocatealpha($scaled, 0, 0, 0, 127);
    imagefilledrectangle($scaled, 0, 0, $scaledWidth, $scaledHeight, $clear);
    imagecopyresampled($scaled, $source, 0, 0, 0, 0, $scaledWidth, $scaledHeight, $sourceWidth, $sourceHeight);
    imagecopy($target, $scaled, 0, 0, $sourceX, $sourceY, $targetWidth, $targetHeight);
    imagedestroy($scaled);
}

function iceSocialMediaFormatDate(?string $value): string
{
    if (!$value) {
        return '';
    }
    $timestamp = strtotime($value);
    return $timestamp === false ? '' : date('d.m.Y', $timestamp);
}

function iceSocialMediaDrawOverlayShade($image, int $width, int $height): void
{
    // Nur der untere Textbereich bekommt einen weichen Verlauf. Der Rest des
    // Fotos bleibt vollständig unverändert und hell.
    $startY = (int)round($height * 0.68);
    $range = max(1, $height - $startY);
    for ($y = $startY; $y < $height; $y++) {
        $progress = ($y - $startY) / $range;
        $alpha = (int)round(127 - ($progress * 72));
        imagefilledrectangle($image, 0, $y, $width, $y, iceSocialReportColor($image, '#000000', $alpha));
    }
}

function iceSocialMediaDrawInstagramOverlay($image, array $candidate, int $width, int $height): void
{
    $accent = '#ffb522';
    $cream = '#fffaf0';
    $left = 94;
    $titleY = $height - 176;
    $flavourY = $height - 112;
    $userY = $height - 48;

    $lineX = 56;
    imagefilledrectangle($image, $lineX, $titleY - 58, $lineX + 8, $userY + 10, iceSocialReportColor($image, $accent));

    $shopName = iceSocialMediaCleanText($candidate['shop_name'] ?? 'Unbekannte Eisdiele', 42);
    $flavours = array_slice(array_map('iceSocialMediaCleanText', $candidate['flavours'] ?? []), 0, 2);
    $flavourText = !empty($flavours) ? implode(' · ', $flavours) : 'Eis genießen';
    $username = iceSocialMediaCleanText(ltrim((string)($candidate['username'] ?? 'Ice-App-Nutzer'), '@'), 34);

    iceSocialReportText($image, $shopName, $left, $titleY, 52, $cream, 'regular');
    iceSocialReportText($image, $flavourText, $left, $flavourY, 30, $cream, 'regular');
    iceSocialReportText($image, 'von', $left, $userY, 27, $cream, 'regular');
    iceSocialReportText($image, $username, $left + 70, $userY, 31, $accent, 'bold');
    iceSocialMediaDrawGourmetCyclistLogo($image, $width - 300, $height - 180, 260);
    iceSocialReportText($image, 'ice-app.de', $width - 190, $height - 48, 24, $accent, 'bold');
}

function iceSocialMediaDrawBrand($image, int $width, int $height): void
{
    // Die Foto-Slides bleiben bewusst frei von einem großen Text-Wasserzeichen.
    // Branding wird dezent zusammen mit dem Partnerlogo in der Info-Box gesetzt.
}

function iceSocialMediaDrawGourmetCyclistLogo($image, int $x, int $y, int $targetWidth): void
{
    $paths = [
        dirname(__DIR__) . '/social_media/header_wide.png',
        dirname(__DIR__, 2) . '/src/header_wide.png',
        dirname(__DIR__, 2) . '/public/header_wide.png',
        dirname(__DIR__, 2) . '/public/assets/header_wide.png',
    ];
    $path = null;
    foreach ($paths as $candidatePath) {
        if (is_file($candidatePath) && is_readable($candidatePath)) {
            $path = $candidatePath;
            break;
        }
    }
    if (!$path || !function_exists('imagecreatefrompng')) {
        return;
    }

    $logo = @imagecreatefrompng($path);
    if (!$logo) {
        return;
    }

    $sourceWidth = max(1, imagesx($logo));
    $sourceHeight = max(1, imagesy($logo));
    $targetHeight = (int)round($targetWidth * $sourceHeight / $sourceWidth);
    imagealphablending($image, true);
    imagesavealpha($logo, true);
    imagecopyresampled($image, $logo, $x, $y, 0, 0, $targetWidth, $targetHeight, $sourceWidth, $sourceHeight);
    imagedestroy($logo);
}

function iceSocialMediaDrawInfoCard($image, array $candidate, int $width, int $height): void
{
    $isFeed = $height === ICE_SOCIAL_MEDIA_FEED_HEIGHT;
    $cardHeight = $isFeed ? 300 : 390;
    $cardX = 48;
    $cardY = $height - $cardHeight - 62;
    $cardWidth = $width - 96;

    iceSocialReportRoundedRect($image, $cardX, $cardY, $cardWidth, $cardHeight, 24, '#fffaf0', 18);
    iceSocialReportRoundedRect($image, $cardX, $cardY, 8, $cardHeight, 4, '#f0a500');

    $username = iceSocialMediaCleanText('@' . ltrim((string)($candidate['username'] ?? 'Ice-App-Nutzer'), '@'), 42);
    $shopName = iceSocialMediaCleanText($candidate['shop_name'] ?? 'Unbekannte Eisdiele', 90);
    $date = iceSocialMediaFormatDate($candidate['checkin_date'] ?? null);
    $flavours = array_slice(array_map('iceSocialMediaCleanText', $candidate['flavours'] ?? []), 0, 3);

    $labelX = $cardX + 32;
    $valueX = $cardX + 148;
    $rowY = $cardY + ($isFeed ? 54 : 58);
    $rowGap = $isFeed ? 48 : 56;
    $valueWidth = $cardWidth - 190 - ($isFeed ? 225 : 290);
    $labelSize = $isFeed ? 19 : 22;
    $valueSize = $isFeed ? 25 : 30;

    $rows = [
        ['Von', $username],
        ['Ort', $shopName],
        ['Datum', $date ?: '—'],
        ['Sorte' . (count($flavours) === 1 ? '' : 'n'), !empty($flavours) ? implode(', ', $flavours) : '—'],
    ];
    foreach ($rows as [$label, $value]) {
        iceSocialReportText($image, $label . ':', $labelX, $rowY, $labelSize, '#806b4a', 'bold');
        iceSocialReportWrapText($image, iceSocialMediaCleanText($value, 110), $valueX, $rowY, max(230, $valueWidth), $valueSize, '#2f2100', 'bold', 1.05);
        $rowY += $rowGap;
    }

    $logoWidth = $isFeed ? 190 : 245;
    $logoX = $cardX + $cardWidth - $logoWidth - 28;
    $logoY = $cardY + $cardHeight - ($isFeed ? 78 : 96);
    iceSocialMediaDrawGourmetCyclistLogo($image, $logoX, $logoY, $logoWidth);
    iceSocialReportText($image, 'ice-app.de', $logoX + ($isFeed ? 62 : 82), $cardY + $cardHeight - 24, $isFeed ? 17 : 20, '#6e4c1e', 'bold');
}

function iceSocialMediaRenderPhotoSlide(array $candidate, string $format, string $mode)
{
    [$width, $height] = iceSocialMediaDimensions($format);
    $transparent = $mode === 'overlay';
    $canvas = iceSocialMediaCreateCanvas($width, $height, $transparent);

    if (!$transparent) {
        $source = iceSocialMediaLoadImage((string)$candidate['image_url']);
        iceSocialMediaCopyCover($canvas, $source, $width, $height);
        imagedestroy($source);
        iceSocialMediaDrawOverlayShade($canvas, $width, $height);
    } elseif (!iceSocialMediaResolveImagePath((string)$candidate['image_url'])) {
        imagedestroy($canvas);
        throw new RuntimeException('Originalbild konnte nicht gefunden werden.');
    }

    iceSocialMediaDrawInstagramOverlay($canvas, $candidate, $width, $height);
    return $canvas;
}

function iceSocialMediaFetchMapTile(int $zoom, int $tileX, int $tileY)
{
    static $cache = [];
    $worldSize = 1 << $zoom;
    $tileX = (($tileX % $worldSize) + $worldSize) % $worldSize;
    if ($tileY < 0 || $tileY >= $worldSize) {
        return null;
    }

    $key = $zoom . '/' . $tileX . '/' . $tileY;
    if (array_key_exists($key, $cache)) {
        return $cache[$key] ? imagecreatefromstring($cache[$key]) : null;
    }

    $url = sprintf('https://tile.openstreetmap.org/%d/%d/%d.png', $zoom, $tileX, $tileY);
    $data = false;
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_USERAGENT => 'Ice-App Instagram Export/1.0 (admin@ice-app.de)',
        ]);
        $data = curl_exec($curl);
        curl_close($curl);
    } elseif (filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'header' => "User-Agent: Ice-App Instagram Export/1.0 (admin@ice-app.de)\r\n",
            ],
        ]);
        $data = @file_get_contents($url, false, $context);
    }

    if (!is_string($data) || $data === '' || !function_exists('imagecreatefromstring')) {
        $cache[$key] = false;
        return null;
    }

    $cache[$key] = $data;
    $tile = @imagecreatefromstring($data);
    return $tile ?: null;
}

function iceSocialMediaDrawFallbackMap($image, int $x, int $y, int $width, int $height): void
{
    $mapBackground = iceSocialReportColor($image, '#e7f0e4');
    imagefilledrectangle($image, $x, $y, $x + $width, $y + $height, $mapBackground);
    $road = iceSocialReportColor($image, '#ffffff', 8);
    $minorRoad = iceSocialReportColor($image, '#c2dec2', 8);
    for ($line = -$height; $line < $width + $height; $line += 130) {
        imagesetthickness($image, 18);
        imageline($image, $x + $line, $y, $x + $line + $height, $y + $height, $road);
        imagesetthickness($image, 5);
        imageline($image, $x + $line + 55, $y, $x + $line + $height + 55, $y + $height, $minorRoad);
    }
    imagesetthickness($image, 1);
}

function iceSocialMediaDrawMap($image, array $candidate, int $x, int $y, int $width, int $height): void
{
    $latitude = (float)$candidate['shop_latitude'];
    $longitude = (float)$candidate['shop_longitude'];
    $zoom = 16;
    $world = pow(2, $zoom);
    $pixelX = (($longitude + 180) / 360) * $world * 256;
    $sinLatitude = sin(deg2rad(max(-85.0511, min(85.0511, $latitude))));
    $pixelY = (0.5 - log((1 + $sinLatitude) / (1 - $sinLatitude)) / (4 * M_PI)) * $world * 256;
    $tileCenterX = (int)floor($pixelX / 256);
    $tileCenterY = (int)floor($pixelY / 256);
    $mosaic = imagecreatetruecolor(1024, 1024);
    imagefilledrectangle($mosaic, 0, 0, 1024, 1024, iceSocialReportColor($mosaic, '#e7f0e4'));

    $hasRealTile = false;
    for ($dy = -2; $dy <= 1; $dy++) {
        for ($dx = -2; $dx <= 1; $dx++) {
            $tile = iceSocialMediaFetchMapTile($zoom, $tileCenterX + $dx, $tileCenterY + $dy);
            if ($tile) {
                imagecopy($mosaic, $tile, ($dx + 2) * 256, ($dy + 2) * 256, 0, 0, min(256, imagesx($tile)), min(256, imagesy($tile)));
                imagedestroy($tile);
                $hasRealTile = true;
            }
        }
    }
    $markerX = $x + (int)round($width / 2);
    $markerTipY = $y + (int)round($height / 2);
    if (!$hasRealTile) {
        imagedestroy($mosaic);
        iceSocialMediaDrawFallbackMap($image, $x, $y, $width, $height);
    } else {
        $centerInMosaicX = ($pixelX - (($tileCenterX - 2) * 256));
        $centerInMosaicY = ($pixelY - (($tileCenterY - 2) * 256));
        // Der Kartenausschnitt wird leicht um die Eisdiele herum versetzt. So
        // wird die Markerposition aus den echten Koordinaten berechnet und
        // nicht unabhängig davon immer stumpf in die Mitte gezeichnet.
        $sourceX = max(0, min(1024 - $width, (int)round($centerInMosaicX - $width * 0.52)));
        $sourceY = max(0, min(1024 - $height, (int)round($centerInMosaicY - $height * 0.48)));
        $markerX = $x + max(0, min($width, (int)round($centerInMosaicX - $sourceX)));
        $markerTipY = $y + max(0, min($height, (int)round($centerInMosaicY - $sourceY)));
        imagecopy($image, $mosaic, $x, $y, $sourceX, $sourceY, $width, $height);
        imagedestroy($mosaic);
    }

    $marker = iceSocialReportColor($image, '#f05a47');
    // Die Spitze, nicht der Kreismittelpunkt, ist der geografische Ankerpunkt.
    // Dadurch zeigt die Pin-Spitze exakt auf die Eisdielenkoordinate.
    $markerCenterY = $markerTipY - 90;
    imagefilledellipse($image, $markerX, $markerCenterY, 66, 66, $marker);
    imagefilledpolygon($image, [$markerX - 25, $markerCenterY + 18, $markerX + 25, $markerCenterY + 18, $markerX, $markerTipY], 3, $marker);
    imagefilledellipse($image, $markerX, $markerCenterY, 22, 22, iceSocialReportColor($image, '#fff7df'));
    iceSocialReportText($image, '© OpenStreetMap contributors', $x + 12, $y + $height - 12, 16, '#503000');
    imagesetthickness($image, 1);
}

function iceSocialMediaTextWidth(string $text, int $size, string $weight = 'regular'): int
{
    $font = iceSocialReportFont($weight);
    if ($font !== '') {
        $box = imagettfbbox($size, 0, $font, $text);
        return max(0, $box[2] - $box[0]);
    }

    return iceSocialReportBuiltinTextWidth($text, $size);
}

function iceSocialMediaWrapLines(string $text, int $maxWidth, int $size, string $weight = 'regular', int $maxLines = 2): array
{
    $text = trim($text);
    if ($text === '' || $maxLines < 1) {
        return [];
    }

    $words = preg_split('/\s+/', $text) ?: [];
    $lines = [];
    $line = '';
    foreach ($words as $wordIndex => $word) {
        $test = trim($line . ' ' . $word);
        if ($line !== '' && iceSocialMediaTextWidth($test, $size, $weight) > $maxWidth) {
            if (count($lines) >= $maxLines - 1) {
                $line = trim($line . ' ' . implode(' ', array_slice($words, $wordIndex)));
                while ($line !== '' && iceSocialMediaTextWidth($line . '…', $size, $weight) > $maxWidth) {
                    $length = function_exists('mb_strlen') ? mb_strlen($line) : strlen($line);
                    $line = function_exists('mb_substr')
                        ? mb_substr($line, 0, max(1, $length - 1))
                        : substr($line, 0, max(1, $length - 1));
                    $line = rtrim($line);
                }
                $lines[] = rtrim($line) . '…';
                return $lines;
            }
            $lines[] = $line;
            $line = $word;
        } else {
            $line = $test;
        }
    }

    if ($line !== '' && iceSocialMediaTextWidth($line, $size, $weight) > $maxWidth) {
        while (strlen($line) > 1 && iceSocialMediaTextWidth($line . '…', $size, $weight) > $maxWidth) {
            $length = function_exists('mb_strlen') ? mb_strlen($line) : strlen($line);
            $line = function_exists('mb_substr')
                ? mb_substr($line, 0, max(1, $length - 1))
                : substr($line, 0, max(1, $length - 1));
            $line = rtrim($line);
        }
        $line .= '…';
    }
    if ($line !== '') {
        $lines[] = $line;
    }

    return array_slice($lines, 0, $maxLines);
}

function iceSocialMediaDrawTextLines($image, array $lines, int $x, int $baselineY, int $size, string $hex, string $weight = 'regular', float $lineHeight = 1.15): void
{
    foreach ($lines as $index => $line) {
        iceSocialReportText($image, (string)$line, $x, $baselineY + (int)round($index * $size * $lineHeight), $size, $hex, $weight);
    }
}

function iceSocialMediaDrawStar($image, int $centerX, int $centerY, int $radius, float $fillLevel, string $background = '#fffdf8'): void
{
    $points = [];
    for ($index = 0; $index < 10; $index++) {
        $angle = deg2rad(-90 + $index * 36);
        $pointRadius = $index % 2 === 0 ? $radius : (int)round($radius * 0.44);
        $points[] = (int)round($centerX + cos($angle) * $pointRadius);
        $points[] = (int)round($centerY + sin($angle) * $pointRadius);
    }
    $outline = iceSocialReportColor($image, '#f0a500');
    $fill = $fillLevel > 0.25 ? $outline : iceSocialReportColor($image, $background);
    imagefilledpolygon($image, $points, 10, $fill);
    if ($fillLevel > 0.25 && $fillLevel < 0.75) {
        imagefilledrectangle(
            $image,
            $centerX,
            $centerY - $radius - 2,
            $centerX + $radius + 2,
            $centerY + $radius + 2,
            iceSocialReportColor($image, $background)
        );
    }
    imagesetthickness($image, 3);
    imagepolygon($image, $points, 10, $outline);
    imagesetthickness($image, 1);
}

function iceSocialMediaDrawRatingRow($image, string $label, float $value, int $x, int $y, int $width, int $fontSize): void
{
    iceSocialReportText($image, $label, $x, $y, $fontSize, '#503000', 'bold');
    $starRadius = $fontSize >= 28 ? 18 : 14;
    $starGap = $fontSize >= 28 ? 40 : 31;
    $starStartX = $x + $width - ($starGap * 4 + $starRadius + 116);
    for ($index = 1; $index <= 5; $index++) {
        $fillLevel = max(0.0, min(1.0, $value - ($index - 1)));
        iceSocialMediaDrawStar($image, $starStartX + ($index - 1) * $starGap, $y - (int)round($fontSize * 0.38), $starRadius, $fillLevel);
    }
    iceSocialReportText($image, number_format($value, 1, ',', '') . '/5', $x + $width - 94, $y, $fontSize, '#503000', 'bold');
}

function iceSocialMediaDrawLocationGlyph($image, int $centerX, int $centerY, int $size, string $hex): void
{
    $color = iceSocialReportColor($image, $hex);
    $radius = max(5, (int)round($size * 0.32));
    imagesetthickness($image, max(2, (int)round($size * 0.12)));
    imageellipse($image, $centerX, $centerY - $size * 0.16, $radius * 2, $radius * 2, $color);
    imagefilledpolygon($image, [
        $centerX - $radius,
        $centerY,
        $centerX + $radius,
        $centerY,
        $centerX,
        $centerY + (int)round($size * 0.72),
    ], 3, $color);
    imagefilledellipse($image, $centerX, $centerY - (int)round($size * 0.16), max(3, $radius), max(3, $radius), iceSocialReportColor($image, '#fffaf0'));
    imagesetthickness($image, 1);
}

function iceSocialMediaDrawAvatar($image, string $url, int $x, int $y, int $diameter): bool
{
    $source = iceSocialMediaTryLoadImage($url);
    if (!$source) {
        return false;
    }

    $sourceWidth = max(1, imagesx($source));
    $sourceHeight = max(1, imagesy($source));
    $scale = max($diameter / $sourceWidth, $diameter / $sourceHeight);
    $scaledWidth = (int)ceil($sourceWidth * $scale);
    $scaledHeight = (int)ceil($sourceHeight * $scale);
    $cropWidth = min($sourceWidth, $diameter / $scale);
    $cropHeight = min($sourceHeight, $diameter / $scale);
    $avatar = imagecreatetruecolor($diameter, $diameter);
    imagealphablending($avatar, false);
    imagesavealpha($avatar, true);
    $transparent = imagecolorallocatealpha($avatar, 0, 0, 0, 127);
    imagefilledrectangle($avatar, 0, 0, $diameter, $diameter, $transparent);
    imagecopyresampled(
        $avatar,
        $source,
        0,
        0,
        (int)floor(($sourceWidth - $cropWidth) / 2),
        (int)floor(($sourceHeight - $cropHeight) / 2),
        $diameter,
        $diameter,
        (int)round($cropWidth),
        (int)round($cropHeight)
    );
    $radius = $diameter / 2;
    for ($py = 0; $py < $diameter; $py++) {
        for ($px = 0; $px < $diameter; $px++) {
            $dx = $px + 0.5 - $radius;
            $dy = $py + 0.5 - $radius;
            if (($dx * $dx) + ($dy * $dy) > $radius * $radius) {
                imagesetpixel($avatar, $px, $py, $transparent);
            }
        }
    }
    imagealphablending($image, true);
    imagecopy($image, $avatar, $x, $y, 0, 0, $diameter, $diameter);
    imageellipse($image, $x + (int)round($radius), $y + (int)round($radius), $diameter, $diameter, iceSocialReportColor($image, '#ffb522'));
    imagedestroy($avatar);
    imagedestroy($source);
    return true;
}

function iceSocialMediaDrawChip($image, string $text, int $x, int $y, int $maxWidth, int $fontSize): int
{
    $text = iceSocialMediaCleanText($text, 48);
    if ($text === '') {
        return 0;
    }
    $text = iceSocialMediaWrapLines($text, max(80, $maxWidth - 44), $fontSize, 'bold', 1)[0] ?? $text;
    $width = min($maxWidth, max(150, iceSocialMediaTextWidth($text, $fontSize, 'bold') + 44));
    iceSocialReportRoundedRect($image, $x, $y, $width, $fontSize + 28, 22, '#ffe6a6');
    iceSocialReportText($image, $text, $x + 22, $y + $fontSize + 9, $fontSize, '#5b3c0f', 'bold');
    return $width;
}

function iceSocialMediaDrawRoundedMap($image, array $candidate, int $x, int $y, int $width, int $height, int $radius): void
{
    $map = iceSocialMediaCreateCanvas($width, $height, false);
    iceSocialMediaDrawMap($map, $candidate, 0, 0, $width, $height);

    // Transparente Ecken sorgen dafür, dass die Karte innerhalb der runden
    // Fläche bleibt, ohne den bestehenden OSM-Renderer zu duplizieren.
    imagealphablending($map, false);
    imagesavealpha($map, true);
    $transparent = imagecolorallocatealpha($map, 0, 0, 0, 127);
    for ($py = 0; $py < min($radius, $height); $py++) {
        for ($px = 0; $px < min($radius, $width); $px++) {
            $corners = [
                [$px, $py, $radius, $radius],
                [$width - $radius + $px, $py, $width - $radius, $radius],
                [$px, $height - $radius + $py, $radius, $height - $radius],
                [$width - $radius + $px, $height - $radius + $py, $width - $radius, $height - $radius],
            ];
            foreach ($corners as [$cx, $cy, $centerX, $centerY]) {
                $dx = $cx - $centerX;
                $dy = $cy - $centerY;
                if (($dx * $dx) + ($dy * $dy) > $radius * $radius) {
                    imagesetpixel($map, $cx, $cy, $transparent);
                }
            }
        }
    }
    imagealphablending($image, true);
    imagecopy($image, $map, $x, $y, 0, 0, $width, $height);
    imagedestroy($map);
}

function iceSocialMediaRenderReviewSlide(array $candidate, string $format)
{
    [$width, $height] = iceSocialMediaDimensions($format);
    $canvas = iceSocialMediaCreateCanvas($width, $height, false);
    $isStory = $height > ICE_SOCIAL_MEDIA_FEED_HEIGHT;
    $margin = $isStory ? 68 : 58;
    $contentWidth = $width - ($margin * 2);
    $cream = '#fffaf0';
    $ink = '#3d280b';
    $accent = '#ff9f1c';
    $muted = '#74532d';

    imagefilledellipse($canvas, $width + 35, -48, $isStory ? 430 : 330, $isStory ? 430 : 330, iceSocialReportColor($canvas, '#ffe3a0', 12));
    imagefilledellipse($canvas, -110, $height + 80, $isStory ? 380 : 260, $isStory ? 380 : 260, iceSocialReportColor($canvas, '#ffe9b6', 35));

    $badgeX = $margin;
    $badgeY = $isStory ? 70 : 48;
    $badgeText = 'EIS-CHECK-IN';
    $badgeTextSize = $isStory ? 34 : 29;
    $badgeWidth = max(
        $isStory ? 370 : 325,
        82 + iceSocialMediaTextWidth($badgeText, $badgeTextSize, 'bold') + 30
    );
    $badgeHeight = $isStory ? 84 : 70;
    iceSocialReportRoundedRect($canvas, $badgeX, $badgeY, $badgeWidth, $badgeHeight, (int)round($badgeHeight / 2), $accent);
    iceSocialMediaDrawLocationGlyph($canvas, $badgeX + 36, $badgeY + (int)round($badgeHeight / 2) - 3, $isStory ? 27 : 24, $cream);
    iceSocialReportText(
        $canvas,
        $badgeText,
        $badgeX + 78,
        $badgeY + (int)round(($badgeHeight + $badgeTextSize) / 2) - 2,
        $badgeTextSize,
        $cream,
        'bold'
    );

    $shopName = iceSocialMediaCleanText($candidate['shop_name'] ?? 'Unbekannte Eisdiele', 90);
    $titleSize = $isStory ? 68 : 54;
    // Mehr Luft zwischen dem Badge und dem Eisdielennamen verhindert, dass
    // sich die beiden visuellen Blöcke berühren.
    $titleTop = $isStory ? 258 : 198;
    $titleLines = iceSocialMediaWrapLines($shopName, $contentWidth, $titleSize, 'bold', 2);
    iceSocialMediaDrawTextLines($canvas, $titleLines, $margin, $titleTop, $titleSize, $ink, 'bold', 1.02);

    $address = iceSocialMediaCleanText((string)($candidate['shop_address'] ?? ''), 110);
    $addressY = $titleTop + max(1, count($titleLines)) * (int)round($titleSize * 1.02) + ($isStory ? 28 : 22);
    if ($address !== '') {
        iceSocialMediaDrawLocationGlyph($canvas, $margin + 18, $addressY - 11, $isStory ? 26 : 22, $muted);
        iceSocialReportWrapText($canvas, $address, $margin + ($isStory ? 54 : 46), $addressY, $contentWidth - ($isStory ? 54 : 46), $isStory ? 27 : 22, $muted, 'regular', 1.12);
    }

    $mapX = $margin;
    $mapY = $addressY + ($isStory ? 66 : 52);
    $mapWidth = $contentWidth;
    $mapHeight = $isStory ? 650 : 345;
    $hasCoordinates = $candidate['shop_latitude'] !== null && $candidate['shop_longitude'] !== null;
    iceSocialReportRoundedRect($canvas, $mapX - 8, $mapY - 8, $mapWidth + 16, $mapHeight + 16, 38, '#ead7a8', 55);
    if ($hasCoordinates) {
        iceSocialMediaDrawRoundedMap($canvas, $candidate, $mapX, $mapY, $mapWidth, $mapHeight, 32);
    } else {
        iceSocialReportRoundedRect($canvas, $mapX, $mapY, $mapWidth, $mapHeight, 32, '#e5efdf');
        iceSocialReportText($canvas, 'Kein Kartenstandort hinterlegt', $mapX + 42, $mapY + (int)round($mapHeight / 2), $isStory ? 30 : 24, $muted, 'bold');
    }

    $ratings = array_values(array_filter($candidate['ratings'] ?? [], static function ($rating) {
        return is_array($rating) && isset($rating['value']) && $rating['value'] !== null;
    }));
    $flavours = array_slice(array_map(static function ($flavour) {
        return iceSocialMediaCleanText($flavour, 28);
    }, $candidate['flavours'] ?? []), 0, 3);
    $arrival = iceSocialMediaCleanText($candidate['arrival'] ?? '', 32);
    $comment = iceSocialMediaCleanText($candidate['comment'] ?? '', 140);
    $commentSize = $isStory ? 28 : 21;
    $commentLines = $comment !== '' ? iceSocialMediaWrapLines('„' . $comment . '“', $contentWidth - 100, $commentSize, 'italic', 2) : [];
    $rowGap = $isStory ? 58 : 42;
    $rowSize = $isStory ? 29 : 22;
    // Karte und Bewertungskachel stehen bewusst untereinander statt sich zu
    // überlappen. Ein kleiner Abstand hält die beiden Flächen optisch
    // zusammen, ohne die Karte zu verdecken.
    $cardTop = $mapY + $mapHeight + ($isStory ? 28 : 20);
    $cardX = $isStory ? 74 : 68;
    $cardWidth = $width - ($cardX * 2);
    $flavourPillFontSize = $isStory ? 21 : 16;
    $flavourPillHeight = $flavourPillFontSize + 28;
    $arrivalPillFontSize = $isStory ? 22 : 17;
    $arrivalPillHeight = $arrivalPillFontSize + 28;
    $chipRowsHeight = (!empty($flavours) ? $flavourPillHeight : 0)
        + (!empty($flavours) && $arrival !== '' ? ($isStory ? 14 : 10) : 0)
        + ($arrival !== '' ? $arrivalPillHeight : 0);
    $cardHeight = ($isStory ? 126 : 92)
        + count($ratings) * $rowGap
        + ($chipRowsHeight > 0 ? $chipRowsHeight + ($isStory ? 12 : 8) : 0)
        + (!empty($commentLines) ? count($commentLines) * (int)round($commentSize * 1.18) + ($isStory ? 48 : 34) : 0)
        + ($isStory ? 34 : 26);

    iceSocialReportRoundedRect($canvas, $cardX + 10, $cardTop + 14, $cardWidth, $cardHeight, 34, '#dbab4d', 48);
    iceSocialReportRoundedRect($canvas, $cardX, $cardTop, $cardWidth, $cardHeight, 34, '#fffdf8');

    $username = iceSocialMediaCleanText(ltrim((string)($candidate['username'] ?? ''), '@'), 34);
    $username = $username !== '' ? $username : 'Nutzer';
    $avatarDiameter = $isStory ? 72 : 56;
    $avatarX = $cardX + 34;
    $avatarY = $cardTop + ($isStory ? 24 : 18);
    $hasAvatar = iceSocialMediaDrawAvatar($canvas, (string)($candidate['avatar_url'] ?? ''), $avatarX, $avatarY, $avatarDiameter);
    $headerX = $hasAvatar ? $avatarX + $avatarDiameter + 20 : $cardX + 38;
    $headerY = $cardTop + ($isStory ? 74 : 58);
    iceSocialReportText($canvas, $username, $headerX, $headerY, $isStory ? 30 : 24, $ink, 'bold');
    $usernameWidth = iceSocialMediaTextWidth($username, $isStory ? 30 : 24, 'bold');
    iceSocialReportText($canvas, ' bewertet', $headerX + $usernameWidth + 8, $headerY, $isStory ? 28 : 22, $muted, 'regular');

    $rowY = $cardTop + ($isStory ? 142 : 105);
    foreach ($ratings as $rating) {
        iceSocialMediaDrawRatingRow($canvas, (string)$rating['label'], (float)$rating['value'], $cardX + 42, $rowY, $cardWidth - 84, $rowSize);
        $rowY += $rowGap;
    }

    if (!empty($flavours) || $arrival !== '') {
        $chipY = $rowY + ($isStory ? 2 : 0);
        $chipX = $cardX + 38;
        if (!empty($flavours)) {
            $flavourLabelWidth = iceSocialMediaTextWidth('Sorten:', $flavourPillFontSize, 'bold');
            iceSocialReportText(
                $canvas,
                'Sorten:',
                $chipX,
                $chipY + $flavourPillFontSize + 9,
                $flavourPillFontSize,
                '#74532d',
                'bold'
            );
            $chipX += $flavourLabelWidth + 14;
            $pillGap = 10;
            $pillAreaWidth = $cardWidth - 76 - $flavourLabelWidth - 14;
            $pillMaxWidth = (int)floor(($pillAreaWidth - $pillGap * (count($flavours) - 1)) / max(1, count($flavours)));
            foreach ($flavours as $flavour) {
                $pillWidth = iceSocialMediaDrawChip($canvas, $flavour, $chipX, $chipY, $pillMaxWidth, $flavourPillFontSize);
                $chipX += $pillWidth + $pillGap;
            }
            $chipY += $flavourPillHeight + ($isStory ? 14 : 10);
        }
        if ($arrival !== '') {
            iceSocialMediaDrawChip($canvas, 'Anreise: ' . $arrival, $cardX + 38, $chipY, $cardWidth - 76, $arrivalPillFontSize);
        }
        $rowY = $chipY + ($arrival !== '' ? $arrivalPillHeight : 0);
    }

    if (!empty($commentLines)) {
        iceSocialMediaDrawTextLines($canvas, $commentLines, $cardX + 42, $rowY + ($isStory ? 34 : 25), $commentSize, $muted, 'italic', 1.18);
    }

    $footerY = $height - ($isStory ? 220 : 145);
    iceSocialReportText($canvas, 'Mehr entdecken in der Ice-App', $margin, $height - ($isStory ? 72 : 42), $isStory ? 26 : 21, $ink, 'bold');
    $logoWidth = $isStory ? 300 : 220;
    $logoX = $width - $margin - $logoWidth;
    $logoY = $height - ($isStory ? 215 : 145);
    iceSocialMediaDrawGourmetCyclistLogo($canvas, $logoX, $logoY, $logoWidth);
    iceSocialReportText($canvas, 'ice-app.de', $width - $margin - ($isStory ? 150 : 112), $height - ($isStory ? 42 : 28), $isStory ? 24 : 18, $accent, 'bold');
    return $canvas;
}

function iceSocialMediaBuildSlides(array $candidate, string $format = 'story', string $mode = 'composite', bool $includeReviewSlide = true): array
{
    if (!in_array($format, ['story', 'feed'], true)) {
        $format = 'story';
    }
    if (!in_array($mode, ['composite', 'overlay'], true)) {
        $mode = 'composite';
    }

    $slug = iceSocialMediaSlug((string)($candidate['shop_name'] ?? 'eisfoto'));
    $imageId = (int)($candidate['image_id'] ?? 0);
    $slides = [[
        'filename' => sprintf('01_%s_%d_%s.png', $mode === 'overlay' ? 'info_overlay' : 'foto', $imageId, $slug),
        'image' => iceSocialMediaRenderPhotoSlide($candidate, $format, $mode),
    ]];

    $hasReviewContent = !empty($candidate['ratings'])
        || !empty($candidate['flavours'])
        || trim((string)($candidate['comment'] ?? '')) !== ''
        || trim((string)($candidate['arrival'] ?? '')) !== ''
        || ($candidate['shop_latitude'] !== null && $candidate['shop_longitude'] !== null);
    if ($includeReviewSlide && $hasReviewContent) {
        $slides[] = [
            'filename' => sprintf('02_checkin_%d_%s.png', $imageId, $slug),
            'image' => iceSocialMediaRenderReviewSlide($candidate, $format),
        ];
    }

    return $slides;
}
