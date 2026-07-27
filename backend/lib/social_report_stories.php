<?php

const ICE_SOCIAL_STORY_WIDTH = 1080;
const ICE_SOCIAL_STORY_HEIGHT = 1920;

function iceSocialReportProjectRoot(): string
{
    return dirname(__DIR__, 2);
}

function iceSocialReportFont(string $weight = 'regular'): string
{
    if (!function_exists('imagettftext')) {
        return '';
    }

    $candidates = $weight === 'bold'
        ? [
            __DIR__ . '/../assets/fonts/Nunito.ttf',
            __DIR__ . '/../assets/fonts/Inter-Bold.ttf',
            __DIR__ . '/../assets/fonts/DejaVuSans-Bold.ttf',
            'C:/Windows/Fonts/arialbd.ttf',
            'C:/Windows/Fonts/segoeuib.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf',
            '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
        ]
        : [
            __DIR__ . '/../assets/fonts/Nunito.ttf',
            __DIR__ . '/../assets/fonts/Inter-Regular.ttf',
            __DIR__ . '/../assets/fonts/DejaVuSans.ttf',
            'C:/Windows/Fonts/arial.ttf',
            'C:/Windows/Fonts/segoeui.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
            '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
        ];

    foreach ($candidates as $font) {
        if (is_file($font)) {
            return $font;
        }
    }

    return '';
}

function iceSocialReportGenerateStories(array $report): array
{
    if (!extension_loaded('gd') || !function_exists('imagepng')) {
        error_log('Ice-App Social Report: GD ist nicht verfügbar, Story-Grafiken wurden nicht erzeugt.');
        return [];
    }

    $type = preg_replace('/[^a-z0-9_-]/i', '', (string)($report['type'] ?? 'report'));
    $periodSlug = preg_replace('/[^0-9_-]/', '', (string)($report['start']->format('Y-m-d') . '_' . $report['end']->format('Y-m-d')));
    $targetDir = iceSocialReportProjectRoot() . '/backend/generated/social_reports/' . $type . '/' . $periodSlug;

    if (!is_dir($targetDir) && !@mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
        error_log('Ice-App Social Report: Zielordner konnte nicht erstellt werden: ' . $targetDir);
        return [];
    }

    $slides = [
        ['filename' => '01_highlights.png', 'title' => 'Highlights', 'renderer' => 'iceSocialReportRenderHighlights'],
        ['filename' => '02_community.png', 'title' => 'Community', 'renderer' => 'iceSocialReportRenderCommunity'],
        ['filename' => '03_verteilung.png', 'title' => 'Verteilung', 'renderer' => 'iceSocialReportRenderDistribution'],
        ['filename' => '04_gesamtzahlen_optional.png', 'title' => 'Gesamtzahlen', 'renderer' => 'iceSocialReportRenderTotals'],
    ];

    $paths = [];
    foreach ($slides as $slide) {
        $image = iceSocialReportCreateCanvas();
        $slide['renderer']($image, $report);

        $path = $targetDir . '/' . $slide['filename'];
        if (imagepng($image, $path, 7)) {
            $paths[] = $path;
        } else {
            error_log('Ice-App Social Report: Story-Grafik konnte nicht geschrieben werden: ' . $path);
        }
        imagedestroy($image);
    }

    return $paths;
}

function iceSocialReportCreateCanvas()
{
    $image = imagecreatetruecolor(ICE_SOCIAL_STORY_WIDTH, ICE_SOCIAL_STORY_HEIGHT);
    if (function_exists('imageantialias')) {
        imageantialias($image, true);
    }

    $cream = iceSocialReportColor($image, '#fff7df');
    $brandYellow = iceSocialReportColor($image, '#ffb522');
    imagefilledrectangle($image, 0, 0, ICE_SOCIAL_STORY_WIDTH, ICE_SOCIAL_STORY_HEIGHT, $cream);

    imagefilledrectangle($image, 0, 0, ICE_SOCIAL_STORY_WIDTH, 260, $brandYellow);
    iceSocialReportGradient($image, '#ffb522', '#fff7df', 0, 260, ICE_SOCIAL_STORY_WIDTH, 430);
    iceSocialReportCircle($image, 880, 120, 300, '#ffd66a', 70);
    iceSocialReportCircle($image, 110, 1660, 360, '#c9f0ff', 55);
    iceSocialReportCircle($image, 1010, 1790, 300, '#ffe7a8', 80);

    return $image;
}

