<?php

function getPeriodWindow(string $period, ?string $periodKey = null): array
{
    date_default_timezone_set('Europe/Berlin');
    $timezone = new DateTimeZone('Europe/Berlin');
    $now = new DateTimeImmutable('now', $timezone);

    if ($period === 'overall') {
        $start = new DateTimeImmutable('2000-01-01 00:00:00', $timezone);
        return [
            'period' => 'overall',
            'label' => 'Gesamt',
            'start' => $start,
            'end' => $now,
            'key' => 'overall',
        ];
    }

    if ($period === 'month') {
        if ($periodKey && preg_match('/^\d{4}-\d{2}$/', $periodKey) === 1) {
            $start = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $periodKey . '-01 00:00:00', $timezone);
            if (!$start) {
                throw new InvalidArgumentException('Ungültiger period_key');
            }
        } else {
            $start = $now->modify('first day of this month')->setTime(0, 0, 0);
        }
        $end = $now->modify('last day of this month')->setTime(23, 59, 59);
        if ($start < $now->modify('first day of this month')->setTime(0, 0, 0)) {
            $end = $start->modify('last day of this month')->setTime(23, 59, 59);
        }
        return [
            'period' => 'month',
            'label' => 'Monat',
            'start' => $start,
            'end' => $end,
            'key' => $start->format('Y-m'),
        ];
    }

    if ($periodKey && preg_match('/^(\d{4})-W(\d{2})$/', $periodKey, $matches) === 1) {
        $start = (new DateTimeImmutable('now', $timezone))
            ->setISODate((int)$matches[1], (int)$matches[2], 1)
            ->setTime(0, 0, 0);
    } else {
        $start = $now->modify('monday this week')->setTime(0, 0, 0);
    }
    $end = $start->modify('+6 days')->setTime(23, 59, 59);
    return [
        'period' => 'week',
        'label' => 'Woche',
        'start' => $start,
        'end' => $end,
        'key' => $start->format('o-\WW'),
    ];
}

function listLeaderboardPeriods(string $period, int $limit = 16): array
{
    date_default_timezone_set('Europe/Berlin');
    $timezone = new DateTimeZone('Europe/Berlin');
    $now = new DateTimeImmutable('now', $timezone);

    if ($period === 'month') {
        $cursor = $now->modify('first day of this month')->setTime(0, 0, 0);
        $items = [];
        for ($i = 0; $i < $limit; $i += 1) {
            $items[] = [
                'key' => $cursor->format('Y-m'),
                'label' => $i === 0 ? 'Aktueller Monat' : $cursor->format('m/Y'),
            ];
            $cursor = $cursor->modify('-1 month');
        }
        return $items;
    }

    if ($period === 'week') {
        $cursor = $now->modify('monday this week')->setTime(0, 0, 0);
        $items = [];
        for ($i = 0; $i < $limit; $i += 1) {
            $weekEnd = $cursor->modify('+6 days');
            $items[] = [
                'key' => $cursor->format('o-\WW'),
                'label' => $i === 0
                    ? 'Aktuelle Woche'
                    : sprintf('%s - %s', $cursor->format('d.m.'), $weekEnd->format('d.m.Y')),
            ];
            $cursor = $cursor->modify('-7 days');
        }
        return $items;
    }

    return [];
}

function normalizeLeaderboardScope(?string $scope, ?int $scopeId): array
{
    $normalizedScope = $scope ?: 'global';
    if (!in_array($normalizedScope, ['global', 'bundesland', 'landkreis'], true)) {
        throw new InvalidArgumentException('Ungültiger Scope');
    }

    if ($normalizedScope !== 'global' && (!$scopeId || $scopeId <= 0)) {
        throw new InvalidArgumentException('scope_id fehlt oder ist ungültig');
    }

    return [
        'scope' => $normalizedScope,
        'scope_id' => $normalizedScope === 'global' ? null : $scopeId,
    ];
}

