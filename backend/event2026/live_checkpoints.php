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
            throw new RuntimeException('Test-Live-Map ist nur für Admin verfügbar.');
        }
    }

    $stmt = $pdo->prepare("SELECT
            c.id AS checkpoint_id,
            c.name,
            c.lat,
            c.lng,
            c.route_keys_csv,
            c.shop_id,
            COUNT(DISTINCT p.slot_id) AS checked_in_count
        FROM event2026_checkpoints c
        LEFT JOIN event2026_checkpoint_passages p
            ON p.checkpoint_id = c.id
            AND p.event_id = c.event_id
        WHERE c.event_id = :event_id
          AND c.stamp_card_mode = :stamp_card_mode
        GROUP BY c.id, c.name, c.lat, c.lng, c.route_keys_csv, c.shop_id
        ORDER BY c.order_index ASC, c.id ASC");
    $stmt->execute([
        ':event_id' => $eventId,
        ':stamp_card_mode' => $mode,
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $licensedCountsByRoute = [];
    if ($mode === 'test') {
        $licensedCountsByRoute = [
            'family_2' => 1,
            'classic_3' => 1,
            'epic_4' => 1,
        ];
    } else {
        $slotStmt = $pdo->prepare("SELECT route_key, COUNT(*) AS slot_count
            FROM event2026_participant_slots
            WHERE event_id = :event_id
              AND license_status = 'licensed'
            GROUP BY route_key");
        $slotStmt->execute([':event_id' => $eventId]);
        foreach ($slotStmt->fetchAll(PDO::FETCH_ASSOC) as $slotRow) {
            $routeKey = event2026_normalize_route_key($slotRow['route_key'] ?? '');
            $licensedCountsByRoute[$routeKey] = (int) ($slotRow['slot_count'] ?? 0);
        }
    }

    echo json_encode([
        'status' => 'success',
        'mode' => $mode,
        'start_finish' => event2026_start_finish_config($pdo, $mode),
        'items' => array_map(static function (array $row) use ($licensedCountsByRoute): array {
            $routeKeys = event2026_checkpoint_route_keys((string) ($row['route_keys_csv'] ?? ''));
            $licensedCount = 0;
            foreach ($routeKeys as $routeKey) {
                $licensedCount += (int) ($licensedCountsByRoute[$routeKey] ?? 0);
            }
            return [
                'checkpoint_id' => (int) $row['checkpoint_id'],
                'shop_id' => $row['shop_id'] !== null ? (int) $row['shop_id'] : null,
                'name' => $row['name'],
                'lat' => (float) $row['lat'],
                'lng' => (float) $row['lng'],
                'route_keys' => $routeKeys,
                'route_labels' => array_map('event2026_route_label', $routeKeys),
                'checked_in_count' => (int) $row['checked_in_count'],
                'licensed_count' => $licensedCount,
            ];
        }, $rows),
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