function iceSocialReportRenderHighlights($image, array $report): void
{
    iceSocialReportHeader($image, $report, $report['label'] . 'report');

    $portionen = (int)$report['metrics']['portionen'];
    $periodPrefix = (($report['type'] ?? '') === 'monthly') ? 'im ' : 'in ';
    $headline = iceSocialReportFormatNumber($portionen) . ' Eisportionen ' . $periodPrefix . iceSocialReportPeriodLabel($report);
    iceSocialReportWrapText($image, $headline, 90, 430, 900, 64, '#2f2100', 'bold', 1.08);

    iceSocialReportHeroNumberPanel(
        $image,
        90,
        560,
        900,
        520,
        $portionen,
        'Portionen Eis wurden in der Ice-App festgehalten.',
        '#14923a'
    );

    iceSocialReportMiniStat($image, 90, 1180, 280, 'Check-ins', $report['metrics']['checkins'], '#2d7ff9');
    iceSocialReportMiniStat($image, 400, 1180, 280, 'Aktive Nutzer', $report['metrics']['aktive_nutzer'], '#ff7a59');
    iceSocialReportMiniStat($image, 710, 1180, 280, 'Neue Awards', $report['metrics']['neue_awards'], '#8a5cf6');

    iceSocialReportPanel($image, 90, 1480, 900, 210, '#ffffff', '#f3c15b');
    iceSocialReportWrapText(
        $image,
        'Danke an alle, die ihre Eisrunde geteilt haben.',
        130,
        1575,
        820,
        36,
        '#503000',
        'bold',
        1.14
    );

    iceSocialReportFooter($image);
}

function iceSocialReportRenderCommunity($image, array $report): void
{
    iceSocialReportHeader($image, $report, 'Community');
    $neueEisdielen = (int)$report['metrics']['neue_eisdielen'];
    iceSocialReportWrapText(
        $image,
        iceSocialReportFormatNumber($neueEisdielen) . ' neue Eisdielen auf der Karte',
        90,
        430,
        900,
        62,
        '#2f2100',
        'bold',
        1.08
    );

    iceSocialReportHeroNumberPanel(
        $image,
        90,
        560,
        900,
        470,
        $neueEisdielen,
        'Neue Orte sind im Zeitraum auf der Ice-App-Karte gelandet.',
        '#14923a'
    );

    $items = [
        ['Neue Nutzer', $report['metrics']['neue_nutzer'], '#2d7ff9'],
        ['Länder mit Check-ins', $report['metrics']['laender_mit_checkins'], '#ff7a59'],
    ];

    $y = 1120;
    foreach ($items as $item) {
        iceSocialReportCompactStatCard($image, 90, $y, 900, 180, $item[0], $item[1], $item[2]);
        $y += 210;
    }

    iceSocialReportPanel($image, 90, 1550, 900, 140, '#ffffff', '#b7e1ff');
    iceSocialReportWrapText(
        $image,
        'Danke an alle, die neue Orte und Preise melden.',
        130,
        1635,
        810,
        34,
        '#2f2100',
        'bold',
        1.12
    );

    iceSocialReportFooter($image);
}

function iceSocialReportRenderDistribution($image, array $report): void
{
    iceSocialReportHeader($image, $report, 'Check-ins');
    $topType = iceSocialReportTopDistributionItem($report['distributions']['typ']);
    $headline = $topType !== null
        ? $topType['percent'] . '% der Check-ins waren ' . $topType['label']
        : 'Was wurde eingecheckt?';
    iceSocialReportWrapText($image, $headline, 90, 415, 900, 52, '#2f2100', 'bold', 1.08);

    iceSocialReportPiePanel($image, 90, 520, 900, 350, 'Nach Typ', $report['distributions']['typ'], ['#2d7ff9', '#ffb522', '#ff7a59', '#8a5cf6']);
    iceSocialReportPiePanel($image, 90, 925, 900, 350, 'Anreise', $report['distributions']['anreise'], ['#14923a', '#2d7ff9', '#ff7a59', '#8a5cf6']);
    iceSocialReportPiePanel($image, 90, 1330, 900, 350, 'Fotos', $report['distributions']['bild'], ['#ff7a59', '#2d7ff9', '#14923a']);

    iceSocialReportFooter($image);
}

