<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $code = strtoupper(trim((string) ($_GET['code'] ?? '')));
    if ($code === '') {
        throw new InvalidArgumentException('Gutschein-Code fehlt.');
    }

    $event = event2026_current_event($pdo);
    $voucher = event2026_load_gift_voucher($pdo, (int) $event['id'], $code, false);
    $status = event2026_gift_voucher_status($voucher);

    echo json_encode([
        'status' => 'success',
        'voucher' => [
            'code' => $code,
            'state' => $status['state'],
            'message' => $status['message'],
            'valid' => $status['state'] === 'valid',
            'value' => 15.0,
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
