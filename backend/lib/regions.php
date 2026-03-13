<?php

require_once __DIR__ . '/leaderboard_periods.php';

function getRegionShopIds(PDO $pdo, string $level, int $id): array
{
    if ($level === 'bundesland') {
        $stmt = $pdo->prepare("SELECT id FROM eisdielen WHERE bundesland_id = :id");
    } else {
        $stmt = $pdo->prepare("SELECT id FROM eisdielen WHERE landkreis_id = :id");
    }

    $stmt->execute(['id' => $id]);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function getRegionMeta(PDO $pdo, string $level, int $id): ?array
{
    if ($level === 'bundesland') {
        $stmt = $pdo->prepare(
            "SELECT b.id,
                    b.name,
                    b.iso_code,
                    l.id AS land_id,
                    l.name AS land_name,
                    COUNT(DISTINCT e.id) AS shop_count
             FROM bundeslaender b
             JOIN laender l ON l.id = b.land_id
             LEFT JOIN eisdielen e ON e.bundesland_id = b.id
             WHERE b.id = :id
             GROUP BY b.id, b.name, b.iso_code, l.id, l.name"
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        return [
            'level' => 'bundesland',
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'iso_code' => $row['iso_code'],
            'land' => [
                'id' => (int)$row['land_id'],
                'name' => $row['land_name'],
            ],
            'shop_count' => (int)$row['shop_count'],
        ];
    }

    $stmt = $pdo->prepare(
        "SELECT lk.id,
                lk.name,
                b.id AS bundesland_id,
                b.name AS bundesland_name,
                b.iso_code,
                l.id AS land_id,
                l.name AS land_name,
                COUNT(DISTINCT e.id) AS shop_count
         FROM landkreise lk
         JOIN bundeslaender b ON b.id = lk.bundesland_id
         JOIN laender l ON l.id = b.land_id
         LEFT JOIN eisdielen e ON e.landkreis_id = lk.id
         WHERE lk.id = :id
         GROUP BY lk.id, lk.name, b.id, b.name, b.iso_code, l.id, l.name"
    );
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    return [
        'level' => 'landkreis',
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'bundesland' => [
            'id' => (int)$row['bundesland_id'],
            'name' => $row['bundesland_name'],
            'iso_code' => $row['iso_code'],
        ],
        'land' => [
            'id' => (int)$row['land_id'],
            'name' => $row['land_name'],
        ],
        'shop_count' => (int)$row['shop_count'],
    ];
}

function getRegionTopShops(PDO $pdo, string $level, int $id): array
{
    $scopeWhere = buildShopScopeWhere($level, $id, 'e');
    $stmt = $pdo->query(
        "SELECT e.id,
                e.name,
                e.adresse,
                lk.name AS landkreis,
                b.name AS bundesland,
                ks.finaler_kugel_score AS kugel_score,
                ss.finaler_softeis_score AS softeis_score,
                es.finaler_eisbecher_score AS eisbecher_score,
                latest_kugel_price.preis AS kugel_preis,
                latest_kugel_price.gemeldet_am AS kugel_price_reported_at,
                latest_softeis_price.preis AS softeis_preis,
                latest_softeis_price.gemeldet_am AS softeis_price_reported_at,
                type_counts.kugel_checkins,
                type_counts.softeis_checkins,
                type_counts.eisbecher_checkins,
                type_counts.total_checkins,
                (
                    COALESCE(ks.finaler_kugel_score, 0) +
                    COALESCE(ss.finaler_softeis_score, 0) +
                    COALESCE(es.finaler_eisbecher_score, 0)
                ) / NULLIF(
                    (ks.finaler_kugel_score IS NOT NULL) +
                    (ss.finaler_softeis_score IS NOT NULL) +
                    (es.finaler_eisbecher_score IS NOT NULL),
                    0
                ) AS overall_score
         FROM eisdielen e
         LEFT JOIN landkreise lk ON lk.id = e.landkreis_id
         LEFT JOIN bundeslaender b ON b.id = e.bundesland_id
         LEFT JOIN kugel_scores ks ON ks.eisdiele_id = e.id
         LEFT JOIN softeis_scores ss ON ss.eisdiele_id = e.id
         LEFT JOIN eisbecher_scores es ON es.eisdiele_id = e.id
         LEFT JOIN (
            SELECT p1.eisdiele_id, p1.preis, p1.gemeldet_am
            FROM preise p1
            JOIN (
              SELECT eisdiele_id, MAX(gemeldet_am) AS max_reported_at
              FROM preise
              WHERE typ = 'kugel'
              GROUP BY eisdiele_id
            ) latest
              ON latest.eisdiele_id = p1.eisdiele_id
             AND latest.max_reported_at = p1.gemeldet_am
            WHERE p1.typ = 'kugel'
         ) latest_kugel_price ON latest_kugel_price.eisdiele_id = e.id
         LEFT JOIN (
            SELECT p1.eisdiele_id, p1.preis, p1.gemeldet_am
            FROM preise p1
            JOIN (
              SELECT eisdiele_id, MAX(gemeldet_am) AS max_reported_at
              FROM preise
              WHERE typ = 'softeis'
              GROUP BY eisdiele_id
            ) latest
              ON latest.eisdiele_id = p1.eisdiele_id
             AND latest.max_reported_at = p1.gemeldet_am
            WHERE p1.typ = 'softeis'
         ) latest_softeis_price ON latest_softeis_price.eisdiele_id = e.id
         LEFT JOIN (
            SELECT c.eisdiele_id,
                   SUM(CASE WHEN c.typ = 'Kugel' THEN 1 ELSE 0 END) AS kugel_checkins,
                   SUM(CASE WHEN c.typ = 'Softeis' THEN 1 ELSE 0 END) AS softeis_checkins,
                   SUM(CASE WHEN c.typ = 'Eisbecher' THEN 1 ELSE 0 END) AS eisbecher_checkins,
                   COUNT(*) AS total_checkins
            FROM checkins c
            GROUP BY c.eisdiele_id
         ) type_counts ON type_counts.eisdiele_id = e.id
         WHERE $scopeWhere
         HAVING overall_score IS NOT NULL
         ORDER BY overall_score DESC, COALESCE(type_counts.total_checkins, 0) DESC, e.name ASC"
    );

    return array_map(static function (array $row): array {
        return [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'adresse' => $row['adresse'],
            'landkreis' => $row['landkreis'],
            'bundesland' => $row['bundesland'],
            'kugel_score' => isset($row['kugel_score']) ? round((float)$row['kugel_score'], 2) : null,
            'softeis_score' => isset($row['softeis_score']) ? round((float)$row['softeis_score'], 2) : null,
            'eisbecher_score' => isset($row['eisbecher_score']) ? round((float)$row['eisbecher_score'], 2) : null,
            'overall_score' => isset($row['overall_score']) ? round((float)$row['overall_score'], 2) : null,
            'kugel_preis' => isset($row['kugel_preis']) ? (float)$row['kugel_preis'] : null,
            'softeis_preis' => isset($row['softeis_preis']) ? (float)$row['softeis_preis'] : null,
            'kugel_price_reported_at' => $row['kugel_price_reported_at'] ?? null,
            'softeis_price_reported_at' => $row['softeis_price_reported_at'] ?? null,
            'checkin_counts' => [
                'kugel' => isset($row['kugel_checkins']) ? (int)$row['kugel_checkins'] : 0,
                'softeis' => isset($row['softeis_checkins']) ? (int)$row['softeis_checkins'] : 0,
                'eisbecher' => isset($row['eisbecher_checkins']) ? (int)$row['eisbecher_checkins'] : 0,
                'total' => isset($row['total_checkins']) ? (int)$row['total_checkins'] : 0,
            ],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getRegionPriceSummary(PDO $pdo, string $level, int $id): array
{
    $scopeWhere = buildShopScopeWhere($level, $id, 'e');
    $stmt = $pdo->query(
        "SELECT current_prices.eisdiele_id,
                current_prices.preis,
                e.name
         FROM (
            SELECT p1.eisdiele_id, p1.preis
            FROM preise p1
            JOIN (
              SELECT eisdiele_id, MAX(gemeldet_am) AS max_reported_at
              FROM preise
              WHERE typ = 'kugel'
              GROUP BY eisdiele_id
            ) latest
              ON latest.eisdiele_id = p1.eisdiele_id
             AND latest.max_reported_at = p1.gemeldet_am
            WHERE p1.typ = 'kugel'
         ) current_prices
         JOIN eisdielen e ON e.id = current_prices.eisdiele_id
         WHERE $scopeWhere
         ORDER BY current_prices.preis ASC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $prices = array_map(static fn(array $row): float => (float)$row['preis'], $rows);
    $averagePrice = !empty($prices) ? round(array_sum($prices) / count($prices), 2) : null;

    return [
        'average_kugel_price' => $averagePrice,
        'priced_shop_count' => count($rows),
        'cheapest_shops' => array_map(static fn(array $row): array => [
            'id' => (int)$row['eisdiele_id'],
            'name' => $row['name'],
            'preis' => (float)$row['preis'],
        ], array_slice($rows, 0, 3)),
        'popular_shops' => getRegionPopularShops($pdo, $level, $id),
    ];
}

function getRegionPopularShops(PDO $pdo, string $level, int $id): array
{
    $scopeWhere = buildShopScopeWhere($level, $id, 'e');
    $stmt = $pdo->query(
        "SELECT e.id,
                e.name,
                COUNT(c.id) AS checkin_count
         FROM eisdielen e
         LEFT JOIN checkins c ON c.eisdiele_id = e.id
         WHERE $scopeWhere
         GROUP BY e.id, e.name
         HAVING checkin_count > 0
         ORDER BY checkin_count DESC, e.name ASC
         LIMIT 3"
    );

    return array_map(static fn(array $row): array => [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'checkin_count' => (int)$row['checkin_count'],
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getRegionPriceTrend(PDO $pdo, string $level, int $id): array
{
    $shopIds = getRegionShopIds($pdo, $level, $id);
    $points = [];
    $cursor = new DateTimeImmutable('first day of this month', new DateTimeZone('Europe/Berlin'));
    $cursor = $cursor->modify('-11 months');

    if (empty($shopIds)) {
        for ($i = 0; $i < 12; $i += 1) {
            $monthKey = $cursor->format('Y-m');
            $points[] = [
                'month_key' => $monthKey,
                'label' => $cursor->format('m/Y'),
                'average_price' => null,
                'reports' => 0,
            ];
            $cursor = $cursor->modify('+1 month');
        }

        return $points;
    }

    $placeholders = implode(', ', array_fill(0, count($shopIds), '?'));
    $trendStmt = $pdo->prepare(
        "SELECT latest_prices.eisdiele_id,
                latest_prices.preis
         FROM (
             SELECT p1.eisdiele_id, p1.preis
             FROM preise p1
             JOIN (
                 SELECT eisdiele_id, MAX(gemeldet_am) AS max_reported_at
                 FROM preise
                 WHERE typ = 'kugel'
                   AND gemeldet_am <= ?
                   AND eisdiele_id IN ($placeholders)
                 GROUP BY eisdiele_id
             ) latest
               ON latest.eisdiele_id = p1.eisdiele_id
              AND latest.max_reported_at = p1.gemeldet_am
             WHERE p1.typ = 'kugel'
         ) latest_prices"
    );

    for ($i = 0; $i < 12; $i += 1) {
        $monthKey = $cursor->format('Y-m');
        $monthEnd = $cursor->modify('last day of this month')->setTime(23, 59, 59);
        $params = array_merge([$monthEnd->format('Y-m-d H:i:s')], $shopIds);
        $trendStmt->execute($params);
        $rows = $trendStmt->fetchAll(PDO::FETCH_ASSOC);
        $prices = array_map(static fn(array $row): float => (float)$row['preis'], $rows);

        $points[] = [
            'month_key' => $monthKey,
            'label' => $cursor->format('m/Y'),
            'average_price' => !empty($prices) ? round(array_sum($prices) / count($prices), 2) : null,
            'reports' => count($rows),
        ];
        $cursor = $cursor->modify('+1 month');
    }

    return $points;
}
