<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $admin = event2026_require_admin($pdo);
    $data = event2026_json_input();

    $capacity = (int) ($data['capacity'] ?? 20);
    $womenWaveMinSize = (int) ($data['women_wave_min_size'] ?? 10);

    if ($capacity < 1 || $capacity > 100) {
        throw new InvalidArgumentException('Ungültige Kapazität.');
    }
    if ($womenWaveMinSize < 0 || $womenWaveMinSize > 100) {
        throw new InvalidArgumentException('Ungültige Mindestgröße für Frauenwelle.');
    }

    $pdo->beginTransaction();

    $event = event2026_current_event($pdo, true);
    $eventId = (int) $event['id'];

    $result = event2026_recompute_waves($pdo, $eventId, $capacity, $womenWaveMinSize);

    event2026_log_action($pdo, $eventId, $admin['user_id'], 'wave_recompute', 'event', $eventId, [
        'capacity' => $capacity,
        'women_wave_min_size' => $womenWaveMinSize,
        'result' => $result,
    ]);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Wellen wurden neu berechnet.',
        'result' => $result,
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (http_response_code() < 400) {
        http_response_code(400);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
