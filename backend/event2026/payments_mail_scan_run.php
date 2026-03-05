<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $admin = event2026_require_admin($pdo);
    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    // MVP scaffold: IMAP integration is intentionally externalized.
    event2026_log_action($pdo, $eventId, $admin['user_id'], 'payment_mail_scan_run', 'event', $eventId, [
        'result' => 'noop',
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Mail-Scan-Job gestartet (MVP-Stub ohne IMAP-Anbindung).',
        'created_suggestions' => 0,
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
