<?php
declare(strict_types=1);

// `backend_dev/api/price_statistics_timeline.php` loads its own development
// connection before including this endpoint.
if (!defined('PRICE_STATISTICS_TIMELINE_PDO_READY')) {
    require_once __DIR__ . '/../db_connect.php';
}

header('Content-Type: application/json; charset=utf-8');

/** @param float[] $values */
function priceTimelineMedian(array $values): ?float {
    if (!$values) return null;
    sort($values, SORT_NUMERIC);
    $middle = intdiv(count($values), 2);
    $median = count($values) % 2 === 1 ? $values[$middle] : ($values[$middle - 1] + $values[$middle]) / 2;
    return round($median, 2);
}

function priceTimelineDate(string $value, DateTimeZone $timezone): DateTimeImmutable {
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value, $timezone);
    $errors = DateTimeImmutable::getLastErrors();
    if ($date === false || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))) {
        throw new InvalidArgumentException('Ungültiges Datum. Erwartet wird YYYY-MM-DD.');
    }
    return $date;
}

/**
 * Returns the latest known kugel price for each relevant shop at $asOf. The
 * anti-join works on older MySQL/MariaDB versions where window functions are
 * unavailable. Region assignments deliberately use the current shop data,
 * matching the price overview endpoint.
 *
 * @return array<int, array<string, mixed>>
 */
