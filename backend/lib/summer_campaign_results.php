<?php

require_once __DIR__ . '/summer_campaign.php';

function getSummerCampaignResults(PDO $pdo, string $campaignId = SUMMER_CAMPAIGN_ID, ?DateTimeImmutable $now = null): array
{
    // Reading historical results must not initialize tables or grant awards.
    $stmt = $pdo->prepare('SELECT campaign_id, title, starts_at, ends_at FROM summer_campaign_config WHERE campaign_id = :campaign_id');
    $stmt->execute(['campaign_id' => $campaignId]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$config) {
        throw new RuntimeException('Sommeraktion nicht gefunden.');
    }

    $timezone = new DateTimeZone('Europe/Berlin');
    $now = $now ?? new DateTimeImmutable('now', $timezone);
    if (empty($config['ends_at']) || $now <= new DateTimeImmutable($config['ends_at'], $timezone)) {
        throw new DomainException('Die Auswertung ist nach Ende der Sommeraktion verfügbar.');
    }

    $scanConditions = ['uqs.qr_code_id = scs.qr_code_id', 'uqs.scanned_at <= :scan_end'];
    $checkinConditions = ['c.nutzer_id = n.id', 'c.eisdiele_id = scs.eisdiele_id', 'c.datum <= :checkin_end'];
    $params = ['campaign_id' => $campaignId, 'scan_end' => $config['ends_at'], 'checkin_end' => $config['ends_at']];
    if (!empty($config['starts_at'])) {
        $scanConditions[] = 'uqs.scanned_at >= :scan_start';
        $checkinConditions[] = 'c.datum >= :checkin_start';
        $params['scan_start'] = $config['starts_at'];
        $params['checkin_start'] = $config['starts_at'];
    }

    $scanJoin = implode(' AND ', $scanConditions);
    $checkinWhere = implode(' AND ', $checkinConditions);
    $stmt = $pdo->prepare(
        "SELECT scs.id AS summer_shop_id, scs.eisdiele_id AS shop_id, e.name AS shop_name,
                al.icon_path AS award_icon, n.id AS user_id, n.username,
                CASE WHEN EXISTS (SELECT 1 FROM checkins c WHERE {$checkinWhere})
                     THEN 1 ELSE 0 END AS checkin_confirmed
         FROM summer_campaign_shops scs
         JOIN eisdielen e ON e.id = scs.eisdiele_id
         LEFT JOIN award_levels al ON al.award_id = scs.award_id AND al.level = scs.award_level
         LEFT JOIN user_qr_scans uqs ON {$scanJoin}
         LEFT JOIN nutzer n ON n.id = uqs.user_id
         WHERE scs.campaign_id = :campaign_id AND scs.is_active = 1
         ORDER BY e.name, n.username, n.id"
    );
    $stmt->execute($params);

    return buildSummerCampaignResults($config, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function buildSummerCampaignResults(array $config, array $rows): array
{
    $shops = [];
    $users = [];
    $collections = [];
    foreach ($rows as $row) {
        $shopId = (int)$row['summer_shop_id'];
        if (!isset($shops[$shopId])) {
            $shops[$shopId] = [
                'summer_shop_id' => $shopId,
                'shop_id' => (int)$row['shop_id'],
                'shop_name' => $row['shop_name'],
                'award_icon' => $row['award_icon'],
                'scan_count' => 0,
                'checkin_count' => 0,
            ];
        }

        $userId = (int)($row['user_id'] ?? 0);
        if ($userId <= 0) {
            continue;
        }
        if (!isset($users[$userId])) {
            $users[$userId] = [
                'user_id' => $userId,
                'username' => $row['username'],
                'scan_count' => 0,
                'checkin_count' => 0,
            ];
        }

        // A card counts once, including when legacy data contains repeated scans.
        if (!isset($collections[$shopId][$userId])) {
            $collections[$shopId][$userId] = false;
            $shops[$shopId]['scan_count']++;
            $users[$userId]['scan_count']++;
        }
        if ((int)$row['checkin_confirmed'] === 1 && !$collections[$shopId][$userId]) {
            $collections[$shopId][$userId] = true;
            $shops[$shopId]['checkin_count']++;
            $users[$userId]['checkin_count']++;
        }
    }

    $ranking = array_values($users);
    usort($ranking, static fn(array $left, array $right): int =>
        $right['scan_count'] <=> $left['scan_count']
        ?: $right['checkin_count'] <=> $left['checkin_count']
        ?: strcasecmp($left['username'], $right['username'])
        ?: $left['user_id'] <=> $right['user_id']
    );
    $shopCount = count($shops);
    $rank = 0;
    $previousScore = null;
    $completeAlbums = 0;
    foreach ($ranking as $index => &$entry) {
        $score = [$entry['scan_count'], $entry['checkin_count']];
        if ($score !== $previousScore) {
            $rank = $index + 1;
            $previousScore = $score;
        }
        $entry['rank'] = $rank;
        $entry['album_complete'] = $shopCount > 0 && $entry['checkin_count'] === $shopCount;
        if ($entry['album_complete']) {
            $completeAlbums++;
        }
    }
    unset($entry);

    $shops = array_values($shops);
    usort($shops, static fn(array $left, array $right): int =>
        $right['scan_count'] <=> $left['scan_count']
        ?: $right['checkin_count'] <=> $left['checkin_count']
        ?: strcasecmp($left['shop_name'], $right['shop_name'])
    );

    return [
        'campaign' => [
            'id' => $config['campaign_id'],
            'title' => $config['title'],
            'starts_at' => $config['starts_at'],
            'ends_at' => $config['ends_at'],
        ],
        'summary' => [
            'participants' => count($ranking),
            'total_shops' => $shopCount,
            'collected' => array_sum(array_column($ranking, 'scan_count')),
            'confirmed' => array_sum(array_column($ranking, 'checkin_count')),
            'complete_albums' => $completeAlbums,
        ],
        'ranking' => $ranking,
        'shops' => $shops,
    ];
}
