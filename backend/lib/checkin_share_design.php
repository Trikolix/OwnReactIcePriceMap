<?php

// Shared layout measurements keep text, optional sections and both image formats in bounds.
function iceCheckinExportTitle(string $text, int $width, int $size, int $maxLines = 3): array
{
    $text = iceSocialMediaCleanText($text, 240);
    do {
        $lines = iceSocialMediaWrapLines($text, $width, $size, 'bold', $maxLines);
        if (!str_ends_with(implode(' ', $lines), '…') || $size <= 34) break;
        $size -= 2;
    } while (true);
    return ['lines' => $lines, 'size' => $size, 'step' => (int)ceil($size * 1.42)];
}

function iceCheckinExportTaste(array $candidate): ?float
{
    foreach ($candidate['ratings'] ?? [] as $rating) {
        if (($rating['key'] ?? '') === 'geschmackbewertung' && is_numeric($rating['value'] ?? null)) {
            return max(0, min(5, (float)$rating['value']));
        }
    }
    return null;
}

function iceCheckinExportType(array $candidate): string
{
    $type = iceSocialMediaCleanText($candidate['checkin_type'] ?? '', 50);
    return $type === 'Kugel' ? 'Kugeleis' : $type;
}

function iceCheckinExportAvatar($canvas, array $candidate, int $x, int $y, int $size): void
{
    if (iceSocialMediaDrawAvatar($canvas, (string)($candidate['avatar_url'] ?? ''), $x, $y, $size)) return;
    imagefilledellipse($canvas, $x + (int)($size / 2), $y + (int)($size / 2), $size, $size, iceSocialReportColor($canvas, '#e4ecda'));
    $name = iceSocialMediaCleanText($candidate['username'] ?? 'Eis', 80);
    $initial = function_exists('mb_substr') ? mb_substr($name, 0, 1) : substr($name, 0, 1);
    $fontSize = (int)round($size * .4);
    $textWidth = iceSocialMediaTextWidth($initial, $fontSize, 'bold');
    iceSocialReportText($canvas, $initial, $x + (int)(($size - $textWidth) / 2), $y + (int)($size * .68), $fontSize, '#4c6243', 'bold');
}

function iceCheckinExportStars($canvas, float $value, int $x, int $baseline, int $radius = 17, string $background = '#fffdf8'): void
{
    for ($index = 0; $index < 5; $index++) {
        iceSocialMediaDrawStar($canvas, $x + $radius + $index * ($radius * 2 + 10), $baseline - 12, $radius, max(0, min(1, $value - $index)), $background);
    }
}

function iceCheckinExportPhotoLayout(array $candidate, string $format): array
{
    [$width, $height] = iceSocialMediaDimensions($format);
    $story = $format === 'story';
    $margin = 72;
    $title = iceCheckinExportTitle((string)($candidate['shop_name'] ?? 'Mein Eis-Moment'), $width - $margin * 2, $story ? 54 : 46);
    $type = iceCheckinExportType($candidate);
    $address = iceSocialMediaCleanText($candidate['shop_address'] ?? '', 180);
    $city = '';
    if (preg_match('/\b\d{5}\s+([^,]+)/u', $address, $match)) $city = trim($match[1]);
    $meta = implode(' · ', array_filter([$type, $city]));
    $flavours = iceSocialMediaWrapLines(implode(' · ', $candidate['flavours'] ?? []), $width - $margin * 2, 25, 'regular', 2);
    $taste = iceCheckinExportTaste($candidate);
    $bottom = $height - ($story ? 200 : 88);
    $blockHeight = 42 + count($title['lines']) * $title['step'] + 16
        + ($meta !== '' ? 44 : 0) + (!empty($flavours) ? count($flavours) * 36 + 16 : 0)
        + ($taste !== null ? 54 : 0) + 96;
    return compact('width', 'height', 'story', 'margin', 'title', 'meta', 'flavours', 'taste', 'bottom', 'blockHeight') + ['top' => $bottom - $blockHeight];
}