function priceTimelineSnapshot(
    PDO $pdo,
    string $regionColumn,
    int $regionId,
    int $germanyId,
    DateTimeImmutable $asOf,
    ?int $freshnessDays
): array {
    $freshnessCondition = $freshnessDays === null ? '' : ' AND p.gemeldet_am >= :cutoff';
    $sql = "
        SELECT
            CASE WHEN e.{$regionColumn} = :target_case THEN 1 ELSE 0 END AS is_target,
            CASE WHEN e.land_id = :germany_case THEN 1 ELSE 0 END AS is_germany,
            CASE WHEN currency.code = 'EUR' THEN p.preis
                 ELSE ROUND(p.preis * COALESCE(rate.kurs, 1), 2) END AS price_eur
        FROM preise p
        JOIN eisdielen e ON e.id = p.eisdiele_id
        LEFT JOIN waehrungen currency ON currency.id = p.waehrung_id
        LEFT JOIN wechselkurse rate ON rate.von_waehrung_id = p.waehrung_id
          AND rate.zu_waehrung_id = (SELECT id FROM waehrungen WHERE code = 'EUR' LIMIT 1)
        WHERE p.typ = 'kugel'
          AND p.gemeldet_am <= :as_of
          AND NOT EXISTS (
              SELECT 1
              FROM preise newer
              WHERE newer.eisdiele_id = p.eisdiele_id
                AND newer.typ = p.typ
                AND newer.gemeldet_am <= :as_of_newer
                AND (
                    newer.gemeldet_am > p.gemeldet_am
                    OR (newer.gemeldet_am = p.gemeldet_am AND newer.id > p.id)
                )
          )
          {$freshnessCondition}
          AND COALESCE(e.status, 'open') <> 'permanent_closed'
          AND (e.{$regionColumn} = :target_filter OR e.land_id = :germany_filter)
    ";
    $params = [
        ':target_case' => $regionId,
        ':germany_case' => $germanyId,
        ':as_of' => $asOf->format('Y-m-d H:i:s'),
        ':as_of_newer' => $asOf->format('Y-m-d H:i:s'),
        ':target_filter' => $regionId,
        ':germany_filter' => $germanyId,
    ];
    if ($freshnessDays !== null) {
        $params[':cutoff'] = $asOf->modify('-' . $freshnessDays . ' days')->format('Y-m-d H:i:s');
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

try {
    $timezone = new DateTimeZone('Europe/Berlin');
    $level = (string)($_GET['level'] ?? 'land');
    $regions = [
        'land' => ['table' => 'laender', 'column' => 'land_id'],
        'bundesland' => ['table' => 'bundeslaender', 'column' => 'bundesland_id'],
        'landkreis' => ['table' => 'landkreise', 'column' => 'landkreis_id'],
    ];
    if (!isset($regions[$level])) throw new InvalidArgumentException('Ungültige Regionsebene.');

    $range = (string)($_GET['range'] ?? '12m');
    if (!in_array($range, ['12m', '3y', 'all'], true)) throw new InvalidArgumentException('Ungültiger Zeitraum.');

    $toInput = (string)($_GET['to'] ?? (new DateTimeImmutable('now', $timezone))->format('Y-m-d'));
    $asOf = priceTimelineDate($toInput, $timezone)->setTime(23, 59, 59);
    $freshnessInput = $_GET['freshness_days'] ?? 'all';
    $freshnessDays = null;
    if ($freshnessInput !== 'all') {
        $freshnessDays = filter_var($freshnessInput, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 730]]);
        if ($freshnessDays === false) throw new InvalidArgumentException('Ungültige Aktualität.');
    }
    $minShops = filter_var($_GET['min_shops'] ?? 3, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100]]);
    if ($minShops === false) throw new InvalidArgumentException('Ungültige Mindestbasis.');

    $germanyStmt = $pdo->query("SELECT id, name FROM laender WHERE name = 'Deutschland' ORDER BY id ASC LIMIT 1");
    $germany = $germanyStmt->fetch(PDO::FETCH_ASSOC);
    if (!$germany) throw new RuntimeException('Deutschland ist nicht als Land hinterlegt.');
    $germanyId = (int)$germany['id'];

    $regionId = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($regionId === false || $regionId === null) {
        if ($level !== 'land') throw new InvalidArgumentException('Für diese Regionsebene wird eine id benötigt.');
        $regionId = $germanyId;
    }
    $regionStmt = $pdo->prepare("SELECT id, name FROM {$regions[$level]['table']} WHERE id = :id LIMIT 1");
    $regionStmt->execute([':id' => $regionId]);
    $region = $regionStmt->fetch(PDO::FETCH_ASSOC);
    if (!$region) {
        http_response_code(404);
        echo json_encode(['error' => 'Region wurde nicht gefunden.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $firstPriceStmt = $pdo->prepare("\n        SELECT MIN(p.gemeldet_am)\n        FROM preise p\n        JOIN eisdielen e ON e.id = p.eisdiele_id\n        WHERE p.typ = 'kugel'\n          AND e.{$regions[$level]['column']} = :region_id\n          AND COALESCE(e.status, 'open') <> 'permanent_closed'\n    ");
    $firstPriceStmt->execute([':region_id' => $regionId]);
    $firstReportedAt = $firstPriceStmt->fetchColumn() ?: null;

    $currentMonth = $asOf->modify('first day of this month')->setTime(0, 0, 0);
    if ($range === '12m') {
        $firstMonth = $currentMonth->modify('-11 months');
    } elseif ($range === '3y') {
        $firstMonth = $currentMonth->modify('-35 months');
    } elseif ($firstReportedAt !== null) {
        $firstMonth = (new DateTimeImmutable($firstReportedAt, $timezone))->modify('first day of this month')->setTime(0, 0, 0);
    } else {
        $firstMonth = $currentMonth;
    }

    $hasGermanyComparison = !($level === 'land' && $regionId === $germanyId);
    $series = [];
    for ($month = $firstMonth; $month <= $currentMonth; $month = $month->modify('+1 month')) {
        $monthEnd = $month->modify('last day of this month')->setTime(23, 59, 59);
        $snapshotAsOf = $monthEnd > $asOf ? $asOf : $monthEnd;
        $rows = priceTimelineSnapshot($pdo, $regions[$level]['column'], $regionId, $germanyId, $snapshotAsOf, $freshnessDays);
        $regionPrices = [];
        $germanyPrices = [];
        foreach ($rows as $row) {
            if ($row['price_eur'] === null) continue;
            if ((int)$row['is_target'] === 1) $regionPrices[] = (float)$row['price_eur'];
            if ((int)$row['is_germany'] === 1) $germanyPrices[] = (float)$row['price_eur'];
        }
        $series[] = [
            'month_key' => $month->format('Y-m'),
            'label' => $month->format('m/Y'),
            'median_eur' => count($regionPrices) >= $minShops ? priceTimelineMedian($regionPrices) : null,
            'shop_count' => count($regionPrices),
            'germany_median_eur' => $hasGermanyComparison && count($germanyPrices) >= $minShops ? priceTimelineMedian($germanyPrices) : null,
            'germany_shop_count' => $hasGermanyComparison ? count($germanyPrices) : null,
        ];
    }

    echo json_encode([
        'meta' => [
            'level' => $level,
            'region' => ['id' => (int)$region['id'], 'name' => $region['name']],
            'from' => $firstMonth->format('Y-m-d'),
            'to' => $asOf->format('Y-m-d'),
            'range' => $range,
            'freshness_days' => $freshnessDays ?? 'all',
            'min_shops' => $minShops,
            'comparison' => $hasGermanyComparison ? 'germany' : null,
            'point_definition' => 'Letzter bekannter Kugelpreis je Eisdiele zum Monatsende.',
            'generated_at' => gmdate(DATE_ATOM),
        ],
        'series' => $series,
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $exception) {
    http_response_code(400);
    echo json_encode(['error' => $exception->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $exception) {
    error_log('price_statistics_timeline.php: ' . $exception->getMessage());
    http_response_code(500);
    $response = ['error' => 'Preisverlauf konnte nicht geladen werden.'];
    if (($DEBUG_MODE ?? false) === true) $response['detail'] = $exception->getMessage();
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}
