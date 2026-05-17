<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];
    $mode = event2026_normalize_stamp_card_mode($_GET['mode'] ?? 'live');
    if ($mode === 'test') {
        $auth = event2026_require_auth_user($pdo);
        if ((int) $auth['user_id'] !== 1) {
            http_response_code(403);
            throw new RuntimeException('Test-Live-Ranking ist nur für Admin verfügbar.');
        }
    }

    $eventDate = $mode === 'test'
        ? gmdate('Y-m-d')
        : (!empty($event['event_date']) ? (string) $event['event_date'] : gmdate('Y-m-d'));
    $consentSql = $mode === 'test' ? '' : ' AND s.public_name_consent = 1';

    $stmt = $pdo->prepare("SELECT
            s.id AS slot_id,
            s.user_id,
            s.full_name AS user_display_name,
            s.route_key,
            s.distance_km,
            n.username,
            COALESCE(r.portion_count, 0) AS portion_count,
            COALESCE(r.checkin_count, 0) AS checkin_count,
            r.last_checkin_at,
            COALESCE(r.shop_names, '') AS shop_names
        FROM event2026_participant_slots s
        LEFT JOIN nutzer n ON n.id = s.user_id
        LEFT JOIN (
            SELECT
                c.nutzer_id,
                COUNT(cs.id) AS portion_count,
                COUNT(DISTINCT c.id) AS checkin_count,
                MAX(c.datum) AS last_checkin_at,
                GROUP_CONCAT(DISTINCT e.name ORDER BY c.datum ASC SEPARATOR ', ') AS shop_names
            FROM checkins c
            INNER JOIN checkin_sorten cs ON cs.checkin_id = c.id
            INNER JOIN event2026_checkpoints cp
                ON cp.shop_id = c.eisdiele_id
                AND cp.event_id = :event_id_inner
                AND cp.stamp_card_mode = :stamp_card_mode_inner
            LEFT JOIN eisdielen e ON e.id = c.eisdiele_id
            WHERE DATE(c.datum) = :event_date
            GROUP BY c.nutzer_id
        ) r ON r.nutzer_id = s.user_id
        WHERE s.event_id = :event_id
          AND s.license_status = 'licensed'
          AND s.user_id IS NOT NULL{$consentSql}
        ORDER BY portion_count DESC, checkin_count DESC, last_checkin_at ASC, s.full_name ASC");
    $stmt->execute([
        ':event_id_inner' => $eventId,
        ':stamp_card_mode_inner' => $mode,
        ':event_date' => $eventDate,
        ':event_id' => $eventId,
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $rankedItems = [];
    $position = 0;
    $lastPortions = null;
    $lastCheckins = null;
    $rank = 0;
    foreach ($rows as $row) {
        $position += 1;
        $portionCount = (int) ($row['portion_count'] ?? 0);
        $checkinCount = (int) ($row['checkin_count'] ?? 0);
        if ($lastPortions !== $portionCount || $lastCheckins !== $checkinCount) {
            $rank = $position;
            $lastPortions = $portionCount;
            $lastCheckins = $checkinCount;
        }
        $routeKey = event2026_normalize_route_key($row['route_key'] ?? '');
        $rankedItems[] = [
            'rank' => $rank,
            'slot_id' => (int) $row['slot_id'],
            'user_id' => $row['user_id'] !== null ? (int) $row['user_id'] : null,
            'username' => $row['username'] ?: null,
            'full_name' => $row['user_display_name'],
            'user_display_name' => $row['user_display_name'],
            'route_key' => $routeKey,
            'route_label' => event2026_route_label($routeKey),
            'distance_km' => (int) $row['distance_km'],
            'portion_count' => $portionCount,
            'checkin_count' => $checkinCount,
            'last_checkin_at' => $row['last_checkin_at'] ?: null,
            'shop_names' => $row['shop_names'] !== '' ? array_values(array_filter(array_map('trim', explode(',', (string) $row['shop_names'])))) : [],
        ];
    }

    echo json_encode([
        'status' => 'success',
        'mode' => $mode,
        'event_date' => $eventDate,
        'items' => $rankedItems,
        'summary' => [
            'participants' => count($rankedItems),
            'participants_with_portions' => count(array_filter($rankedItems, static fn(array $item): bool => (int) $item['portion_count'] > 0)),
            'total_portions' => array_sum(array_map(static fn(array $item): int => (int) $item['portion_count'], $rankedItems)),
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