function iceCheckinExportDrawPhoto($canvas, array $candidate, int $width, int $height): void
{
    $layout = iceCheckinExportPhotoLayout($candidate, $height === ICE_SOCIAL_MEDIA_STORY_HEIGHT ? 'story' : 'feed');
    $left = $layout['margin'];
    $y = $layout['top'];
    iceSocialReportText($canvas, 'MEIN EIS-MOMENT', $left, $y + 22, 20, '#ffcf73', 'bold');
    $y += 42;
    foreach ($layout['title']['lines'] as $line) {
        iceSocialReportText($canvas, $line, $left, $y + $layout['title']['size'], $layout['title']['size'], '#ffffff', 'bold');
        $y += $layout['title']['step'];
    }
    $y += 16;
    if ($layout['meta'] !== '') {
        $line = iceSocialMediaWrapLines($layout['meta'], $width - $left * 2, 24, 'regular', 1)[0] ?? '';
        iceSocialReportText($canvas, $line, $left, $y + 24, 24, '#f6eddc');
        $y += 44;
    }
    foreach ($layout['flavours'] as $line) {
        iceSocialReportText($canvas, $line, $left, $y + 25, 25, '#ffffff');
        $y += 36;
    }
    if (!empty($layout['flavours'])) $y += 16;
    if ($layout['taste'] !== null) {
        iceCheckinExportStars($canvas, $layout['taste'], $left, $y + 29, 15, '#252a24');
        iceSocialReportText($canvas, number_format($layout['taste'], 1, ',', '') . ' / 5 Geschmack', $left + 214, $y + 28, 24, '#ffffff');
        $y += 54;
    }
    imageline($canvas, $left, $y, $width - $left, $y, iceSocialReportColor($canvas, '#ffffff', 85));
    $y += 24;
    iceCheckinExportAvatar($canvas, $candidate, $left, $y, 64);
    $nameX = $left + 82;
    $brand = '@ice_app.de';
    $brandWidth = iceSocialMediaTextWidth($brand, 23, 'bold');
    $brandX = $width - $left - $brandWidth;
    $name = iceSocialMediaWrapLines((string)($candidate['username'] ?? 'Eis-Fan'), max(100, $brandX - $nameX - 44), 23, 'bold', 1)[0] ?? '';
    iceSocialReportText($canvas, $name, $nameX, $y + 25, 23, '#ffffff', 'bold');
    iceSocialReportText($canvas, iceSocialMediaFormatDate($candidate['checkin_date'] ?? null), $nameX, $y + 57, 20, '#eee6d5');
    iceSocialReportText($canvas, $brand, $brandX, $y + 40, 23, '#ffcf73', 'bold');
}

