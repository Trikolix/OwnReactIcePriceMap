<?php
require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json');

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    $stmt = $pdo->prepare("SELECT
            i.id,
            i.title,
            i.caption,
            i.image_url,
            i.sort_order,
            i.created_at,
            e.slug AS event_slug,
            e.name AS event_name,
            e.event_date
        FROM event2026_impressions i
        JOIN event2026_seasons e ON e.id = i.event_id
        WHERE i.event_id = :event_id
          AND i.is_published = 1
        ORDER BY i.sort_order ASC, i.created_at DESC, i.id DESC");
    $stmt->execute([':event_id' => $eventId]);

    echo json_encode([
        'status' => 'success',
        'event' => [
            'id' => $eventId,
            'slug' => (string) $event['slug'],
            'name' => (string) $event['name'],
            'event_date' => $event['event_date'],
        ],
        'impressions' => array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'title' => $row['title'] ?: null,
                'caption' => $row['caption'] ?: null,
                'image_url' => (string) $row['image_url'],
                'sort_order' => (int) $row['sort_order'],
                'created_at' => $row['created_at'],
                'event_slug' => (string) $row['event_slug'],
                'event_name' => (string) $row['event_name'],
                'event_date' => $row['event_date'],
            ];
        }, $stmt->fetchAll(PDO::FETCH_ASSOC)),
    ]);
} catch (Throwable $e) {
    if (http_response_code() < 400) {
        http_response_code(500);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