function iceSocialReportRenderTotals($image, array $report): void
{
    iceSocialReportHeader($image, $report, 'Gesamtstatistik');
    iceSocialReportText($image, 'Die Ice-App wächst', 90, 405, 62, '#2f2100', 'bold');
    iceSocialReportWrapText($image, 'Gesamtstand der Community-Karte', 90, 475, 880, 34, '#503000', 'regular', 1.15);

    iceSocialReportMetricCard($image, 90, 620, 900, 235, 'Nutzer insgesamt', $report['metrics']['gesamt_nutzer'], '#2d7ff9');
    iceSocialReportMetricCard($image, 90, 920, 900, 235, 'Check-ins insgesamt', $report['metrics']['gesamt_checkins'], '#14923a');
    iceSocialReportMetricCard($image, 90, 1220, 900, 235, 'Eisdielen insgesamt', $report['metrics']['gesamt_eisdielen'], '#ff7a59');

    iceSocialReportPanel($image, 90, 1540, 900, 160, '#ffffff', '#f3c15b');
    iceSocialReportWrapText($image, 'Danke an alle, die Preise melden, Fotos teilen und neue Eisdielen eintragen.', 130, 1628, 820, 32, '#503000', 'bold', 1.16);
    iceSocialReportFooter($image);
}

function iceSocialReportHeader($image, array $report, string $title): void
{
    iceSocialReportLogo($image, 70, 40, 220);
    iceSocialReportText($image, $title, 330, 135, 58, '#2f2100', 'bold');
    iceSocialReportText($image, $report['period'], 330, 190, 30, '#503000', 'regular');
}

function iceSocialReportFooter($image): void
{
    iceSocialReportText($image, 'ice-app.de', 90, 1810, 32, '#503000', 'bold');
    iceSocialReportText($image, 'Community-Report', 700, 1810, 24, '#7a5a00', 'regular');
}

function iceSocialReportMetricCard($image, int $x, int $y, int $w, int $h, string $label, $value, string $accent): void
{
    iceSocialReportPanel($image, $x, $y, $w, $h, '#ffffff', $accent);
    iceSocialReportText($image, iceSocialReportFormatNumber($value), $x + 42, $y + 92, $w > 500 ? 78 : 70, '#2f2100', 'bold');
    iceSocialReportWrapText($image, $label, $x + 46, $y + 170, $w - 92, 34, '#503000', 'bold', 1.1);
}

function iceSocialReportHeroNumberPanel($image, int $x, int $y, int $w, int $h, $value, string $label, string $accent): void
{
    iceSocialReportPanel($image, $x, $y, $w, $h, '#ffffff', $accent);
    iceSocialReportText($image, iceSocialReportFormatNumber($value), $x + 58, $y + 205, 150, '#2f2100', 'bold');
    iceSocialReportWrapText($image, $label, $x + 65, $y + 315, $w - 130, 42, '#503000', 'bold', 1.12);
}

function iceSocialReportMiniStat($image, int $x, int $y, int $w, string $label, $value, string $accent): void
{
    iceSocialReportPanel($image, $x, $y, $w, 210, '#ffffff', $accent);
    iceSocialReportText($image, iceSocialReportFormatNumber($value), $x + 34, $y + 76, 56, '#2f2100', 'bold');
    iceSocialReportWrapText($image, $label, $x + 36, $y + 130, $w - 72, 26, '#503000', 'bold', 1.05);
}

function iceSocialReportCompactStatCard($image, int $x, int $y, int $w, int $h, string $label, $value, string $accent): void
{
    iceSocialReportPanel($image, $x, $y, $w, $h, '#ffffff', $accent);
    iceSocialReportText($image, iceSocialReportFormatNumber($value), $x + 42, $y + 78, 66, '#2f2100', 'bold');
    iceSocialReportText($image, $label, $x + 260, $y + 72, 34, '#503000', 'bold');
    iceSocialReportWrapText($image, iceSocialReportCommunityHint($label), $x + 260, $y + 122, 580, 24, '#7a5a00', 'regular', 1.22);
}

