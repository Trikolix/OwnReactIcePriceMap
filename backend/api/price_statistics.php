<?php
declare(strict_types=1);

// `backend_dev/api/price_statistics.php` loads its own development connection
// before including this endpoint. The production endpoint initializes it here.
if (!defined('PRICE_STATISTICS_PDO_READY')) {
    require_once __DIR__ . '/../db_connect.php';
}

header('Content-Type: application/json; charset=utf-8');

function priceStatNumber(array $values, float $percentile): ?float {
    if (!$values) return null;
    sort($values, SORT_NUMERIC);
    $index = ($percentile / 100) * (count($values) - 1);
    $lower = (int)floor($index);
    $upper = (int)ceil($index);
    $value = $values[$lower] + (($values[$upper] - $values[$lower]) * ($index - $lower));
    return round($value, 2);
}

function priceStatNode(int $id, string $name, array $rows): array {
    $prices = array_map(static fn(array $row): float => (float)$row['price_eur'], $rows);
    return [
        'id' => $id,
        'name' => $name,
        'shop_count' => count($rows),
        'anzahl_eisdielen' => count($rows),
        'report_count' => array_sum(array_map(static fn(array $row): int => (int)$row['report_count'], $rows)),
        'median_eur' => priceStatNumber($prices, 50),
        'mean_eur' => $prices ? round(array_sum($prices) / count($prices), 2) : null,
        'p25_eur' => priceStatNumber($prices, 25),
        'p75_eur' => priceStatNumber($prices, 75),
        // Compatibility with the former hierarchy client.
        'kugel_preis_eur' => priceStatNumber($prices, 50),
        'durchschnittlicher_kugelpreis_eur' => $prices ? round(array_sum($prices) / count($prices), 2) : null,
    ];
}

$timezone = new DateTimeZone('Europe/Berlin');
$toInput = $_GET['to'] ?? (new DateTimeImmutable('now', $timezone))->format('Y-m-d');
$fromInput = $_GET['from'] ?? $toInput;
$freshnessInput = $_GET['freshness_days'] ?? 180;
$freshnessDays = null;
if ($freshnessInput !== 'all') {
    $freshnessDays = filter_var($freshnessInput, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 730]]) ?: 180;
}
$minShops = filter_var($_GET['min_shops'] ?? 3, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100]]) ?: 3;

try {
    $from = new DateTimeImmutable((string)$fromInput . ' 00:00:00', $timezone);
    $asOf = new DateTimeImmutable((string)$toInput . ' 23:59:59', $timezone);
    if ($from > $asOf) throw new InvalidArgumentException('from darf nicht nach to liegen.');
} catch (Exception $exception) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültiger Zeitraum. Erwartet wird YYYY-MM-DD.', 'message' => $exception->getMessage()]);
    exit;
}

$cutoff = $freshnessDays === null ? null : $asOf->modify('-' . $freshnessDays . ' days');

