<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/stripe_client.php';
require_once __DIR__ . '/stripe_payment_sync.php';

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $payload = file_get_contents('php://input');
    $signature = (string) ($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');
    $webhookSecret = event2026_stripe_webhook_secret();

    if (!event2026_stripe_verify_signature($payload ?: '', $signature, $webhookSecret)) {
        http_response_code(400);
        throw new RuntimeException('Ungültige Stripe-Signatur.');
    }

    $event = json_decode($payload ?: '', true);
    if (!is_array($event)) {
        http_response_code(400);
        throw new RuntimeException('Ungültiges Stripe-Event.');
    }

    $type = (string) ($event['type'] ?? '');
    if ($type !== 'checkout.session.completed') {
        echo json_encode(['status' => 'success', 'ignored' => true, 'event_type' => $type]);
        exit;
    }

    $session = $event['data']['object'] ?? null;
    if (!is_array($session)) {
        throw new RuntimeException('Stripe Session-Daten fehlen.');
    }

    $pdo->beginTransaction();
    $result = event2026_apply_paid_stripe_session($pdo, $session, [
        'source' => 'webhook',
        'stripe_event_id' => (string) ($event['id'] ?? ''),
    ]);

    $pdo->commit();

    echo json_encode(array_merge(['status' => 'success'], $result));
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