function iceSocialReportCommunityHint(string $label): string
{
    if ($label === 'Neue Nutzer') {
        return 'Frische Community-Mitglieder im Zeitraum.';
    }
    if ($label === 'Neue Eisdielen') {
        return 'Neue Orte, die auf der Karte gelandet sind.';
    }
    if ($label === 'Länder mit Check-ins') {
        return 'Länder, aus denen Check-ins kamen.';
    }
    return 'Länder, aus denen Check-ins kamen.';
}

function iceSocialReportPiePanel($image, int $x, int $y, int $w, int $h, string $title, array $rows, array $colors): void
{
    iceSocialReportPanel($image, $x, $y, $w, $h, '#ffffff', $colors[0]);
    iceSocialReportText($image, $title, $x + 40, $y + 58, 34, '#2f2100', 'bold');

    $normalized = iceSocialReportNormalizeDistribution($rows);
    if (empty($normalized)) {
        iceSocialReportText($image, 'Keine Daten in diesem Zeitraum', $x + 40, $y + 145, 30, '#7a5a00', 'regular');
        return;
    }

    $normalized = array_slice($normalized, 0, 4);
    $total = array_sum(array_column($normalized, 'value'));
    iceSocialReportPieChart($image, $x + 170, $y + 205, 180, $normalized, $colors);

    $legendY = $y + 105;
    foreach ($normalized as $index => $row) {
        $color = $colors[$index % count($colors)];
        $percent = $total > 0 ? (int)round($row['value'] / $total * 100) : 0;
        iceSocialReportRoundedRect($image, $x + 350, $legendY - 24, 28, 28, 8, $color);
        iceSocialReportWrapText($image, $row['label'], $x + 395, $legendY, 280, 27, '#503000', 'bold', 1.05);
        iceSocialReportText($image, iceSocialReportFormatNumber($row['value']) . ' / ' . $percent . '%', $x + 690, $legendY, 27, '#2f2100', 'bold');
        $legendY += 60;
    }
}

function iceSocialReportPieChart($image, int $centerX, int $centerY, int $diameter, array $rows, array $colors): void
{
    $total = array_sum(array_column($rows, 'value'));
    if ($total <= 0) {
        return;
    }

    $start = -90.0;
    foreach ($rows as $index => $row) {
        $angle = 360.0 * $row['value'] / $total;
        $end = $start + $angle;
        imagefilledarc(
            $image,
            $centerX,
            $centerY,
            $diameter,
            $diameter,
            (int)round($start),
            (int)round($end),
            iceSocialReportColor($image, $colors[$index % count($colors)]),
            IMG_ARC_PIE
        );
        $start = $end;
    }

    imagefilledellipse($image, $centerX, $centerY, (int)round($diameter * 0.46), (int)round($diameter * 0.46), iceSocialReportColor($image, '#ffffff'));
}

function iceSocialReportNormalizeDistribution(array $rows): array
{
    $normalized = [];
    foreach ($rows as $row) {
        $label = (string)($row['typ'] ?? $row['anreise'] ?? $row['bild_status'] ?? $row['label'] ?? 'Unbekannt');
        $value = (int)($row['anzahl'] ?? $row['value'] ?? 0);
        if ($label === '') {
            $label = 'Unbekannt';
        }
        if ($value > 0) {
            $normalized[] = ['label' => $label, 'value' => $value];
        }
    }

    usort($normalized, function ($a, $b) {
        return $b['value'] <=> $a['value'];
    });
    return $normalized;
}

function iceSocialReportTopDistributionItem(array $rows): ?array
{
    $normalized = iceSocialReportNormalizeDistribution($rows);
    if (empty($normalized)) {
        return null;
    }

    $total = array_sum(array_column($normalized, 'value'));
    if ($total <= 0) {
        return null;
    }

    $top = $normalized[0];
    $top['percent'] = (int)round($top['value'] / $total * 100);
    return $top;
}

