<?php

require_once __DIR__ . '/social_report_stories.php';
require_once __DIR__ . '/tour_de_glace.php';

function iceTourDeGlaceBuildStorySlides(PDO $pdo, string $pack = 'all', int $limit = 5): array
{
    if (!extension_loaded('gd') || !function_exists('imagepng')) {
        throw new RuntimeException('GD ist nicht verfügbar. Story-Grafiken können nicht erzeugt werden.');
    }

    ensureTourDeGlaceTables($pdo);
    $pack = in_array($pack, ['rankings', 'participation', 'all'], true) ? $pack : 'all';
    $limit = max(3, min(8, $limit));
    $data = iceTourDeGlaceStoryData($pdo, $limit);
    $slides = [];

    if ($pack === 'rankings' || $pack === 'all') {
        $slides[] = [
            'filename' => '01_overview.png',
            'image' => iceTourDeGlaceRenderOverviewSlide($data),
        ];

        $index = 2;
        foreach (array_keys(iceTourDeGlaceJerseyMeta()) as $jersey) {
            $slides[] = [
                'filename' => sprintf('%02d_%s_wertung.png', $index++, $jersey),
                'image' => iceTourDeGlaceRenderRankingSlide($data, $jersey),
            ];
        }
    }

    if ($pack === 'participation' || $pack === 'all') {
        $slides[] = [
            'filename' => sprintf('%02d_mitmachen.png', count($slides) + 1),
            'image' => iceTourDeGlaceRenderParticipationSlide($data),
        ];
    }

    return $slides;
}

function iceTourDeGlaceStoryData(PDO $pdo, int $limit): array
{
    $config = tourDeGlaceConfig();
    $scopeValue = getTourDeGlacePointScopeValue(1);
    $summary = iceTourDeGlaceStorySummary($pdo, $scopeValue);
    $leaderboards = [];
    foreach (array_keys(iceTourDeGlaceJerseyMeta()) as $jersey) {
        $leaderboards[$jersey] = getTourDeGlaceLeaderboard($pdo, $jersey, $limit, false);
    }

    return [
        'config' => $config,
        'summary' => $summary,
        'leaderboards' => $leaderboards,
        'leaders' => getTourDeGlaceOfficialLeaders($pdo),
        'rider_distribution' => iceTourDeGlaceStoryRiderDistribution($pdo),
        'stage_count' => iceTourDeGlaceCompletedStageCount($config),
        'stage' => getCurrentTourDeGlaceStage(),
    ];
}

function iceTourDeGlaceStorySummary(PDO $pdo, int $scopeValue): array
{
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT user_id) AS active_users,
               COUNT(*) AS events,
               COALESCE(SUM(points_yellow + points_green + points_mountain + points_ice + points_white), 0) AS total_points
        FROM tour_de_glace_point_events
        WHERE campaign_id = ?
          AND is_shadow_test = ?
    ");
    $stmt->execute([TOUR_DE_GLACE_ID, $scopeValue]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $riderStmt = $pdo->prepare("SELECT COUNT(*) FROM tour_de_glace_user_profiles WHERE campaign_id = ?");
    $riderStmt->execute([TOUR_DE_GLACE_ID]);

    $tipsStmt = $pdo->prepare("SELECT COUNT(*) FROM tour_de_glace_tips WHERE campaign_id = ?");
    $tipsStmt->execute([TOUR_DE_GLACE_ID]);

    return [
        'active_users' => (int)($row['active_users'] ?? 0),
        'events' => (int)($row['events'] ?? 0),
        'total_points' => (int)($row['total_points'] ?? 0),
        'rider_count' => (int)$riderStmt->fetchColumn(),
        'tips_count' => (int)$tipsStmt->fetchColumn(),
    ];
}

