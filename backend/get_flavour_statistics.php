<?php
declare(strict_types=1);

require_once __DIR__ . '/db_connect.php';

header('Content-Type: application/json; charset=utf-8');

$sortenname = trim((string)($_GET['sortenname'] ?? ''));
$iceType = trim((string)($_GET['iceType'] ?? ''));
$regionLevel = trim((string)($_GET['region_level'] ?? ''));
$regionIdRaw = $_GET['region_id'] ?? null;

$allowedTypes = ['Kugel', 'Softeis', 'Eisbecher'];
$allowedRegions = ['land', 'bundesland', 'landkreis'];

if ($sortenname === '') {
    http_response_code(400);
    echo json_encode(['error' => 'sortenname ist erforderlich.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($iceType !== '' && $iceType !== 'all' && !in_array($iceType, $allowedTypes, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültiger Eistyp.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$regionId = null;
if ($regionLevel !== '' || $regionIdRaw !== null) {
    if (!in_array($regionLevel, $allowedRegions, true) || filter_var($regionIdRaw, FILTER_VALIDATE_INT) === false || (int)$regionIdRaw <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiger Regionsfilter.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $regionId = (int)$regionIdRaw;
}

/**
 * Builds the repeated filter block for a prepared query.
 * Values are deliberately kept as named parameters and never interpolated.
 */
function flavourWhere(string $sortenname, string $iceType, string $regionLevel, ?int $regionId, string $shopAlias = 'e', string $sortAlias = 's', string $checkinAlias = 'c', string $prefix = ''): array
{
    $where = [
        "TRIM({$sortAlias}.sortenname) = :{$prefix}sortenname",
        "{$checkinAlias}.context_type = 'ice_shop'",
        "{$shopAlias}.place_type = 'ice_shop'",
    ];
    $params = [":{$prefix}sortenname" => $sortenname];

    if ($iceType !== '' && $iceType !== 'all') {
        $where[] = "{$checkinAlias}.typ = :{$prefix}ice_type";
        $params[":{$prefix}ice_type"] = $iceType;
    }

    if ($regionId !== null) {
        $column = match ($regionLevel) {
            'land' => 'land_id',
            'bundesland' => 'bundesland_id',
            default => 'landkreis_id',
        };
        $where[] = "{$shopAlias}.{$column} = :{$prefix}region_id";
        $params[":{$prefix}region_id"] = $regionId;
    }

    return [implode(' AND ', $where), $params];
}

function executeFlavourQuery(PDO $pdo, string $sql, array $params): array
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return $statement->fetchAll(PDO::FETCH_ASSOC);
}

try {
    [$scopeWhere, $scopeParams] = flavourWhere($sortenname, $iceType, $regionLevel, $regionId, 'e', 's', 'c', 'scope_');
    [$globalWhere, $globalParams] = flavourWhere($sortenname, $iceType, '', null, 'e', 's', 'c', 'global_');

    $summaryRows = executeFlavourQuery(
        $pdo,
        "SELECT
            COUNT(DISTINCT c.id) AS checkins,
            COUNT(DISTINCT c.nutzer_id) AS unique_users,
            AVG(s.bewertung) AS average_rating
         FROM checkin_sorten s
         JOIN checkins c ON c.id = s.checkin_id
         JOIN eisdielen e ON e.id = c.eisdiele_id
         WHERE {$scopeWhere}",
        $scopeParams,
    );
    $summary = $summaryRows[0] ?? [];

    $globalRatingRows = executeFlavourQuery(
        $pdo,
        "SELECT AVG(user_rating) AS global_rating
         FROM (
             SELECT c.nutzer_id, AVG(s.bewertung) AS user_rating
             FROM checkin_sorten s
             JOIN checkins c ON c.id = s.checkin_id
             JOIN eisdielen e ON e.id = c.eisdiele_id
             WHERE {$globalWhere}
               AND s.bewertung IS NOT NULL
             GROUP BY c.nutzer_id
         ) user_ratings",
        $globalParams,
    );
    $globalRating = isset($globalRatingRows[0]['global_rating']) ? (float)$globalRatingRows[0]['global_rating'] : null;

    [$shopWhere, $shopParams] = flavourWhere($sortenname, $iceType, $regionLevel, $regionId, 'e', 's', 'c', 'shop_');
    [$shopRatingWhere, $shopRatingParams] = flavourWhere($sortenname, $iceType, $regionLevel, $regionId, 'e_inner', 's_inner', 'c_inner', 'shop_rating_');
    $shops = executeFlavourQuery(
        $pdo,
        "SELECT
            shop_totals.eisdiele_id,
            e.name AS eisdiele_name,
            e.status,
            e.adresse,
            lk.name AS landkreis_name,
            b.name AS bundesland_name,
            shop_totals.checkins,
            shop_totals.unique_users,
            shop_totals.rated_checkins,
            shop_totals.raw_average_rating,
            COALESCE(shop_ratings.unique_rating_users, 0) AS unique_rating_users,
            shop_ratings.user_average_rating,
            CASE
                WHEN shop_ratings.user_average_rating IS NULL OR :shop_prior_rating_a IS NULL THEN NULL
                ELSE (
                    shop_ratings.unique_rating_users / (shop_ratings.unique_rating_users + :shop_prior_users_a) * shop_ratings.user_average_rating
                    + :shop_prior_users_b / (shop_ratings.unique_rating_users + :shop_prior_users_b) * :shop_prior_rating_b
                )
            END AS weighted_rating
         FROM (
             SELECT
                 c.eisdiele_id,
                 COUNT(DISTINCT c.id) AS checkins,
                 COUNT(DISTINCT c.nutzer_id) AS unique_users,
                 COUNT(s.bewertung) AS rated_checkins,
                 AVG(s.bewertung) AS raw_average_rating
             FROM checkin_sorten s
             JOIN checkins c ON c.id = s.checkin_id
             JOIN eisdielen e ON e.id = c.eisdiele_id
             WHERE {$shopWhere}
             GROUP BY c.eisdiele_id
         ) shop_totals
         LEFT JOIN (
             SELECT
                 user_ratings.eisdiele_id,
                 COUNT(*) AS unique_rating_users,
                 AVG(user_ratings.user_rating) AS user_average_rating
             FROM (
                 SELECT
                     c_inner.eisdiele_id,
                     c_inner.nutzer_id,
                     AVG(s_inner.bewertung) AS user_rating
                 FROM checkin_sorten s_inner
                 JOIN checkins c_inner ON c_inner.id = s_inner.checkin_id
                 JOIN eisdielen e_inner ON e_inner.id = c_inner.eisdiele_id
                 WHERE {$shopRatingWhere}
                   AND s_inner.bewertung IS NOT NULL
                 GROUP BY c_inner.eisdiele_id, c_inner.nutzer_id
             ) user_ratings
             GROUP BY user_ratings.eisdiele_id
         ) shop_ratings ON shop_ratings.eisdiele_id = shop_totals.eisdiele_id
         JOIN eisdielen e ON e.id = shop_totals.eisdiele_id
         LEFT JOIN landkreise lk ON lk.id = e.landkreis_id
         LEFT JOIN bundeslaender b ON b.id = e.bundesland_id
         ORDER BY
             (shop_ratings.user_average_rating IS NULL) ASC,
             weighted_rating DESC,
             shop_ratings.unique_rating_users DESC,
             shop_totals.checkins DESC,
             e.name ASC",
        array_merge(
            $shopParams,
            $shopRatingParams,
            [
                ':shop_prior_rating_a' => $globalRating,
                ':shop_prior_rating_b' => $globalRating,
                ':shop_prior_users_a' => 3,
                ':shop_prior_users_b' => 3,
            ],
        ),
    );

    [$userWhere, $userParams] = flavourWhere($sortenname, $iceType, $regionLevel, $regionId, 'e', 's', 'c', 'user_');
    $users = executeFlavourQuery(
        $pdo,
        "SELECT
            n.id AS user_id,
            n.username,
            up.avatar_path AS avatar_url,
            COUNT(DISTINCT c.id) AS checkin_count,
            COUNT(DISTINCT c.eisdiele_id) AS shop_count,
            MAX(c.datum) AS last_checkin
         FROM checkin_sorten s
         JOIN checkins c ON c.id = s.checkin_id
         JOIN eisdielen e ON e.id = c.eisdiele_id
         JOIN nutzer n ON n.id = c.nutzer_id
         LEFT JOIN user_profile_images up ON up.user_id = n.id
         WHERE {$userWhere}
         GROUP BY n.id, n.username, up.avatar_path
         ORDER BY checkin_count DESC, shop_count DESC, n.username ASC
         LIMIT 20",
        $userParams,
    );

    [$regionWhere, $regionParams] = flavourWhere($sortenname, $iceType, '', null, 'e', 's', 'c', 'regions_');
    $bundeslaender = executeFlavourQuery(
        $pdo,
        "SELECT b.id, b.name, l.id AS land_id, l.name AS land_name, COUNT(DISTINCT c.id) AS checkins
         FROM checkin_sorten s
         JOIN checkins c ON c.id = s.checkin_id
         JOIN eisdielen e ON e.id = c.eisdiele_id
         JOIN bundeslaender b ON b.id = e.bundesland_id
         JOIN laender l ON l.id = e.land_id
         WHERE {$regionWhere}
         GROUP BY b.id, b.name, l.id, l.name
         ORDER BY b.name ASC",
        $regionParams,
    );
    $landkreise = executeFlavourQuery(
        $pdo,
        "SELECT lk.id, lk.name, b.id AS bundesland_id, b.name AS bundesland_name, l.id AS land_id, COUNT(DISTINCT c.id) AS checkins
         FROM checkin_sorten s
         JOIN checkins c ON c.id = s.checkin_id
         JOIN eisdielen e ON e.id = c.eisdiele_id
         JOIN landkreise lk ON lk.id = e.landkreis_id
         JOIN bundeslaender b ON b.id = e.bundesland_id
         JOIN laender l ON l.id = e.land_id
         WHERE {$regionWhere}
         GROUP BY lk.id, lk.name, b.id, b.name, l.id
         ORDER BY b.name ASC, lk.name ASC",
        $regionParams,
    );
    $laender = executeFlavourQuery(
        $pdo,
        "SELECT l.id, l.name, COUNT(DISTINCT c.id) AS checkins
         FROM checkin_sorten s
         JOIN checkins c ON c.id = s.checkin_id
         JOIN eisdielen e ON e.id = c.eisdiele_id
         JOIN laender l ON l.id = e.land_id
         WHERE {$regionWhere}
         GROUP BY l.id, l.name
         ORDER BY l.name ASC",
        $regionParams,
    );

    $response = [
        'flavour' => [
            'name' => $sortenname,
            'type' => ($iceType !== '' && $iceType !== 'all') ? $iceType : 'Alle',
            'checkins' => (int)($summary['checkins'] ?? 0),
            'unique_users' => (int)($summary['unique_users'] ?? 0),
            'average_rating' => isset($summary['average_rating']) && $summary['average_rating'] !== null ? round((float)$summary['average_rating'], 2) : null,
        ],
        'shops' => array_map(static function (array $shop): array {
            $ratingUsers = (int)$shop['unique_rating_users'];
            return [
                'eisdiele_id' => (int)$shop['eisdiele_id'],
                'eisdiele_name' => $shop['eisdiele_name'],
                'status' => $shop['status'] ?? 'open',
                'adresse' => $shop['adresse'],
                'landkreis_name' => $shop['landkreis_name'],
                'bundesland_name' => $shop['bundesland_name'],
                'checkins' => (int)$shop['checkins'],
                'unique_users' => (int)$shop['unique_users'],
                'rated_checkins' => (int)$shop['rated_checkins'],
                'rating_users' => $ratingUsers,
                'raw_average_rating' => $shop['raw_average_rating'] !== null ? round((float)$shop['raw_average_rating'], 2) : null,
                'user_average_rating' => $shop['user_average_rating'] !== null ? round((float)$shop['user_average_rating'], 2) : null,
                'weighted_rating' => $shop['weighted_rating'] !== null ? round((float)$shop['weighted_rating'], 2) : null,
                'data_quality' => $ratingUsers < 3 ? 'low' : ($ratingUsers < 10 ? 'growing' : 'good'),
            ];
        }, $shops),
        'users' => array_map(static function (array $user): array {
            return [
                'user_id' => (int)$user['user_id'],
                'username' => $user['username'],
                'avatar_url' => $user['avatar_url'],
                'checkin_count' => (int)$user['checkin_count'],
                'shop_count' => (int)$user['shop_count'],
                'last_checkin' => $user['last_checkin'],
            ];
        }, $users),
        'regions' => [
            'laender' => array_map(static function (array $region): array {
                return ['id' => (int)$region['id'], 'name' => $region['name'], 'checkins' => (int)$region['checkins']];
            }, $laender),
            'bundeslaender' => array_map(static function (array $region): array {
                return [
                    'id' => (int)$region['id'],
                    'name' => $region['name'],
                    'land_id' => (int)$region['land_id'],
                    'land_name' => $region['land_name'],
                    'checkins' => (int)$region['checkins'],
                ];
            }, $bundeslaender),
            'landkreise' => array_map(static function (array $region): array {
                return [
                    'id' => (int)$region['id'],
                    'name' => $region['name'],
                    'bundesland_id' => (int)$region['bundesland_id'],
                    'bundesland_name' => $region['bundesland_name'],
                    'land_id' => (int)$region['land_id'],
                    'checkins' => (int)$region['checkins'],
                ];
            }, $landkreise),
        ],
        'meta' => [
            'prior_users' => 3,
            'global_rating' => $globalRating !== null ? round($globalRating, 2) : null,
            'selected_region_level' => $regionLevel !== '' ? $regionLevel : null,
            'selected_region_id' => $regionId,
        ],
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    error_log('Flavour statistics failed: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Sortenstatistik konnte nicht geladen werden.'], JSON_UNESCAPED_UNICODE);
}