function iceSocialReportPeriodLabel(array $report): string
{
    if (($report['type'] ?? '') === 'monthly') {
        return iceSocialReportMonthName($report['start']);
    }

    return 'der Woche';
}

function iceSocialReportMonthName(DateTimeInterface $date): string
{
    $months = [
        1 => 'Januar',
        2 => 'Februar',
        3 => 'März',
        4 => 'April',
        5 => 'Mai',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'August',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Dezember',
    ];

    return $months[(int)$date->format('n')] ?? $date->format('m.Y');
}

function iceSocialReportBestHeadline(array $report): string
{
    $metrics = $report['metrics'];
    if ((int)$metrics['portionen'] > 0) {
        return iceSocialReportFormatNumber($metrics['portionen']) . ' Portionen Eis wurden in diesem Zeitraum in der Ice-App festgehalten.';
    }
    if ((int)$metrics['checkins'] > 0) {
        return iceSocialReportFormatNumber($metrics['checkins']) . ' Check-ins zeigen, wo die Community unterwegs war.';
    }
    if ((int)$metrics['neue_eisdielen'] > 0) {
        return iceSocialReportFormatNumber($metrics['neue_eisdielen']) . ' neue Eisdielen sind auf der Karte gelandet.';
    }
    return 'Ein ruhiger Zeitraum, aber die Ice-App-Karte bleibt bereit für die nächste Eisrunde.';
}

function iceSocialReportLogo($image, int $x, int $y, int $size): void
{
    $paths = [
        iceSocialReportProjectRoot() . '/logo512.png',
        iceSocialReportProjectRoot() . '/public/logo512.png',
        dirname(__DIR__) . '/logo512.png',
        dirname(__DIR__) . '/public/logo512.png',
        __DIR__ . '/../../public/logo512.png',
    ];

    if (!empty($_SERVER['DOCUMENT_ROOT'])) {
        $paths[] = rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/\\') . '/logo512.png';
        $paths[] = rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/\\') . '/public/logo512.png';
    }

    $path = null;
    foreach ($paths as $candidate) {
        $realPath = realpath($candidate);
        if ($realPath !== false && is_file($realPath) && is_readable($realPath)) {
            $path = $realPath;
            break;
        }
    }

    if ($path === null) {
        error_log('Ice-App Social Report: logo512.png wurde nicht gefunden.');
        iceSocialReportLogoFallback($image, $x, $y, $size);
        return;
    }

    $logoData = @file_get_contents($path);
    $logo = $logoData !== false && function_exists('imagecreatefromstring')
        ? @imagecreatefromstring($logoData)
        : false;

    if ($logo === false && function_exists('imagecreatefrompng')) {
        $logo = @imagecreatefrompng($path);
    }

    if ($logo === false) {
        error_log('Ice-App Social Report: logo512.png konnte nicht geladen werden: ' . $path);
        iceSocialReportLogoFallback($image, $x, $y, $size);
        return;
    }

    imagealphablending($image, true);
    imagesavealpha($image, true);
    imagecopyresampled($image, $logo, $x, $y, 0, 0, $size, $size, imagesx($logo), imagesy($logo));
    imagedestroy($logo);
}

function iceSocialReportLogoFallback($image, int $x, int $y, int $size): void
{
    iceSocialReportRoundedRect($image, $x, $y, $size, $size, 24, '#ffb522');
    iceSocialReportText($image, 'Ice', $x + 22, $y + 54, 28, '#2f2100', 'bold');
    iceSocialReportText($image, 'App', $x + 22, $y + 90, 28, '#2f2100', 'bold');
}

function iceSocialReportPanel($image, int $x, int $y, int $w, int $h, string $fill, string $accent): void
{
    iceSocialReportRoundedRect($image, $x + 8, $y + 12, $w, $h, 34, '#e2aa42', 45);
    iceSocialReportRoundedRect($image, $x, $y, $w, $h, 34, $fill);
    iceSocialReportRoundedRect($image, $x, $y, 18, $h, 9, $accent);
}