function buildShopScopeWhere(string $scope, int $scopeId, string $alias = 'e'): string
{
    if ($scope === 'bundesland') {
        return sprintf('%s.bundesland_id = %d', $alias, $scopeId);
    }

    if ($scope === 'landkreis') {
        return sprintf('%s.landkreis_id = %d', $alias, $scopeId);
    }

    return '1=1';
}

function buildShopScopeNotWhere(string $scope, int $scopeId, string $alias = 'e'): string
{
    if ($scope === 'bundesland') {
        return sprintf('(%s.bundesland_id IS NULL OR %s.bundesland_id <> %d)', $alias, $alias, $scopeId);
    }

    if ($scope === 'landkreis') {
        return sprintf('(%s.landkreis_id IS NULL OR %s.landkreis_id <> %d)', $alias, $alias, $scopeId);
    }

    return '0=1';
}

function initializeLeaderboardRows(PDO $pdo): array
{
    $stmt = $pdo->query(
        "SELECT n.id AS user_id, n.username, up.avatar_path AS avatar_url
         FROM nutzer n
         LEFT JOIN user_profile_images up ON up.user_id = n.id"
    );

    $rows = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $rows[(int)$row['user_id']] = [
            'user_id' => (int)$row['user_id'],
            'username' => (string)$row['username'],
            'avatar_url' => $row['avatar_url'] ?? null,
            'counts' => [
                'checkins_without_photo' => 0,
                'checkins_with_photo' => 0,
                'reviews' => 0,
                'price_reports' => 0,
                'routes' => 0,
                'shops' => 0,
                'awards_ep' => 0,
                'invites_ep' => 0,
            ],
            'points' => [
                'checkins' => 0,
                'reviews' => 0,
                'price_reports' => 0,
                'routes' => 0,
                'shops' => 0,
                'awards' => 0,
                'invites' => 0,
            ],
            'total_ep' => 0,
            'rank' => null,
        ];
    }

    return $rows;
}

function assignLeaderboardRanks(array $rows): array
{
    usort($rows, static function (array $a, array $b): int {
        if ($a['total_ep'] === $b['total_ep']) {
            return [$a['username'], $a['user_id']] <=> [$b['username'], $b['user_id']];
        }

        return $b['total_ep'] <=> $a['total_ep'];
    });

    $rank = 0;
    $lastScore = null;
    foreach ($rows as $index => &$row) {
        if ($lastScore === null || $row['total_ep'] < $lastScore) {
            $rank = $index + 1;
            $lastScore = $row['total_ep'];
        }
        $row['rank'] = $rank;
    }
    unset($row);

    return $rows;
}

