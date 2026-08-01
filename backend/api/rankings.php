<?php
declare(strict_types=1);

// The development wrapper loads its own database connection before including
// this endpoint. The production endpoint initializes it here.
if (!defined('RANKINGS_PDO_READY')) {
    require_once __DIR__ . '/../db_connect.php';
}
require_once __DIR__ . '/../lib/attribute.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/opening_hours.php';
require_once __DIR__ . '/../lib/ranking_cache.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');

function rankingOpenShopIds(PDO $pdo): ?array {
    $moment = parse_opening_hours_reference($_GET['open_at'] ?? null);
    if ($moment instanceof DateTimeImmutable) {
        return get_open_shop_ids($pdo, $moment);
    }
    if (isset($_GET['open_now']) && (int)$_GET['open_now'] === 1) {
        return get_open_shop_ids($pdo);
    }
    return null;
}

try {
    $requestStartedAt = microtime(true);
    $timings = [];
    $stageStartedAt = $requestStartedAt;
    $markStage = static function (string $name) use (&$timings, &$stageStartedAt): void {
        $now = microtime(true);
        $timings[$name] = round(($now - $stageStartedAt) * 1000, 1);
        $stageStartedAt = $now;
    };
    $sendTimingHeaders = static function (string $cacheState, array $timings) use ($requestStartedAt): void {
        $parts = [];
        foreach ($timings as $name => $duration) {
            $parts[] = $name . ';dur=' . number_format((float)$duration, 1, '.', '');
        }
        $parts[] = 'total;dur=' . number_format((microtime(true) - $requestStartedAt) * 1000, 1, '.', '');
        header('X-Ranking-Cache: ' . $cacheState);
        header('Server-Timing: ' . implode(', ', $parts));
    };
    $scope = $_GET['scope'] ?? 'global';
    $userId = filter_var($_GET['user_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null;
    $favoritesOnly = isset($_GET['favorites_only']) && (int)$_GET['favorites_only'] === 1;
    if (!in_array($scope, ['global', 'personal', 'gourmetCyclist'], true)) {
        throw new InvalidArgumentException('Ungültiger Bewertungsbereich.');
    }
    if ($scope === 'gourmetCyclist') $userId = 1;
    if ($scope === 'personal' && !$userId) throw new InvalidArgumentException('Persönliches Ranking benötigt user_id.');
    $isSingleRaterScope = $scope === 'personal' || $scope === 'gourmetCyclist';
    $viewerId = null;
    if ($favoritesOnly) {
        $authData = requireAuth($pdo);
        $viewerId = (int)$authData['user_id'];
    }

    // Include all user- and filter-dependent values to prevent personalised
    // responses from ever being reused by another viewer.
    $cacheKey = ranking_cache_key([
        'scope' => $scope,
        'rated_user_id' => $userId,
        'viewer_id' => $viewerId,
        'favorites_only' => $favoritesOnly,
        'open_now' => (int)($_GET['open_now'] ?? 0),
        'open_at' => (string)($_GET['open_at'] ?? ''),
    ]);
    $cachedResponse = ranking_cache_read($cacheKey);
    if ($cachedResponse !== null) {
        $sendTimingHeaders('HIT', ['cache' => round((microtime(true) - $requestStartedAt) * 1000, 1)]);
        echo $cachedResponse;
        exit;
    }

    $openShopIds = rankingOpenShopIds($pdo);
    $markStage('open_filter');
    if (is_array($openShopIds) && !$openShopIds) {
        $emptyResponse = json_encode(['meta' => ['scope' => $scope, 'single_rater_scope' => $isSingleRaterScope, 'favorites_only' => $favoritesOnly, 'generated_at' => gmdate(DATE_ATOM), 'version' => 1], 'kugel' => [], 'softeis' => [], 'eisbecher' => []], JSON_UNESCAPED_UNICODE);
        if ($emptyResponse !== false) {
            ranking_cache_write($cacheKey, $emptyResponse);
            $markStage('json');
            $sendTimingHeaders('MISS', $timings);
            echo $emptyResponse;
        }
        exit;
    }

    $params = [];
    $userCondition = '';
    if ($userId) {
        $userCondition = ' AND c.nutzer_id = :user_id';
        $params[':user_id'] = $userId;
    }
    $favoriteCondition = '';
    if ($viewerId) {
        $favoriteCondition = ' AND EXISTS (SELECT 1 FROM favoriten favorite WHERE favorite.eisdiele_id = e.id AND favorite.nutzer_id = :favorite_user_id)';
        $params[':favorite_user_id'] = $viewerId;
    }
    $openCondition = '';
    if (is_array($openShopIds)) {
        $placeholders = [];
        foreach (array_values($openShopIds) as $index => $shopId) {
            $placeholder = ':open_shop_' . $index;
            $placeholders[] = $placeholder;
            $params[$placeholder] = (int)$shopId;
        }
        $openCondition = ' AND e.id IN (' . implode(',', $placeholders) . ')';
    }
    $rankingScoreExpression = $isSingleRaterScope
        ? 'ROUND(s.raw_score, 2)'
        : "ROUND((s.user_count / (s.user_count + CASE WHEN s.typ = 'Kugel' THEN 3 ELSE 2 END)) * s.raw_score
          + ((CASE WHEN s.typ = 'Kugel' THEN 3 ELSE 2 END) / (s.user_count + CASE WHEN s.typ = 'Kugel' THEN 3 ELSE 2 END)) * m.global_mean, 2)";

    $typeMeansCte = $isSingleRaterScope ? '' : ", type_means AS (
    SELECT typ, AVG(raw_score) AS global_mean FROM shop_scores GROUP BY typ
)";
    $typeMeansJoin = $isSingleRaterScope ? '' : 'JOIN type_means m ON m.typ = s.typ';

    $sql = "
WITH eligible AS (
    SELECT c.eisdiele_id, c.nutzer_id, c.typ,
      c.geschmackbewertung AS taste,
      CASE WHEN c.waffelbewertung IS NULL THEN NULL ELSE c.waffelbewertung END AS waffle,
      CASE WHEN c.waffelbewertung IS NULL THEN c.geschmackbewertung
           ELSE ((4 * c.geschmackbewertung + c.waffelbewertung) / 5.0) END AS taste_factor,
      CASE
        WHEN c.typ = 'Kugel' THEN COALESCE(c.preisleistungsbewertung, c.größenbewertung)
        ELSE c.preisleistungsbewertung
      END AS value_rating,
      CASE
        WHEN c.typ = 'Kugel' THEN
          0.7 * CASE WHEN c.waffelbewertung IS NULL THEN c.geschmackbewertung
                     ELSE ((4 * c.geschmackbewertung + c.waffelbewertung) / 5.0) END
          + 0.3 * COALESCE(c.preisleistungsbewertung, c.größenbewertung)
        WHEN c.typ = 'Softeis' THEN
          0.7 * CASE WHEN c.waffelbewertung IS NULL THEN c.geschmackbewertung
                     ELSE ((4 * c.geschmackbewertung + c.waffelbewertung) / 5.0) END
          + 0.3 * c.preisleistungsbewertung
        ELSE 0.7 * c.geschmackbewertung + 0.3 * c.preisleistungsbewertung
      END AS score
    FROM checkins c
    WHERE c.typ IN ('Kugel', 'Softeis', 'Eisbecher')
      AND c.geschmackbewertung IS NOT NULL
      AND (CASE WHEN c.typ = 'Kugel' THEN COALESCE(c.preisleistungsbewertung, c.größenbewertung)
                ELSE c.preisleistungsbewertung END) IS NOT NULL
      {$userCondition}
), user_scores AS (
    SELECT eisdiele_id, nutzer_id, typ, COUNT(*) AS rating_count,
      AVG(score) AS user_score, AVG(taste) AS user_taste, AVG(taste_factor) AS user_taste_factor,
      AVG(waffle) AS user_waffle, AVG(value_rating) AS user_value
    FROM eligible
    GROUP BY eisdiele_id, nutzer_id, typ
), shop_scores AS (
    SELECT eisdiele_id, typ,
      SUM(rating_count) AS rating_count,
      COUNT(*) AS user_count,
      SUM(user_score * SQRT(rating_count)) / NULLIF(SUM(SQRT(rating_count)), 0) AS raw_score,
      SUM(user_taste * SQRT(rating_count)) / NULLIF(SUM(SQRT(rating_count)), 0) AS taste_score,
      SUM(user_taste_factor * SQRT(rating_count)) / NULLIF(SUM(SQRT(rating_count)), 0) AS taste_factor_score,
      SUM(user_waffle * SQRT(rating_count)) / NULLIF(SUM(CASE WHEN user_waffle IS NOT NULL THEN SQRT(rating_count) ELSE 0 END), 0) AS waffle_score,
      SUM(user_value * SQRT(rating_count)) / NULLIF(SUM(SQRT(rating_count)), 0) AS value_score
    FROM user_scores
    GROUP BY eisdiele_id, typ
){$typeMeansCte}
SELECT s.eisdiele_id, s.typ, e.name, e.adresse, e.openingHours, e.opening_hours_note,
       e.status, e.latitude, e.longitude,
       ROUND(s.raw_score, 2) AS raw_score,
       {$rankingScoreExpression} AS ranking_score,
       ROUND(s.taste_score, 2) AS avg_geschmack,
       ROUND(s.taste_factor_score, 2) AS avg_geschmacksfaktor,
       ROUND(s.taste_factor_score, 2) AS finaler_geschmacksfaktor,
       ROUND(s.waffle_score, 2) AS avg_waffel,
       ROUND(s.value_score, 2) AS avg_preisleistung,
       s.rating_count AS checkin_anzahl, s.user_count AS nutzeranzahl
FROM shop_scores s
{$typeMeansJoin}
JOIN eisdielen e ON e.id = s.eisdiele_id
WHERE COALESCE(e.status, 'open') <> 'permanent_closed' {$openCondition} {$favoriteCondition}
ORDER BY s.typ, ranking_score DESC, s.user_count DESC, s.rating_count DESC, e.name ASC";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $placeholder => $value) $stmt->bindValue($placeholder, $value, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $markStage('score_sql');

    $shopIds = array_values(array_unique(array_map(static fn(array $row): int => (int)$row['eisdiele_id'], $rows)));
    $priceMap = [];
    if ($shopIds) {
        $pricePlaceholders = [];
        $priceParams = [];
        foreach ($shopIds as $index => $shopId) {
            $placeholder = ':price_shop_' . $index;
            $pricePlaceholders[] = $placeholder;
            $priceParams[$placeholder] = $shopId;
        }
        $priceSql = "
            SELECT p.eisdiele_id, p.typ, p.preis, p.waehrung_id, currency.symbol AS waehrung,
                   CASE WHEN currency.code = 'EUR' THEN p.preis
                        ELSE ROUND(p.preis * COALESCE(rate.kurs, 1), 2) END AS preis_eur
            FROM preise p
            LEFT JOIN waehrungen currency ON currency.id = p.waehrung_id
            LEFT JOIN wechselkurse rate ON rate.von_waehrung_id = p.waehrung_id
              AND rate.zu_waehrung_id = (SELECT id FROM waehrungen WHERE code = 'EUR' LIMIT 1)
            WHERE p.typ IN ('kugel', 'softeis')
              AND p.eisdiele_id IN (" . implode(',', $pricePlaceholders) . ")
              AND NOT EXISTS (
                  SELECT 1 FROM preise newer
                  WHERE newer.eisdiele_id = p.eisdiele_id
                    AND newer.typ = p.typ
                    AND (newer.gemeldet_am > p.gemeldet_am
                      OR (newer.gemeldet_am = p.gemeldet_am AND newer.id > p.id))
              )";
        $priceStmt = $pdo->prepare($priceSql);
        foreach ($priceParams as $placeholder => $value) $priceStmt->bindValue($placeholder, $value, PDO::PARAM_INT);
        $priceStmt->execute();
        foreach ($priceStmt->fetchAll(PDO::FETCH_ASSOC) as $priceRow) {
            $priceMap[(int)$priceRow['eisdiele_id']][(string)$priceRow['typ']] = $priceRow;
        }
    }
    $markStage('price_lookup');
    $attributeMap = getReviewAttributesForEisdielen($pdo, $shopIds);
    $markStage('attributes');
    $hoursMap = fetch_opening_hours_map($pdo, $shopIds);
    $markStage('opening_hours');
    $result = ['kugel' => [], 'softeis' => [], 'eisbecher' => []];
    foreach ($rows as $row) {
        $shopId = (int)$row['eisdiele_id'];
        $hours = $hoursMap[$shopId] ?? [];
        $kugelPrice = $priceMap[$shopId]['kugel'] ?? [];
        $softeisPrice = $priceMap[$shopId]['softeis'] ?? [];
        $row['kugel_preis'] = $kugelPrice['preis'] ?? null;
        $row['kugel_waehrung'] = $kugelPrice['waehrung'] ?? null;
        $row['kugel_preis_eur'] = $kugelPrice['preis_eur'] ?? null;
        $row['softeis_preis'] = $softeisPrice['preis'] ?? null;
        $row['softeis_waehrung'] = $softeisPrice['waehrung'] ?? null;
        $row['softeis_preis_eur'] = $softeisPrice['preis_eur'] ?? null;
        $row['attributes'] = $attributeMap[$shopId] ?? [];
        $row['openingHoursStructured'] = build_structured_opening_hours($hours, $row['opening_hours_note'] ?? null);
        $row['is_open_now'] = is_shop_open($hours, null, $row['status'] ?? null);
        $row['anzahl_nutzer'] = $row['nutzeranzahl'];
        if ($row['typ'] === 'Kugel') {
            $row['finaler_score'] = $row['raw_score'];
            $result['kugel'][] = $row;
        } elseif ($row['typ'] === 'Softeis') {
            $row['finaler_softeis_score'] = $row['raw_score'];
            $result['softeis'][] = $row;
        } else {
            $row['finaler_eisbecher_score'] = $row['raw_score'];
            $result['eisbecher'][] = $row;
        }
    }

    $responseJson = json_encode([
        'meta' => ['scope' => $scope, 'single_rater_scope' => $isSingleRaterScope, 'favorites_only' => $favoritesOnly, 'generated_at' => gmdate(DATE_ATOM), 'version' => 1],
        ...$result,
    ], JSON_UNESCAPED_UNICODE);
    if ($responseJson === false) {
        throw new RuntimeException('Ranking konnte nicht serialisiert werden.');
    }
    $markStage('json');
    ranking_cache_write($cacheKey, $responseJson);
    $sendTimingHeaders('MISS', $timings);
    echo $responseJson;
} catch (InvalidArgumentException $exception) {
    http_response_code(400);
    echo json_encode(['error' => $exception->getMessage()]);
} catch (Throwable $exception) {
    error_log('rankings.php: ' . $exception->getMessage());
    http_response_code(500);
    $response = ['error' => 'Ranking konnte nicht geladen werden.'];
    if (($DEBUG_MODE ?? false) === true) {
        $response['detail'] = $exception->getMessage();
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}
