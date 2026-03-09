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

    $stmt = $pdo->prepare("SELECT
            c.id AS checkpoint_id,
            c.name,
            c.lat,
            c.lng,
            c.route_keys_csv,
            COUNT(DISTINCT p.slot_id) AS checked_in_count,
            (
                SELECT COUNT(*)
                FROM event2026_participant_slots s
                WHERE s.event_id = c.event_id AND s.license_status = 'licensed'
            ) AS licensed_count
        FROM event2026_checkpoints c
        LEFT JOIN event2026_checkpoint_passages p
            ON p.checkpoint_id = c.id
            AND p.event_id = c.event_id
        WHERE c.event_id = :event_id
        GROUP BY c.id, c.name, c.lat, c.lng, c.route_keys_csv
        ORDER BY c.order_index ASC, c.id ASC");
    $stmt->execute([':event_id' => $eventId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'items' => array_map(static function (array $row): array {
            return [
                'checkpoint_id' => (int) $row['checkpoint_id'],
                'name' => $row['name'],
                'lat' => (float) $row['lat'],
                'lng' => (float) $row['lng'],
                'route_keys' => event2026_checkpoint_route_keys((string) ($row['route_keys_csv'] ?? '')),
                'route_labels' => array_map('event2026_route_label', event2026_checkpoint_route_keys((string) ($row['route_keys_csv'] ?? ''))),
                'checked_in_count' => (int) $row['checked_in_count'],
                'licensed_count' => (int) $row['licensed_count'],
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