function iceCheckinExportReviewLayout(array $candidate, string $format): array
{
    [$width, $height] = iceSocialMediaDimensions($format);
    $story = $format === 'story';
    $margin = 72; $padding = 44; $gap = $story ? 28 : 22;
    $contentWidth = $width - $margin * 2; $innerWidth = $contentWidth - $padding * 2;
    $title = iceCheckinExportTitle((string)($candidate['shop_name'] ?? 'Mein Eis-Moment'), $contentWidth, $story ? 56 : 46);
    $address = iceSocialMediaWrapLines(iceSocialMediaCleanText($candidate['shop_address'] ?? '', 240), $contentWidth - 40, 24, 'regular', 2);
    $taste = iceCheckinExportTaste($candidate);
    $otherRatings = array_values(array_filter($candidate['ratings'] ?? [], static fn($rating) => ($rating['key'] ?? '') !== 'geschmackbewertung' && is_numeric($rating['value'] ?? null)));
    $flavours = iceSocialMediaWrapLines(implode(' · ', $candidate['flavours'] ?? []), $innerWidth, 25, 'regular', 2);
    $commentSize = $story ? 30 : 26;
    $comment = iceSocialMediaCleanText($candidate['comment'] ?? '', 600);
    $commentLines = $comment !== '' ? iceSocialMediaWrapLines('„' . $comment . '“', $innerWidth - 32, $commentSize, 'regular', 3) : [];
    $awards = array_slice($candidate['awards'] ?? [], 0, 2);
    $awardLines = [];
    foreach ($awards as $award) $awardLines[] = iceSocialMediaWrapLines((string)($award['title'] ?? 'Auszeichnung'), $innerWidth - 46, 23, 'regular', 1)[0] ?? '';
    $arrival = iceSocialMediaCleanText($candidate['arrival'] ?? '', 80);
    $headerHeight = 48 + count($title['lines']) * $title['step'] + (!empty($address) ? 22 + count($address) * 35 : 0);
    $cardHeight = $padding * 2 + 78;
    if ($taste !== null) $cardHeight += 106;
    if (!empty($otherRatings)) $cardHeight += (int)ceil(count($otherRatings) / 2) * 46 + 16;
    if (!empty($flavours)) $cardHeight += 22 + count($flavours) * 36;
    if (!empty($commentLines)) $cardHeight += 30 + count($commentLines) * (int)ceil($commentSize * 1.45);
    if (!empty($awardLines)) $cardHeight += 22 + count($awardLines) * 38;
    if ($arrival !== '') $cardHeight += 32 + 20;
    $top = $story ? 150 : 66; $bottomMargin = $story ? 180 : 76;
    $hasCoordinates = is_numeric($candidate['shop_latitude'] ?? null) && is_numeric($candidate['shop_longitude'] ?? null);
    $mapHeight = $hasCoordinates ? max(0, min($story ? 400 : 240, $height - $top - $headerHeight - $gap * 2 - $cardHeight - $bottomMargin - 50)) : 0;
    if ($mapHeight < 120) $mapHeight = 0;
    $total = $headerHeight + $gap + $cardHeight + ($mapHeight > 0 ? $gap + $mapHeight : 0);
    // Sparse check-ins get a balanced composition instead of an empty map placeholder.
    $top += max(0, (int)floor(($height - $top - $bottomMargin - 50 - $total) * .3));
    $cardTop = $top + $headerHeight + $gap;
    $mapTop = $cardTop + $cardHeight + $gap;
    $footerY = $height - $bottomMargin + 10;
    return compact('width', 'height', 'story', 'margin', 'padding', 'gap', 'contentWidth', 'innerWidth', 'title', 'address', 'taste', 'otherRatings', 'flavours', 'commentSize', 'commentLines', 'awardLines', 'arrival', 'headerHeight', 'cardHeight', 'mapHeight', 'top', 'cardTop', 'mapTop', 'footerY');
}

