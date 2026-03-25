<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $auth = event2026_require_auth_user($pdo);
    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];
    $mode = event2026_normalize_stamp_card_mode($_GET['mode'] ?? 'live');
    $startFinish = event2026_start_finish_config($pdo, $mode);
    $stampingEnabled = $mode === 'test' ? true : event2026_is_live_stamping_open($event);
    $stampingAvailableFrom = event2026_live_stamping_available_from($event);
    if ($mode === 'test' && (int) $auth['user_id'] !== 1) {
        http_response_code(403);
        throw new RuntimeException('Test-Stempelkarte ist nur für Admin verfügbar.');
    }

    $slot = event2026_get_slot_for_user($pdo, $eventId, $auth['user_id']);
    if (!$slot) {
        http_response_code(403);
        throw new RuntimeException('Keine Event-Anmeldung für diesen Account gefunden.');
    }

    $routeKey = event2026_normalize_route_key($slot['route_key'] ?? '');
    $stmt = $pdo->prepare("SELECT
            c.id,
            c.shop_id,
            c.name,
            c.lat,
            c.lng,
            c.order_index,
            c.is_mandatory,
            c.min_distance_km,
            c.route_keys_csv,
            c.qr_code_id,
            p.passed_at,
            p.source,
            p.checkin_id,
            e.name AS shop_name
        FROM event2026_checkpoints c
        LEFT JOIN event2026_checkpoint_passages p
            ON p.checkpoint_id = c.id
            AND p.event_id = c.event_id
            AND p.user_id = :user_id
        LEFT JOIN eisdielen e ON e.id = c.shop_id
        WHERE c.event_id = :event_id
          AND c.stamp_card_mode = :stamp_card_mode
        ORDER BY c.order_index ASC, c.id ASC");
    $stmt->execute([
        ':user_id' => $auth['user_id'],
        ':event_id' => $eventId,
        ':stamp_card_mode' => $mode,
    ]);

    $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $checkpointShopIds = [];
    foreach ($rawRows as $row) {
        if ($row['shop_id'] !== null) {
            $checkpointShopIds[(int) $row['shop_id']] = true;
        }
    }

    $eventDate = $mode === 'test'
        ? gmdate('Y-m-d')
        : (!empty($event['event_date']) ? (string) $event['event_date'] : gmdate('Y-m-d'));
    $eventDayCheckinsByShop = [];
    if (!empty($checkpointShopIds)) {
        $shopIdList = array_keys($checkpointShopIds);
        $placeholders = implode(',', array_fill(0, count($shopIdList), '?'));
        $checkinSql = "SELECT
                c.id,
                c.eisdiele_id,
                c.datum,
                c.typ,
                c.kommentar,
                GROUP_CONCAT(cs.sortenname ORDER BY cs.id SEPARATOR ', ') AS sorten_preview
            FROM checkins c
            LEFT JOIN checkin_sorten cs ON cs.checkin_id = c.id
            WHERE c.nutzer_id = ?
              AND DATE(c.datum) = ?
              AND c.eisdiele_id IN ({$placeholders})
            GROUP BY c.id, c.eisdiele_id, c.datum, c.typ, c.kommentar
            ORDER BY c.datum DESC, c.id DESC";
        $checkinStmt = $pdo->prepare($checkinSql);
        $params = array_merge([(int) $auth['user_id'], $eventDate], $shopIdList);
        $checkinStmt->execute($params);
        foreach ($checkinStmt->fetchAll(PDO::FETCH_ASSOC) as $checkinRow) {
            $shopId = (int) $checkinRow['eisdiele_id'];
            if (!isset($eventDayCheckinsByShop[$shopId])) {
                $eventDayCheckinsByShop[$shopId] = [];
            }
            $eventDayCheckinsByShop[$shopId][] = [
                'id' => (int) $checkinRow['id'],
                'datum' => (string) $checkinRow['datum'],
                'typ' => (string) $checkinRow['typ'],
                'sorten_preview' => $checkinRow['sorten_preview'] !== null ? (string) $checkinRow['sorten_preview'] : '',
                'kommentar_preview' => $checkinRow['kommentar'] !== null
                    ? mb_substr(trim((string) $checkinRow['kommentar']), 0, 120)
                    : '',
            ];
        }
    }

    $checkpoints = [];
    $mandatoryTotal = 0;
    $mandatoryPassed = 0;
    foreach ($rawRows as $row) {
        if ($mode === 'live' && !event2026_route_applies_to_checkpoint($routeKey, (string) ($row['route_keys_csv'] ?? ''))) {
            continue;
        }

        $passed = $row['passed_at'] !== null;
        if ((int) $row['is_mandatory'] === 1) {
            $mandatoryTotal++;
            if ($passed) {
                $mandatoryPassed++;
            }
        }

        $routeKeys = event2026_checkpoint_route_keys((string) ($row['route_keys_csv'] ?? ''));
        $shopId = $row['shop_id'] !== null ? (int) $row['shop_id'] : null;
        $eventDayCheckins = $shopId !== null ? ($eventDayCheckinsByShop[$shopId] ?? []) : [];
        $checkpoints[] = [
            'id' => (int) $row['id'],
            'shop_id' => $shopId,
            'shop_name' => $row['shop_name'] ?: $row['name'],
            'name' => (string) $row['name'],
            'lat' => (float) $row['lat'],
            'lng' => (float) $row['lng'],
            'order_index' => (int) $row['order_index'],
            'is_mandatory' => (int) $row['is_mandatory'],
            'min_distance_km' => (int) $row['min_distance_km'],
            'route_keys' => $routeKeys,
            'route_labels' => array_map('event2026_route_label', $routeKeys),
            'qr_code_id' => $row['qr_code_id'] !== null ? (int) $row['qr_code_id'] : null,
            'passed' => $passed,
            'passed_at' => $row['passed_at'],
            'source' => $row['source'],
            'checkin_id' => $row['checkin_id'] !== null ? (int) $row['checkin_id'] : null,
            'event_day_checkins' => $eventDayCheckins,
        ];
    }

    echo json_encode([
        'status' => 'success',
        'mode' => $mode,
        'event' => [
            'id' => $eventId,
            'name' => $event['name'],
            'event_date' => $event['event_date'],
            'status' => $event['status'],
        ],
        'slot' => [
            'id' => (int) $slot['id'],
            'route_key' => $routeKey,
            'route_name' => event2026_route_label($routeKey),
            'distance_km' => (int) ($slot['distance_km'] ?? event2026_route_definition($routeKey)['distance_km']),
            'route_type' => event2026_route_definition($routeKey)['route_type'],
            'full_name' => (string) $slot['full_name'],
        ],
        'checkpoints' => $checkpoints,
        'progress' => [
            'mandatory_total' => $mandatoryTotal,
            'mandatory_passed' => $mandatoryPassed,
            'is_finisher' => $mandatoryTotal > 0 && $mandatoryPassed >= $mandatoryTotal,
        ],
        'start_finish' => $startFinish,
        'stamping' => [
            'enabled' => $stampingEnabled,
            'available_from' => $stampingAvailableFrom,
            'message' => $stampingEnabled
                ? null
                : event2026_live_stamping_message($event),
        ],
        'sync' => [
            'server_time' => gmdate('c'),
            'gps_radius_m' => 300,
        ],
    ]);
} catch (Throwable $e) {
    if (http_response_code() < 400) {
        http_response_code(400);
    }

    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
