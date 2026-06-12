<?php
require_once __DIR__ . '/bootstrap.php';

function event2026_self_ride_payload_required_checkins(string $routeKey): int
{
    if (function_exists('event2026_self_ride_required_checkins')) {
        return event2026_self_ride_required_checkins($routeKey);
    }

    switch (event2026_normalize_route_key($routeKey)) {
        case 'epic_4':
            return 4;
        case 'classic_3':
            return 3;
        case 'family_2':
        default:
            return 2;
    }
}

function event2026_self_ride_payload(PDO $pdo, array $event, int $userId): array
{
    $eventId = (int) $event['id'];
    $bounds = event2026_self_ride_date_bounds();

    $ridesStmt = $pdo->prepare("SELECT *
        FROM event2026_self_rides
        WHERE event_id = :event_id
          AND user_id = :user_id
          AND ride_date >= :min_date
          AND status <> 'cancelled'
        ORDER BY ride_date ASC, id ASC");
    $ridesStmt->execute([
        ':event_id' => $eventId,
        ':user_id' => $userId,
        ':min_date' => $bounds['min'],
    ]);

    $rides = [];
    $todayRide = null;
    foreach ($ridesStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $route = event2026_route_definition($row['route_key'] ?? '');
        $ride = [
            'id' => (int) $row['id'],
            'route_key' => $route['key'],
            'route_label' => $route['label'],
            'distance_km' => (int) $route['distance_km'],
            'ride_date' => (string) $row['ride_date'],
            'starts_at' => (string) $row['starts_at'],
            'expires_at' => (string) $row['expires_at'],
            'status' => (string) $row['status'],
            'stamping_open' => event2026_self_ride_is_stamping_open($row),
        ];
        if ($ride['ride_date'] === $bounds['min']) {
            $todayRide = $ride;
        }
        $rides[] = $ride;
    }

    return [
        'status' => 'success',
        'date_bounds' => $bounds,
        'routes' => array_values(array_map(static function (array $route): array {
            return [
                'key' => $route['key'],
                'label' => $route['label'],
                'short_label' => $route['short_label'],
                'distance_km' => (int) $route['distance_km'],
                'elevation_m' => (int) $route['elevation_m'],
                'stops' => (int) $route['stops'],
                'required_checkins' => event2026_self_ride_payload_required_checkins($route['key']),
                'route_type' => $route['route_type'],
            ];
        }, event2026_route_catalog())),
        'rides' => $rides,
        'today_ride' => $todayRide,
    ];
}

try {
    event2026_ensure_schema($pdo);
    $auth = event2026_require_auth_user($pdo);
    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];
    $userId = (int) $auth['user_id'];
    event2026_assert_self_ride_access($userId);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(event2026_self_ride_payload($pdo, $event, $userId), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $data = event2026_json_input();
    $routeKey = event2026_normalize_route_key($data['route_key'] ?? '');
    $rideDate = event2026_validate_self_ride_date((string) ($data['ride_date'] ?? ''));
    $window = event2026_self_ride_window($rideDate);

    $existing = event2026_get_self_ride_for_user($pdo, $eventId, $userId, $rideDate);
    if ($existing) {
        $passageStmt = $pdo->prepare("SELECT COUNT(*) FROM event2026_self_ride_passages WHERE self_ride_id = :self_ride_id");
        $passageStmt->execute([':self_ride_id' => (int) $existing['id']]);
        if ((int) $passageStmt->fetchColumn() > 0) {
            http_response_code(409);
            throw new RuntimeException('Diese Selbstfahrer-Tour wurde bereits gestartet und kann nicht mehr geändert werden.');
        }
    }

    $stmt = $pdo->prepare("INSERT INTO event2026_self_rides (
            event_id,
            user_id,
            route_key,
            ride_date,
            starts_at,
            expires_at,
            status
        ) VALUES (
            :event_id,
            :user_id,
            :route_key,
            :ride_date,
            :starts_at,
            :expires_at,
            'planned'
        )
        ON DUPLICATE KEY UPDATE
            route_key = VALUES(route_key),
            starts_at = VALUES(starts_at),
            expires_at = VALUES(expires_at),
            status = 'planned'");
    $stmt->execute([
        ':event_id' => $eventId,
        ':user_id' => $userId,
        ':route_key' => $routeKey,
        ':ride_date' => $rideDate,
        ':starts_at' => $window['starts_at'],
        ':expires_at' => $window['expires_at'],
    ]);

    event2026_log_action($pdo, $eventId, $userId, 'self_ride_plan', 'self_ride', (int) ($existing['id'] ?? $pdo->lastInsertId()), [
        'route_key' => $routeKey,
        'ride_date' => $rideDate,
    ]);

    echo json_encode(event2026_self_ride_payload($pdo, $event, $userId), JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    if (http_response_code() < 400) {
        http_response_code(400);
    }

    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
?>
