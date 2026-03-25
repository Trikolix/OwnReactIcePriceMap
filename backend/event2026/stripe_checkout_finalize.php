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

    $data = event2026_json_input();
    $registrationId = (int) ($data['registration_id'] ?? 0);
    $summaryToken = trim((string) ($data['summary_token'] ?? ''));
    $sessionId = trim((string) ($data['session_id'] ?? ''));

    if ($registrationId <= 0) {
        throw new InvalidArgumentException('registration_id fehlt.');
    }
    if ($sessionId === '') {
        throw new InvalidArgumentException('session_id fehlt.');
    }

    $registrationStmt = $pdo->prepare("SELECT
            r.id,
            r.event_id,
            r.registered_by_user_id,
            r.payment_reference_code
        FROM event2026_registrations r
        WHERE r.id = :registration_id
        LIMIT 1");
    $registrationStmt->execute([
        ':registration_id' => $registrationId,
    ]);
    $registration = $registrationStmt->fetch(PDO::FETCH_ASSOC);
    if (!$registration) {
        http_response_code(404);
        throw new RuntimeException('Registrierung nicht gefunden.');
    }

    $auth = authenticateRequest($pdo);
    $isAllowedByAuth = false;
    if ($auth) {
        $isAllowedByAuth = (int) $auth['user_id'] === 1
            || (int) $registration['registered_by_user_id'] === (int) $auth['user_id'];
    }
    $isAllowedByToken = event2026_validate_registration_access_token($pdo, $registrationId, $summaryToken);
    if (!$isAllowedByAuth && !$isAllowedByToken) {
        http_response_code(403);
        throw new RuntimeException('Keine Berechtigung für diese Registrierung.');
    }

    $session = event2026_stripe_api_get('/checkout/sessions/' . rawurlencode($sessionId));
    $metadata = is_array($session['metadata'] ?? null) ? $session['metadata'] : [];
    $sessionRegistrationId = (int) ($metadata['registration_id'] ?? 0);
    $sessionPaymentRef = (string) ($metadata['payment_reference_code'] ?? '');
    $eventKind = (string) ($metadata['event_kind'] ?? '');

    if ($eventKind !== 'registration') {
        throw new RuntimeException('Stripe-Session gehört nicht zu einer Registrierung.');
    }
    if ($sessionRegistrationId !== $registrationId) {
        throw new RuntimeException('Stripe-Session passt nicht zur Registrierung.');
    }
    if ($sessionPaymentRef !== (string) $registration['payment_reference_code']) {
        throw new RuntimeException('Stripe-Referenzcode passt nicht zur Registrierung.');
    }

    $pdo->beginTransaction();
    $result = event2026_apply_paid_stripe_session($pdo, $session, [
        'source' => 'checkout_finalize',
    ]);
    $pdo->commit();

    echo json_encode(array_merge([
        'status' => 'success',
    ], $result));
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
