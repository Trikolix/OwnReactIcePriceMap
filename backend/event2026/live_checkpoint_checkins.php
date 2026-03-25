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

    $checkpointId = (int) ($_GET['checkpoint_id'] ?? 0);
    if ($checkpointId <= 0) {
        throw new InvalidArgumentException('checkpoint_id fehlt.');
    }

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $pageSize = min(100, max(1, (int) ($_GET['page_size'] ?? 50)));
    $offset = ($page - 1) * $pageSize;
    $consentSql = $mode === 'test' ? '' : ' AND s.public_name_consent = 1';
    $eventDate = $mode === 'test'
        ? gmdate('Y-m-d')
        : (!empty($event['event_date']) ? (string) $event['event_date'] : gmdate('Y-m-d'));

    $countStmt = $pdo->prepare("SELECT COUNT(*)
        FROM event2026_checkpoint_passages p
        INNER JOIN event2026_checkpoints c ON c.id = p.checkpoint_id
        INNER JOIN event2026_participant_slots s ON s.id = p.slot_id
        WHERE p.event_id = :event_id
          AND p.checkpoint_id = :checkpoint_id
          AND c.stamp_card_mode = :stamp_card_mode{$consentSql}");
    $countStmt->execute([
        ':event_id' => $eventId,
        ':checkpoint_id' => $checkpointId,
        ':stamp_card_mode' => $mode,
    ]);
    $total = (int) $countStmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT
            s.user_id,
            s.id AS slot_id,
            n.username,
            s.full_name AS user_display_name,
            s.route_key,
            p.passed_at AS checkin_time,
            p.source,
            s.distance_km AS distance,
            c.shop_id,
            COALESCE(
                p.checkin_id,
                (
                    SELECT c2.id
                    FROM checkins c2
                    WHERE c2.nutzer_id = s.user_id
                      AND c2.eisdiele_id = c.shop_id
                      AND DATE(c2.datum) = :event_date
                    ORDER BY c2.datum DESC, c2.id DESC
                    LIMIT 1
                )
            ) AS resolved_checkin_id
        FROM event2026_checkpoint_passages p
        INNER JOIN event2026_checkpoints c ON c.id = p.checkpoint_id
        INNER JOIN event2026_participant_slots s ON s.id = p.slot_id
        LEFT JOIN nutzer n ON n.id = s.user_id
        WHERE p.event_id = :event_id
          AND p.checkpoint_id = :checkpoint_id
          AND c.stamp_card_mode = :stamp_card_mode{$consentSql}
        ORDER BY p.passed_at DESC
        LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':event_id', $eventId, PDO::PARAM_INT);
    $stmt->bindValue(':checkpoint_id', $checkpointId, PDO::PARAM_INT);
    $stmt->bindValue(':stamp_card_mode', $mode, PDO::PARAM_STR);
    $stmt->bindValue(':event_date', $eventDate, PDO::PARAM_STR);
    $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'mode' => $mode,
        'items' => array_map(static function (array $row): array {
            $routeKey = event2026_normalize_route_key($row['route_key'] ?? '');
            return [
                'user_id' => $row['user_id'] !== null ? (int) $row['user_id'] : null,
                'slot_id' => $row['slot_id'] !== null ? (int) $row['slot_id'] : null,
                'username' => $row['username'] ?: null,
                'full_name' => $row['user_display_name'],
                'user_display_name' => $row['user_display_name'],
                'route_key' => $routeKey,
                'route_label' => event2026_route_label($routeKey),
                'checkin_time' => $row['checkin_time'],
                'source' => $row['source'],
                'distance' => (int) $row['distance'],
                'shop_id' => $row['shop_id'] !== null ? (int) $row['shop_id'] : null,
                'checkin_id' => $row['resolved_checkin_id'] !== null ? (int) $row['resolved_checkin_id'] : null,
            ];
        }, $rows),
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