function iceSocialReportRoundedRect($image, int $x, int $y, int $w, int $h, int $r, string $hex, int $alpha = 0): void
{
    $color = iceSocialReportColor($image, $hex, $alpha);
    imagefilledrectangle($image, $x + $r, $y, $x + $w - $r, $y + $h, $color);
    imagefilledrectangle($image, $x, $y + $r, $x + $w, $y + $h - $r, $color);
    imagefilledellipse($image, $x + $r, $y + $r, $r * 2, $r * 2, $color);
    imagefilledellipse($image, $x + $w - $r, $y + $r, $r * 2, $r * 2, $color);
    imagefilledellipse($image, $x + $r, $y + $h - $r, $r * 2, $r * 2, $color);
    imagefilledellipse($image, $x + $w - $r, $y + $h - $r, $r * 2, $r * 2, $color);
}

function iceSocialReportCircle($image, int $x, int $y, int $diameter, string $hex, int $alpha = 0): void
{
    imagefilledellipse($image, $x, $y, $diameter, $diameter, iceSocialReportColor($image, $hex, $alpha));
}

function iceSocialReportDrawCone($image, int $x, int $y, int $size): void
{
    $cone = iceSocialReportColor($image, '#c9882f');
    $scoop = iceSocialReportColor($image, '#fff7df');
    $outline = iceSocialReportColor($image, '#2f2100');
    $centerX = (int)round($x + $size / 2);
    imagefilledpolygon($image, [$x + 25, $y + 125, $x + $size - 25, $y + 125, $centerX, $y + $size + 105], 3, $cone);
    imagefilledellipse($image, $centerX, $y + 80, $size, $size, $scoop);
    imagesetthickness($image, 7);
    imagearc($image, $centerX, $y + 80, $size, $size, 180, 360, $outline);
    imageline($image, $x + 25, $y + 125, $centerX, $y + $size + 105, $outline);
    imageline($image, $x + $size - 25, $y + 125, $centerX, $y + $size + 105, $outline);
}

function iceSocialReportGradient($image, string $from, string $to, int $x, int $y, int $w, int $h): void
{
    [$r1, $g1, $b1] = iceSocialReportRgb($from);
    [$r2, $g2, $b2] = iceSocialReportRgb($to);
    for ($i = 0; $i < $h; $i++) {
        $ratio = $i / max(1, $h - 1);
        $color = imagecolorallocate(
            $image,
            (int)round($r1 + ($r2 - $r1) * $ratio),
            (int)round($g1 + ($g2 - $g1) * $ratio),
            (int)round($b1 + ($b2 - $b1) * $ratio)
        );
        imageline($image, $x, $y + $i, $x + $w, $y + $i, $color);
    }
}

function iceSocialReportText($image, string $text, int $x, int $y, int $size, string $hex, string $weight = 'regular'): void
{
    $font = iceSocialReportFont($weight);
    $color = iceSocialReportColor($image, $hex);
    if ($font !== '') {
        iceSocialReportTrueTypeText($image, $text, $x, $y, $size, $color, $font, $weight);
        return;
    }

    iceSocialReportScaledBuiltinText($image, $text, $x, $y, $size, $color);
}

function iceSocialReportTrueTypeText($image, string $text, int $x, int $y, int $size, int $color, string $font, string $weight): void
{
    imagettftext($image, $size, 0, $x, $y, $color, $font, $text);
    if ($weight === 'bold') {
        imagettftext($image, $size, 0, $x + 1, $y, $color, $font, $text);
    }
}

function iceSocialReportWrapText($image, string $text, int $x, int $y, int $maxWidth, int $size, string $hex, string $weight = 'regular', float $lineHeight = 1.2): void
{
    $font = iceSocialReportFont($weight);
    if ($font === '') {
        iceSocialReportWrapBuiltinText($image, $text, $x, $y, $maxWidth, $size, $hex, $lineHeight);
        return;
    }

    $words = preg_split('/\s+/', $text);
    $line = '';
    foreach ($words as $word) {
        $test = trim($line . ' ' . $word);
        $box = imagettfbbox($size, 0, $font, $test);
        $width = $box[2] - $box[0];
        if ($width > $maxWidth && $line !== '') {
            iceSocialReportText($image, $line, $x, $y, $size, $hex, $weight);
            $line = $word;
            $y += (int)round($size * $lineHeight);
        } else {
            $line = $test;
        }
    }

    if ($line !== '') {
        iceSocialReportText($image, $line, $x, $y, $size, $hex, $weight);
    }
}

