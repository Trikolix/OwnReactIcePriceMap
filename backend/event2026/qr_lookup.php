<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $code = trim((string) ($_GET['code'] ?? ''));
    $requestedMode = event2026_normalize_stamp_card_mode($_GET['mode'] ?? 'live');
    if ($code === '') {
        throw new InvalidArgumentException('code fehlt.');
    }

    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];
    $checkpointStmt = $pdo->prepare("SELECT
            c.id,
            c.event_id,
            c.shop_id,
            c.name,
            c.lat,
            c.lng,
            c.order_index,
            c.is_mandatory,
            c.min_distance_km,
            c.route_keys_csv,
            c.stamp_card_mode,
            c.qr_code_id,
            q.code AS qr_code,
            e.name AS shop_name
        FROM event2026_checkpoints c
        INNER JOIN qr_codes q ON q.id = c.qr_code_id
        LEFT JOIN eisdielen e ON e.id = c.shop_id
        WHERE c.event_id = :event_id
          AND q.code = :code
        ORDER BY CASE WHEN c.stamp_card_mode = :requested_mode THEN 0 ELSE 1 END, c.id ASC
        LIMIT 1");
    $checkpointStmt->execute([
        ':event_id' => $eventId,
        ':code' => $code,
        ':requested_mode' => $requestedMode,
    ]);
    $checkpoint = $checkpointStmt->fetch(PDO::FETCH_ASSOC);

    if (!$checkpoint) {
        http_response_code(404);
        throw new RuntimeException('Kein Ice-Tour Checkpoint für diesen QR-Code gefunden.');
    }

    $auth = authenticateRequest($pdo);
    $userPayload = [
        'is_logged_in' => false,
        'user_id' => null,
        'username' => null,
        'has_event_registration' => false,
        'slot_id' => null,
        'route_key' => null,
        'route_matches' => false,
        'already_passed' => false,
    ];

    if ($auth) {
        $userId = (int) $auth['user_id'];
        $slot = event2026_get_slot_for_user($pdo, $eventId, $userId);
        $routeKey = $slot ? event2026_normalize_route_key($slot['route_key'] ?? '') : null;
        $alreadyPassed = false;

        if ($slot) {
            $passStmt = $pdo->prepare("SELECT 1
                FROM event2026_checkpoint_passages
                WHERE event_id = :event_id
                  AND checkpoint_id = :checkpoint_id
                  AND slot_id = :slot_id
                LIMIT 1");
            $passStmt->execute([
                ':event_id' => $eventId,
                ':checkpoint_id' => (int) $checkpoint['id'],
                ':slot_id' => (int) $slot['id'],
            ]);
            $alreadyPassed = (bool) $passStmt->fetchColumn();
        }

        $userPayload = [
            'is_logged_in' => true,
            'user_id' => $userId,
            'username' => (string) ($auth['username'] ?? ''),
            'has_event_registration' => $slot !== null,
            'slot_id' => $slot ? (int) $slot['id'] : null,
            'route_key' => $routeKey,
            'route_matches' => $slot
                ? event2026_route_applies_to_checkpoint($routeKey, (string) ($checkpoint['route_keys_csv'] ?? ''))
                : false,
            'already_passed' => $alreadyPassed,
        ];
    }

    $scanPath = '/event-stamp-card?' . http_build_query([
        'mode' => (string) $checkpoint['stamp_card_mode'],
        'scan' => (string) $checkpoint['qr_code'],
        'checkpoint' => (int) $checkpoint['id'],
    ]);

    echo json_encode([
        'status' => 'success',
        'event' => [
            'id' => $eventId,
            'name' => (string) $event['name'],
            'event_date' => (string) ($event['event_date'] ?? ''),
        ],
        'checkpoint' => [
            'id' => (int) $checkpoint['id'],
            'name' => (string) $checkpoint['name'],
            'shop_id' => $checkpoint['shop_id'] !== null ? (int) $checkpoint['shop_id'] : null,
            'shop_name' => $checkpoint['shop_name'] ?: $checkpoint['name'],
            'lat' => (float) $checkpoint['lat'],
            'lng' => (float) $checkpoint['lng'],
            'order_index' => (int) $checkpoint['order_index'],
            'is_mandatory' => (int) $checkpoint['is_mandatory'],
            'min_distance_km' => (int) $checkpoint['min_distance_km'],
            'route_keys' => event2026_checkpoint_route_keys((string) ($checkpoint['route_keys_csv'] ?? '')),
            'route_labels' => array_map('event2026_route_label', event2026_checkpoint_route_keys((string) ($checkpoint['route_keys_csv'] ?? ''))),
            'mode' => (string) $checkpoint['stamp_card_mode'],
            'qr_code_id' => (int) $checkpoint['qr_code_id'],
            'qr_code' => (string) $checkpoint['qr_code'],
            'is_finish' => (int) ($checkpoint['shop_id'] ?? 0) === event2026_start_finish_shop_id((string) $checkpoint['stamp_card_mode']),
            'scan_path' => $scanPath,
        ],
        'user' => $userPayload,
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