function calculatePeriodLeaderboard(PDO $pdo, DateTimeImmutable $start, DateTimeImmutable $end, string $scope = 'global', ?int $scopeId = null): array
{
    $rows = initializeLeaderboardRows($pdo);
    $params = [
        'start' => $start->format('Y-m-d H:i:s'),
        'end' => $end->format('Y-m-d H:i:s'),
    ];

    $scopeWhere = '1=1';
    $scopeNotWhere = '0=1';
    if ($scope !== 'global' && $scopeId !== null) {
        $scopeWhere = buildShopScopeWhere($scope, $scopeId, 'e');
        $scopeNotWhere = buildShopScopeNotWhere($scope, $scopeId, 'e');
    }

    $checkinsStmt = $pdo->prepare(
        "SELECT c.nutzer_id AS user_id,
                SUM(CASE WHEN img.has_image = 1 THEN 1 ELSE 0 END) AS with_photo,
                SUM(CASE WHEN img.has_image = 1 THEN 0 ELSE 1 END) AS without_photo
         FROM checkins c
         JOIN eisdielen e ON e.id = c.eisdiele_id
         LEFT JOIN (
            SELECT checkin_id, 1 AS has_image
            FROM bilder
            GROUP BY checkin_id
         ) img ON img.checkin_id = c.id
         WHERE c.datum BETWEEN :start AND :end
           AND $scopeWhere
         GROUP BY c.nutzer_id"
    );
    $checkinsStmt->execute($params);
    foreach ($checkinsStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $userId = (int)$row['user_id'];
        if (!isset($rows[$userId])) {
            continue;
        }
        $withPhoto = (int)($row['with_photo'] ?? 0);
        $withoutPhoto = (int)($row['without_photo'] ?? 0);
        $rows[$userId]['counts']['checkins_with_photo'] = $withPhoto;
        $rows[$userId]['counts']['checkins_without_photo'] = $withoutPhoto;
        $rows[$userId]['points']['checkins'] = ($withPhoto * 45) + ($withoutPhoto * 30);
    }

    $reviewsStmt = $pdo->prepare(
        "SELECT b.nutzer_id AS user_id, COUNT(*) AS review_count
         FROM bewertungen b
         JOIN eisdielen e ON e.id = b.eisdiele_id
         WHERE b.erstellt_am BETWEEN :start AND :end
           AND $scopeWhere
         GROUP BY b.nutzer_id"
    );
    $reviewsStmt->execute($params);
    foreach ($reviewsStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $userId = (int)$row['user_id'];
        if (!isset($rows[$userId])) {
            continue;
        }
        $count = (int)$row['review_count'];
        $rows[$userId]['counts']['reviews'] = $count;
        $rows[$userId]['points']['reviews'] = $count * 20;
    }

    $pricesStmt = $pdo->prepare(
        "SELECT p.gemeldet_von AS user_id, COUNT(*) AS price_reports
         FROM preise p
         JOIN eisdielen e ON e.id = p.eisdiele_id
         WHERE p.gemeldet_am BETWEEN :start AND :end
           AND $scopeWhere
         GROUP BY p.gemeldet_von"
    );
    $pricesStmt->execute($params);
    foreach ($pricesStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $userId = (int)$row['user_id'];
        if (!isset($rows[$userId])) {
            continue;
        }
        $count = (int)$row['price_reports'];
        $rows[$userId]['counts']['price_reports'] = $count;
        $rows[$userId]['points']['price_reports'] = $count * 15;
    }

    if ($scope === 'global') {
        $routesStmt = $pdo->prepare(
            "SELECT r.nutzer_id AS user_id, COUNT(*) AS route_count
             FROM routen r
             WHERE r.erstellt_am BETWEEN :start AND :end
             GROUP BY r.nutzer_id"
        );
    } else {
        $routesStmt = $pdo->prepare(
            "SELECT r.nutzer_id AS user_id, COUNT(*) AS route_count
             FROM routen r
             WHERE r.erstellt_am BETWEEN :start AND :end
               AND EXISTS (
                 SELECT 1
                 FROM route_eisdielen re
                 JOIN eisdielen e ON e.id = re.eisdiele_id
                 WHERE re.route_id = r.id
                   AND $scopeWhere
               )
               AND NOT EXISTS (
                 SELECT 1
                 FROM route_eisdielen re2
                 JOIN eisdielen e ON e.id = re2.eisdiele_id
                 WHERE re2.route_id = r.id
                   AND $scopeNotWhere
               )
             GROUP BY r.nutzer_id"
        );
    }
    $routesStmt->execute($params);
    foreach ($routesStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $userId = (int)$row['user_id'];
        if (!isset($rows[$userId])) {
            continue;
        }
        $count = (int)$row['route_count'];
        $rows[$userId]['counts']['routes'] = $count;
        $rows[$userId]['points']['routes'] = $count * 20;
    }

    $shopsStmt = $pdo->prepare(
        "SELECT e.user_id AS user_id,
                COUNT(*) AS shop_count,
                SUM(
                    CASE
                        WHEN EXISTS (SELECT 1 FROM checkins c WHERE c.eisdiele_id = e.id)
                        THEN 25
                        ELSE 5
                    END
                ) AS shop_ep
         FROM eisdielen e
         WHERE e.erstellt_am BETWEEN :start AND :end
           AND $scopeWhere
         GROUP BY e.user_id"
    );
    $shopsStmt->execute($params);
    foreach ($shopsStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $userId = (int)$row['user_id'];
        if (!isset($rows[$userId])) {
            continue;
        }
        $rows[$userId]['counts']['shops'] = (int)$row['shop_count'];
        $rows[$userId]['points']['shops'] = (int)$row['shop_ep'];
    }

    if ($scope === 'global') {
        $awardsStmt = $pdo->prepare(
            "SELECT ua.user_id, COALESCE(SUM(al.ep), 0) AS award_ep
             FROM user_awards ua
             JOIN award_levels al ON ua.award_id = al.award_id AND ua.level = al.level
             WHERE ua.awarded_at BETWEEN :start AND :end
             GROUP BY ua.user_id"
        );
        $awardsStmt->execute($params);
        foreach ($awardsStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $userId = (int)$row['user_id'];
            if (!isset($rows[$userId])) {
                continue;
            }
            $rows[$userId]['counts']['awards_ep'] = (int)$row['award_ep'];
            $rows[$userId]['points']['awards'] = (int)$row['award_ep'];
        }

        $invitesStmt = $pdo->prepare(
            "SELECT n.invited_by AS user_id,
                    SUM(
                        CASE
                            WHEN EXISTS (
                                SELECT 1
                                FROM checkins c
                                WHERE c.nutzer_id = n.id
                                  AND c.datum BETWEEN :start AND :end
                            ) THEN 250
                            ELSE 10
                        END
                    ) AS invite_ep
             FROM nutzer n
             WHERE n.is_verified = 1
               AND n.invited_by IS NOT NULL
               AND n.erstellt_am BETWEEN :start AND :end
             GROUP BY n.invited_by"
        );
        $invitesStmt->execute($params);
        foreach ($invitesStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $userId = (int)$row['user_id'];
            if (!isset($rows[$userId])) {
                continue;
            }
            $rows[$userId]['counts']['invites_ep'] = (int)$row['invite_ep'];
            $rows[$userId]['points']['invites'] = (int)$row['invite_ep'];
        }
    }

    foreach ($rows as &$row) {
        $row['total_ep'] = array_sum($row['points']);
    }
    unset($row);

    $filteredRows = array_values(array_filter($rows, static fn(array $row): bool => $row['total_ep'] > 0));
    return assignLeaderboardRanks($filteredRows);
}

