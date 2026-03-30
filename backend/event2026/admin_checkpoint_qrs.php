<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    event2026_require_admin($pdo);
    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    $stmt = $pdo->prepare("SELECT
            c.id,
            c.shop_id,
            c.name,
            c.order_index,
            c.stamp_card_mode,
            c.route_keys_csv,
            c.qr_code_id,
            q.code AS qr_code,
            e.name AS shop_name
        FROM event2026_checkpoints c
        INNER JOIN qr_codes q ON q.id = c.qr_code_id
        LEFT JOIN eisdielen e ON e.id = c.shop_id
        WHERE c.event_id = :event_id
        ORDER BY CASE WHEN c.stamp_card_mode = 'live' THEN 0 ELSE 1 END, c.order_index ASC, c.id ASC");
    $stmt->execute([':event_id' => $eventId]);

    $checkpoints = array_map(static function (array $row): array {
        return [
            'checkpoint_id' => (int) $row['id'],
            'shop_id' => $row['shop_id'] !== null ? (int) $row['shop_id'] : null,
            'shop_name' => $row['shop_name'] ?: $row['name'],
            'checkpoint_name' => (string) $row['name'],
            'order_index' => (int) $row['order_index'],
            'mode' => (string) $row['stamp_card_mode'],
            'route_keys' => event2026_checkpoint_route_keys((string) ($row['route_keys_csv'] ?? '')),
            'route_labels' => array_map('event2026_route_label', event2026_checkpoint_route_keys((string) ($row['route_keys_csv'] ?? ''))),
            'qr_code_id' => (int) $row['qr_code_id'],
            'qr_code' => (string) $row['qr_code'],
            'scan_path' => '/?' . http_build_query([
                'scan' => (string) $row['qr_code'],
            ]),
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode([
        'status' => 'success',
        'event' => [
            'id' => $eventId,
            'name' => (string) $event['name'],
            'event_date' => (string) ($event['event_date'] ?? ''),
        ],
        'checkpoints' => $checkpoints,
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