function iceSocialReportScaledBuiltinText($image, string $text, int $x, int $baselineY, int $size, int $color): void
{
    $font = 5;
    $encoded = iceSocialReportBuiltinTextEncoding($text);
    $scale = max(1.0, $size / 15);
    $sourceWidth = max(1, imagefontwidth($font) * strlen($encoded));
    $sourceHeight = imagefontheight($font);
    $targetWidth = (int)round($sourceWidth * $scale);
    $targetHeight = (int)round($sourceHeight * $scale);
    $source = imagecreatetruecolor($sourceWidth, $sourceHeight);

    imagealphablending($source, false);
    imagesavealpha($source, true);
    $transparent = imagecolorallocatealpha($source, 0, 0, 0, 127);
    imagefilledrectangle($source, 0, 0, $sourceWidth, $sourceHeight, $transparent);
    imagestring($source, $font, 0, 0, $encoded, $color);

    imagecopyresampled($image, $source, $x, $baselineY - $targetHeight, 0, 0, $targetWidth, $targetHeight, $sourceWidth, $sourceHeight);
    imagedestroy($source);
}

function iceSocialReportWrapBuiltinText($image, string $text, int $x, int $y, int $maxWidth, int $size, string $hex, float $lineHeight = 1.2): void
{
    $color = iceSocialReportColor($image, $hex);
    $words = preg_split('/\s+/', $text);
    $line = '';

    foreach ($words as $word) {
        $test = trim($line . ' ' . $word);
        if (iceSocialReportBuiltinTextWidth($test, $size) > $maxWidth && $line !== '') {
            iceSocialReportScaledBuiltinText($image, $line, $x, $y, $size, $color);
            $line = $word;
            $y += (int)round($size * $lineHeight);
        } else {
            $line = $test;
        }
    }

    if ($line !== '') {
        iceSocialReportScaledBuiltinText($image, $line, $x, $y, $size, $color);
    }
}

function iceSocialReportBuiltinTextWidth(string $text, int $size): int
{
    $font = 5;
    $encoded = iceSocialReportBuiltinTextEncoding($text);
    $scale = max(1.0, $size / 15);
    return (int)round(imagefontwidth($font) * strlen($encoded) * $scale);
}

function iceSocialReportBuiltinTextEncoding(string $text): string
{
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
        if ($converted !== false) {
            return $converted;
        }
    }

    return $text;
}

function iceSocialReportFormatNumber($value): string
{
    return number_format((int)$value, 0, ',', '.');
}

function iceSocialReportBuildMultipartMail(string $html, array $attachments): array
{
    $boundary = 'ice_report_' . md5((string)microtime(true));
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"" . $boundary . "\"\r\n";
    $headers .= "From: noreply@ice-app.de\r\n";

    $body = "--" . $boundary . "\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $html . "\r\n";

    foreach ($attachments as $path) {
        if (!is_file($path) || !is_readable($path)) {
            continue;
        }

        $filename = basename($path);
        $body .= "--" . $boundary . "\r\n";
        $body .= "Content-Type: image/png; name=\"" . $filename . "\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= "Content-Disposition: attachment; filename=\"" . $filename . "\"\r\n\r\n";
        $body .= chunk_split(base64_encode((string)file_get_contents($path))) . "\r\n";
    }

    $body .= "--" . $boundary . "--\r\n";

    return [$headers, $body];
}

function iceSocialReportStoryMailLabel(string $path): string
{
    $filename = basename($path);
    if (strpos($filename, 'optional') !== false) {
        return $path . ' (optional)';
    }

    return $path;
}

function iceSocialReportColor($image, string $hex, int $alpha = 0): int
{
    [$r, $g, $b] = iceSocialReportRgb($hex);
    return imagecolorallocatealpha($image, $r, $g, $b, max(0, min(127, $alpha)));
}

function iceSocialReportRgb(string $hex): array
{
    $hex = ltrim($hex, '#');
    return [
        hexdec(substr($hex, 0, 2)),
        hexdec(substr($hex, 2, 2)),
        hexdec(substr($hex, 4, 2)),
    ];
}
