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

    $checkpointId = (int) ($_GET['checkpoint_id'] ?? 0);
    if ($checkpointId <= 0) {
        throw new InvalidArgumentException('checkpoint_id fehlt.');
    }

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $pageSize = min(100, max(1, (int) ($_GET['page_size'] ?? 50)));
    $offset = ($page - 1) * $pageSize;

    $countStmt = $pdo->prepare("SELECT COUNT(*)
        FROM event2026_checkpoint_passages p
        INNER JOIN event2026_checkpoints c ON c.id = p.checkpoint_id
        INNER JOIN event2026_participant_slots s ON s.id = p.slot_id
        WHERE p.event_id = :event_id AND p.checkpoint_id = :checkpoint_id AND s.public_name_consent = 1");
    $countStmt->execute([
        ':event_id' => $eventId,
        ':checkpoint_id' => $checkpointId,
    ]);
    $total = (int) $countStmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT
            s.full_name AS user_display_name,
            p.passed_at AS checkin_time,
            p.source,
            s.distance_km AS distance
        FROM event2026_checkpoint_passages p
        INNER JOIN event2026_checkpoints c ON c.id = p.checkpoint_id
        INNER JOIN event2026_participant_slots s ON s.id = p.slot_id
        WHERE p.event_id = :event_id
          AND p.checkpoint_id = :checkpoint_id
          AND s.public_name_consent = 1
        ORDER BY p.passed_at DESC
        LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':event_id', $eventId, PDO::PARAM_INT);
    $stmt->bindValue(':checkpoint_id', $checkpointId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'items' => $rows,
        'pagination' => [
            'page' => $page,
            'page_size' => $pageSize,
            'total' => $total,
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