function buildLeaderboardResponse(array $rows, ?int $userId, DateTimeImmutable $start, DateTimeImmutable $end, string $period, string $scope, ?int $scopeId): array
{
    $currentUser = null;
    foreach ($rows as $row) {
        if ($userId !== null && $row['user_id'] === $userId) {
            $currentUser = $row;
            break;
        }
    }

    $topRows = array_slice($rows, 0, 20);
    $progressToNext = null;
    if ($currentUser !== null && $currentUser['rank'] > 1) {
        $higherRows = array_values(array_filter(
            $rows,
            static fn(array $row): bool => $row['total_ep'] > $currentUser['total_ep']
        ));
        if (!empty($higherRows)) {
            $targetRow = end($higherRows);
            $progressToNext = [
                'target_rank' => $targetRow['rank'],
                'target_user_id' => $targetRow['user_id'],
                'target_username' => $targetRow['username'],
                'current_ep' => $currentUser['total_ep'],
                'target_ep' => $targetRow['total_ep'],
                'missing_ep' => max(0, $targetRow['total_ep'] - $currentUser['total_ep']),
            ];
        }
    }

    $now = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
    $secondsUntilEnd = $period === 'overall' ? null : max(0, $end->getTimestamp() - $now->getTimestamp());

    return [
        'leaderboard' => $topRows,
        'current_user' => $currentUser,
        'period_meta' => [
            'period' => $period,
            'scope' => $scope,
            'scope_id' => $scopeId,
            'start' => $start->format(DateTimeInterface::ATOM),
            'end' => $end->format(DateTimeInterface::ATOM),
            'key' => $period === 'overall'
                ? 'overall'
                : ($period === 'month' ? $start->format('Y-m') : $start->format('o-\WW')),
            'archives' => listLeaderboardPeriods($period),
        ],
        'progress_to_next_rank' => $progressToNext,
        'countdown' => [
            'seconds_until_end' => $secondsUntilEnd,
            'ends_at' => $end->format(DateTimeInterface::ATOM),
        ],
    ];
}