try {
    // No window function: this also runs on older MySQL/MariaDB instances.
    // The anti-join rule makes the latest (gemeldet_am, id) event authoritative.
    $freshnessCondition = $cutoff === null ? '' : ' AND p.gemeldet_am >= :cutoff';
    $snapshotStmt = $pdo->prepare("\n        SELECT e.id AS shop_id, e.land_id, e.bundesland_id, e.landkreis_id,\n               land.name AS land_name, bundesland.name AS bundesland_name, landkreis.name AS landkreis_name,\n               p.gemeldet_am,\n               CASE WHEN w.code = 'EUR' THEN p.preis\n                    ELSE ROUND(p.preis * COALESCE(rate.kurs, 1), 2) END AS price_eur\n        FROM preise p\n        JOIN eisdielen e ON e.id = p.eisdiele_id\n        LEFT JOIN laender land ON land.id = e.land_id\n        LEFT JOIN bundeslaender bundesland ON bundesland.id = e.bundesland_id\n        LEFT JOIN landkreise landkreis ON landkreis.id = e.landkreis_id\n        LEFT JOIN waehrungen w ON w.id = p.waehrung_id\n        LEFT JOIN wechselkurse rate ON rate.von_waehrung_id = p.waehrung_id\n          AND rate.zu_waehrung_id = (SELECT id FROM waehrungen WHERE code = 'EUR' LIMIT 1)\n        WHERE p.typ = 'kugel'\n          AND p.gemeldet_am <= :as_of\n          AND NOT EXISTS (\n              SELECT 1\n              FROM preise newer\n              WHERE newer.eisdiele_id = p.eisdiele_id\n                AND newer.typ = p.typ\n                AND newer.gemeldet_am <= :as_of_newer\n                AND (\n                    newer.gemeldet_am > p.gemeldet_am\n                    OR (newer.gemeldet_am = p.gemeldet_am AND newer.id > p.id)\n                )\n          )\n          {$freshnessCondition}\n          AND COALESCE(e.status, 'open') <> 'permanent_closed'\n          AND land.id IS NOT NULL\n    ");
    $snapshotParams = [
        ':as_of' => $asOf->format('Y-m-d H:i:s'),
        ':as_of_newer' => $asOf->format('Y-m-d H:i:s'),
    ];
    if ($cutoff !== null) $snapshotParams[':cutoff'] = $cutoff->format('Y-m-d H:i:s');
    $snapshotStmt->execute($snapshotParams);
    $snapshotRows = $snapshotStmt->fetchAll(PDO::FETCH_ASSOC);

    $reportStmt = $pdo->prepare("\n        SELECT p.eisdiele_id, COUNT(*) AS report_count\n        FROM preise p\n        WHERE p.typ = 'kugel' AND p.gemeldet_am BETWEEN :from_date AND :to_date\n        GROUP BY p.eisdiele_id\n    ");
    $reportStmt->execute([':from_date' => $from->format('Y-m-d H:i:s'), ':to_date' => $asOf->format('Y-m-d H:i:s')]);
    $reportsByShop = [];
    foreach ($reportStmt->fetchAll(PDO::FETCH_ASSOC) as $row) $reportsByShop[(int)$row['eisdiele_id']] = (int)$row['report_count'];

    $countries = [];
    foreach ($snapshotRows as $row) {
        if ($row['price_eur'] === null) continue;
        $row['price_eur'] = (float)$row['price_eur'];
        $row['report_count'] = $reportsByShop[(int)$row['shop_id']] ?? 0;
        $countryId = (int)$row['land_id'];
        if (!isset($countries[$countryId])) $countries[$countryId] = ['name' => $row['land_name'], 'rows' => [], 'states' => []];
        $countries[$countryId]['rows'][] = $row;
        if ($row['bundesland_id'] === null) continue;
        $stateId = (int)$row['bundesland_id'];
        if (!isset($countries[$countryId]['states'][$stateId])) $countries[$countryId]['states'][$stateId] = ['name' => $row['bundesland_name'], 'rows' => [], 'counties' => []];
        $countries[$countryId]['states'][$stateId]['rows'][] = $row;
        if ($row['landkreis_id'] !== null) {
            $countyId = (int)$row['landkreis_id'];
            if (!isset($countries[$countryId]['states'][$stateId]['counties'][$countyId])) $countries[$countryId]['states'][$stateId]['counties'][$countyId] = ['name' => $row['landkreis_name'], 'rows' => []];
            $countries[$countryId]['states'][$stateId]['counties'][$countyId]['rows'][] = $row;
        }
    }

    $hierarchy = [];
    $suppressed = ['countries' => 0, 'states' => 0, 'counties' => 0];
    foreach ($countries as $countryId => $country) {
        if (count($country['rows']) < $minShops) { $suppressed['countries']++; continue; }
        $countryNode = priceStatNode($countryId, $country['name'], $country['rows']);
        $countryNode['bundeslaender'] = [];
        foreach ($country['states'] as $stateId => $state) {
            if (count($state['rows']) < $minShops) { $suppressed['states']++; continue; }
            $stateNode = priceStatNode($stateId, $state['name'], $state['rows']);
            $stateNode['landkreise'] = [];
            foreach ($state['counties'] as $countyId => $county) {
                if (count($county['rows']) < $minShops) { $suppressed['counties']++; continue; }
                $stateNode['landkreise'][] = priceStatNode($countyId, $county['name'], $county['rows']);
            }
            usort($stateNode['landkreise'], static fn(array $a, array $b): int => $a['median_eur'] <=> $b['median_eur']);
            $countryNode['bundeslaender'][] = $stateNode;
        }
        usort($countryNode['bundeslaender'], static fn(array $a, array $b): int => $a['median_eur'] <=> $b['median_eur']);
        $hierarchy[] = $countryNode;
    }
    usort($hierarchy, static fn(array $a, array $b): int => $a['median_eur'] <=> $b['median_eur']);

    $reportedAt = array_values(array_filter(array_map(static fn(array $row): ?string => $row['gemeldet_am'] ?? null, $snapshotRows)));
    $oldReports = array_filter($reportedAt, static fn(string $reportedAt): bool => $reportedAt < $asOf->modify('-180 days')->format('Y-m-d H:i:s'));

    echo json_encode([
        'meta' => [
            'from' => $from->format('Y-m-d'), 'to' => $asOf->format('Y-m-d'),
            'as_of' => $asOf->format(DATE_ATOM), 'freshness_days' => $freshnessDays ?? 'all',
            'min_shops' => $minShops, 'eligible_shops' => count($snapshotRows),
            'oldest_reported_at' => $reportedAt ? min($reportedAt) : null,
            'latest_reported_at' => $reportedAt ? max($reportedAt) : null,
            'shops_with_report_older_than_180_days' => count($oldReports),
            'suppressed_regions' => $suppressed,
        ],
        'hierarchy' => $hierarchy,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $exception) {
    error_log('price_statistics.php: ' . $exception->getMessage());
    http_response_code(500);
    $response = ['error' => 'Preisstatistik konnte nicht geladen werden.'];
    if (($DEBUG_MODE ?? false) === true) {
        $response['detail'] = $exception->getMessage();
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}