function iceCheckinExportDrawReview(array $candidate, string $format)
{
    $layout = iceCheckinExportReviewLayout($candidate, $format);
    $canvas = iceSocialMediaCreateCanvas($layout['width'], $layout['height']);
    $left = $layout['margin']; $y = $layout['top']; $width = $layout['contentWidth'];
    $ink = '#352b20'; $muted = '#7a6c59';
    imagefilledellipse($canvas, $layout['width'] + 10, 35, 440, 440, iceSocialReportColor($canvas, '#ffe5af', 35));
    iceSocialReportText($canvas, 'MEIN EIS-MOMENT', $left, $y + 22, 20, '#95671c', 'bold');
    $date = iceSocialMediaFormatDate($candidate['checkin_date'] ?? null);
    iceSocialReportText($canvas, $date, $left + $width - iceSocialMediaTextWidth($date, 21), $y + 22, 21, $muted);
    $y += 48;
    foreach ($layout['title']['lines'] as $line) {
        iceSocialReportText($canvas, $line, $left, $y + $layout['title']['size'], $layout['title']['size'], $ink, 'bold');
        $y += $layout['title']['step'];
    }
    if (!empty($layout['address'])) {
        $y += 22;
        iceSocialMediaDrawLocationGlyph($canvas, $left + 10, $y + 13, 20, $muted);
        foreach ($layout['address'] as $line) { iceSocialReportText($canvas, $line, $left + 36, $y + 24, 24, $muted); $y += 35; }
    }
    $cardTop = $layout['cardTop'];
    iceSocialReportRoundedRect($canvas, $left, $cardTop, $width, $layout['cardHeight'], 32, '#e9dfce');
    iceSocialReportRoundedRect($canvas, $left + 2, $cardTop + 2, $width - 4, $layout['cardHeight'] - 4, 30, '#fffdf8');
    $x = $left + $layout['padding']; $y = $cardTop + $layout['padding']; $inner = $layout['innerWidth'];
    iceCheckinExportAvatar($canvas, $candidate, $x, $y, 72);
    $name = iceSocialMediaWrapLines(iceSocialMediaCleanText($candidate['username'] ?? 'Eis-Fan', 160), $inner - 98, 26, 'bold', 1)[0] ?? '';
    iceSocialReportText($canvas, $name, $x + 96, $y + 28, 26, $ink, 'bold');
    $type = iceCheckinExportType($candidate);
    iceSocialReportText($canvas, $type !== '' ? $type . ' genießen' : 'Eis genießen', $x + 96, $y + 62, 23, $muted);
    $y += 78;
    if ($layout['taste'] !== null) {
        $y += 24;
        iceSocialReportText($canvas, 'Geschmack', $x, $y + 27, 25, $muted);
        $y += 42;
        iceCheckinExportStars($canvas, $layout['taste'], $x, $y + 27, 20);
        iceSocialReportText($canvas, number_format($layout['taste'], 1, ',', '') . ' / 5', $x + $inner - 155, $y + 31, 30, $ink, 'bold');
        $y += 40;
    }
    if (!empty($layout['otherRatings'])) {
        $y += 16;
        foreach ($layout['otherRatings'] as $index => $rating) {
            $columnX = $x + ($index % 2) * (int)($inner / 2 + 12);
            $rowY = $y + (int)floor($index / 2) * 46;
            iceSocialReportText($canvas, (string)$rating['label'], $columnX, $rowY + 24, 22, $muted);
            iceSocialReportText($canvas, number_format((float)$rating['value'], 1, ',', '') . '/5', $columnX + (int)($inner / 2) - 105, $rowY + 24, 22, $ink, 'bold');
        }
        $y += (int)ceil(count($layout['otherRatings']) / 2) * 46;
    }
    if (!empty($layout['flavours'])) {
        $y += 22;
        foreach ($layout['flavours'] as $line) { iceSocialReportText($canvas, $line, $x, $y + 25, 25, '#766028'); $y += 36; }
    }
    if (!empty($layout['commentLines'])) {
        $y += 30;
        imagefilledrectangle($canvas, $x, $y - 4, $x + 4, $y + count($layout['commentLines']) * (int)ceil($layout['commentSize'] * 1.45) - 6, iceSocialReportColor($canvas, '#f0c768'));
        foreach ($layout['commentLines'] as $line) { iceSocialReportText($canvas, $line, $x + 22, $y + $layout['commentSize'], $layout['commentSize'], $ink); $y += (int)ceil($layout['commentSize'] * 1.45); }
    }
    if (!empty($layout['awardLines'])) {
        $y += 22;
        foreach ($layout['awardLines'] as $line) { iceSocialMediaDrawStar($canvas, $x + 12, $y + 17, 11, 1.0); iceSocialReportText($canvas, $line, $x + 40, $y + 23, 23, '#8a681f'); $y += 38; }
    }
    if ($layout['arrival'] !== '') {
        $y += 20;
        iceSocialReportText($canvas, 'Anreise: ' . $layout['arrival'], $x, $y + 23, 23, $muted);
    }
    if ($layout['mapHeight'] > 0) iceSocialMediaDrawRoundedMap($canvas, $candidate, $left, $layout['mapTop'], $width, $layout['mapHeight'], 28);
    iceSocialReportText($canvas, '@ice_app.de', $left, $layout['footerY'], 24, '#95671c', 'bold');
    $footer = 'Mein Moment. Mein Eis.';
    iceSocialReportText($canvas, $footer, $left + $width - iceSocialMediaTextWidth($footer, 21), $layout['footerY'], 21, $muted);
    return $canvas;
}