function iceTourDeGlaceStoryRiderDistribution(PDO $pdo): array
{
    $config = tourDeGlaceConfig();
    $stmt = $pdo->prepare("
        SELECT rider_type, COUNT(*) AS count
        FROM tour_de_glace_user_profiles
        WHERE campaign_id = ?
        GROUP BY rider_type
        ORDER BY count DESC, rider_type ASC
        LIMIT 5
    ");
    $stmt->execute([TOUR_DE_GLACE_ID]);
    return array_map(static fn(array $row): array => [
        'label' => $config['rider_types'][$row['rider_type']]['name'] ?? $row['rider_type'],
        'count' => (int)$row['count'],
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function iceTourDeGlaceCompletedStageCount(array $config): int
{
    $now = getTourDeGlaceNow();
    $count = 0;
    foreach ($config['stages'] as $stage) {
        $stageDate = new DateTimeImmutable($stage['date'] . ' 00:00:00', tourDeGlaceTimezone());
        if ($stageDate <= $now) {
            $count++;
        }
    }
    return min(count($config['stages']), max(0, $count));
}

function iceTourDeGlaceJerseyMeta(): array
{
    return [
        'yellow' => ['label' => 'Gelbes Trikot', 'short' => 'Gelb', 'color' => '#f6c945', 'asset' => 'jersey_yellow.png', 'cta' => 'Konstant punkten und dranbleiben'],
        'green' => ['label' => 'Grünes Trikot', 'short' => 'Grün', 'color' => '#1f9d55', 'asset' => 'jersey_green.png', 'cta' => 'Likes, Kommentare und Etappen sammeln'],
        'mountain' => ['label' => 'Bergtrikot', 'short' => 'Berg', 'color' => '#d93123', 'asset' => 'jersey_mountain.png', 'cta' => 'Mit dem Rad einchecken'],
        'ice' => ['label' => 'Eiscreme-Trikot', 'short' => 'Eiscreme', 'color' => '#fca2b7', 'asset' => 'jersey_ice.png', 'cta' => 'Eis-Check-ins und Fotos sammeln'],
        'white' => ['label' => 'Weißes Trikot', 'short' => 'Weiß', 'color' => '#f4f4f4', 'asset' => 'jersey_white.png', 'cta' => 'Einsteigen und erste Punkte holen'],
    ];
}

function iceTourDeGlaceRenderBase(string $section)
{
    $image = iceSocialReportCreateCanvas();
    iceSocialReportLogo($image, 70, 40, 220);
    iceSocialReportWrapText($image, 'Tour de Glace', 330, 125, 680, 52, '#2f2100', 'bold', 1.08);
    iceSocialReportWrapText($image, $section, 330, 188, 680, 30, '#503000', 'regular', 1.1);
    iceSocialReportText($image, 'ice-app.de', 90, 1810, 32, '#503000', 'bold');
    iceSocialReportText($image, 'Tour de Glace', 690, 1810, 24, '#7a5a00', 'regular');
    return $image;
}

function iceTourDeGlaceRenderOverviewSlide(array $data)
{
    $image = iceTourDeGlaceRenderBase('Aktueller Stand');
    $stageLabel = iceTourDeGlaceStageLabel($data);
    iceSocialReportWrapText($image, 'Wertung nach ' . $stageLabel, 90, 420, 900, 68, '#2f2100', 'bold', 1.04);
    iceSocialReportWrapText($image, 'Die Ice-App-Rundfahrt rollt. Jede Aktion kann Punkte bringen.', 90, 555, 840, 34, '#503000', 'regular', 1.16);

    iceTourDeGlaceStatCard($image, 90, 720, 420, 230, 'Aktive Fahrer', $data['summary']['active_users'], '#2d7ff9');
    iceTourDeGlaceStatCard($image, 570, 720, 420, 230, 'Tour-Punkte', $data['summary']['total_points'], '#14923a');
    iceTourDeGlaceStatCard($image, 90, 1015, 420, 230, 'Fahrertypen gewählt', $data['summary']['rider_count'], '#ff7a59');
    iceTourDeGlaceStatCard($image, 570, 1015, 420, 230, 'Tipps abgegeben', $data['summary']['tips_count'], '#8a5cf6');

    iceTourDeGlaceCta($image, 'Jetzt mitfahren', 90, 1475, '#14923a');
    return $image;
}

function iceTourDeGlaceRenderRankingSlide(array $data, string $jersey)
{
    $meta = iceTourDeGlaceJerseyMeta()[$jersey];
    $image = iceTourDeGlaceRenderBase($meta['label']);
    iceSocialReportWrapText($image, $meta['label'] . ': Wertung nach ' . iceTourDeGlaceStageLabel($data), 90, 405, 900, 56, '#2f2100', 'bold', 1.06);

    iceTourDeGlaceDrawJersey($image, $jersey, 90, 545, 285, 330);
    $official = $data['leaders'][$jersey]['official'] ?? null;
    $raw = $data['leaders'][$jersey]['raw'] ?? null;
    iceSocialReportPanel($image, 420, 560, 570, 260, '#ffffff', $meta['color']);
    iceSocialReportWrapText($image, 'Offizieller Träger', 465, 635, 490, 30, '#7a5a00', 'regular', 1.1);
    iceSocialReportWrapText($image, $official ? iceTourDeGlaceShortText($official['username'], 26) : 'Noch offen', 465, 705, 490, 46, '#2f2100', 'bold', 1.08);
    if ($official && $raw && (int)$official['user_id'] !== (int)$raw['user_id']) {
        iceSocialReportWrapText($image, 'Rechnerisch: ' . iceTourDeGlaceShortText($raw['username'], 24), 465, 775, 490, 25, '#503000', 'regular', 1.1);
    }

    iceSocialReportPanel($image, 90, 930, 900, 445, '#ffffff', $meta['color']);
    iceSocialReportText($image, 'Top 5', 135, 1000, 38, '#2f2100', 'bold');
    $y = 1065;
    $leaderboard = array_slice($data['leaderboards'][$jersey] ?? [], 0, 5);
    if (empty($leaderboard)) {
        iceSocialReportWrapText($image, 'Noch keine Punkte in dieser Wertung.', 135, 1145, 800, 34, '#503000', 'regular', 1.15);
    } else {
        foreach ($leaderboard as $entry) {
            iceTourDeGlaceRankingRow($image, $entry, $y, $meta['color']);
            $y += 62;
        }
    }

    iceTourDeGlaceCta($image, $meta['cta'], 90, 1490, $meta['color']);
    return $image;
}

function iceTourDeGlaceRenderParticipationSlide(array $data)
{
    $image = iceTourDeGlaceRenderBase('Mitmachen');
    iceSocialReportWrapText($image, 'Steig in die Tour ein', 90, 425, 900, 76, '#2f2100', 'bold', 1.04);
    iceSocialReportWrapText($image, 'Wähle deinen Fahrertyp, sammle Punkte und fahr um die Trikots mit.', 90, 555, 860, 36, '#503000', 'regular', 1.16);

    $items = [
        ['1', 'Fahrertyp wählen', 'Sprinter, Bergfloh, Fotograf oder Rookie: such dir deinen Stil.'],
        ['2', 'Etappe sichten', 'Tour-Marker auf der Karte finden und Punkte sichern.'],
        ['3', 'Punkte sammeln', 'Check-ins, Fotos, Bewertungen und Community-Aktionen zählen.'],
        ['4', 'Ruhmeshalle erreichen', 'Als offizieller Trikotträger bleibst du in der Ice-App sichtbar.'],
    ];
    $y = 710;
    foreach ($items as $item) {
        iceSocialReportPanel($image, 90, $y, 900, 145, '#ffffff', '#ffb522');
        iceSocialReportText($image, $item[0], 135, $y + 86, 54, '#2f2100', 'bold');
        iceSocialReportWrapText($image, $item[1], 230, $y + 58, 690, 31, '#2f2100', 'bold', 1.08);
        iceSocialReportWrapText($image, $item[2], 230, $y + 102, 690, 22, '#503000', 'regular', 1.16);
        $y += 165;
    }

    $distributionY = $y + 20;
    if (!empty($data['rider_distribution']) && $distributionY + 65 < 1535) {
        iceSocialReportWrapText($image, 'Beliebte Fahrertypen: ' . iceTourDeGlaceRiderDistributionText($data['rider_distribution']), 120, $distributionY, 840, 24, '#503000', 'regular', 1.14);
    }
    iceTourDeGlaceCta($image, 'Jetzt in die Tour starten', 90, 1535, '#14923a');
    return $image;
}

function iceTourDeGlaceStatCard($image, int $x, int $y, int $w, int $h, string $label, int $value, string $accent): void
{
    iceSocialReportPanel($image, $x, $y, $w, $h, '#ffffff', $accent);
    iceSocialReportText($image, iceSocialReportFormatNumber($value), $x + 42, $y + 92, 64, '#2f2100', 'bold');
    iceSocialReportWrapText($image, $label, $x + 46, $y + 155, $w - 92, 28, '#503000', 'bold', 1.08);
}

function iceTourDeGlaceRankingRow($image, array $entry, int $y, string $accent): void
{
    iceSocialReportRoundedRect($image, 130, $y - 35, 42, 42, 12, $accent);
    iceSocialReportText($image, '#' . (int)$entry['rank'], 190, $y, 28, '#2f2100', 'bold');
    iceSocialReportWrapText($image, iceTourDeGlaceShortText((string)$entry['username'], 24), 285, $y, 420, 28, '#2f2100', 'bold', 1.05);
    iceSocialReportText($image, iceSocialReportFormatNumber((int)$entry['points']) . ' Pkt.', 735, $y, 28, '#503000', 'bold');
}

function iceTourDeGlaceCta($image, string $text, int $x, int $y, string $accent): void
{
    iceSocialReportPanel($image, $x, $y, 900, 155, '#ffffff', $accent);
    iceSocialReportWrapText($image, $text, $x + 45, $y + 70, 710, 42, '#2f2100', 'bold', 1.08);
    $color = iceSocialReportColor($image, '#2f2100');
    imagesetthickness($image, 9);
    imageline($image, $x + 770, $y + 78, $x + 850, $y + 78, $color);
    imageline($image, $x + 850, $y + 78, $x + 822, $y + 52, $color);
    imageline($image, $x + 850, $y + 78, $x + 822, $y + 104, $color);
    imagesetthickness($image, 1);
}

function iceTourDeGlaceDrawJersey($image, string $jersey, int $x, int $y, int $w, int $h): void
{
    $meta = iceTourDeGlaceJerseyMeta()[$jersey];
    iceSocialReportRoundedRect($image, $x + 8, $y + 12, $w, $h, 28, '#d49c35', 45);
    iceSocialReportRoundedRect($image, $x, $y, $w, $h, 28, '#ffffff');
    $source = iceTourDeGlaceLoadAsset('public/assets/tour-de-glace/' . $meta['asset']);
    if (!$source) {
        iceSocialReportWrapText($image, $meta['short'], $x + 36, $y + 160, $w - 72, 42, '#2f2100', 'bold', 1.08);
        return;
    }
    $slotX = $x + 20;
    $slotY = $y + 20;
    $slotW = $w - 40;
    $slotH = $h - 40;
    $sourceW = imagesx($source);
    $sourceH = imagesy($source);
    $scale = min($slotW / max(1, $sourceW), $slotH / max(1, $sourceH));
    $targetW = (int)round($sourceW * $scale);
    $targetH = (int)round($sourceH * $scale);
    $targetX = $slotX + (int)round(($slotW - $targetW) / 2);
    $targetY = $slotY + (int)round(($slotH - $targetH) / 2);

    imagecopyresampled($image, $source, $targetX, $targetY, 0, 0, $targetW, $targetH, $sourceW, $sourceH);
    imagedestroy($source);
}

function iceTourDeGlaceLoadAsset(string $relativePath)
{
    $root = iceSocialReportProjectRoot();
    $candidates = [
        $root . '/' . ltrim($relativePath, '/'),
        $root . '/' . preg_replace('#^public/#', '', ltrim($relativePath, '/')),
    ];
    foreach ($candidates as $candidate) {
        $real = realpath($candidate);
        if ($real && is_file($real) && is_readable($real)) {
            $data = @file_get_contents($real);
            return $data !== false && function_exists('imagecreatefromstring') ? @imagecreatefromstring($data) : false;
        }
    }
    return false;
}

function iceTourDeGlaceStageLabel(array $data): string
{
    $stageCount = (int)($data['stage_count'] ?? 0);
    if ($stageCount === 1) {
        return '1 Etappe';
    }
    if ($stageCount > 1) {
        return $stageCount . ' Etappen';
    }
    return date('d.m.Y');
}

function iceTourDeGlaceRiderDistributionText(array $rows): string
{
    $parts = [];
    foreach (array_slice($rows, 0, 3) as $row) {
        $parts[] = $row['label'] . ' ' . iceSocialReportFormatNumber((int)$row['count']);
    }
    return implode(', ', $parts);
}

function iceTourDeGlaceShortText(string $text, int $limit): string
{
    $text = trim($text);
    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        return mb_strlen($text, 'UTF-8') > $limit ? mb_substr($text, 0, max(0, $limit - 3), 'UTF-8') . '...' : $text;
    }
    return strlen($text) > $limit ? substr($text, 0, max(0, $limit - 3)) . '...' : $text;
}
