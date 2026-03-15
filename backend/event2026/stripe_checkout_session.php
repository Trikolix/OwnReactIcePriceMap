<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/stripe_client.php';

function event2026_checkout_url_from_template(string $template, array $vars): string
{
    $url = $template;
    foreach ($vars as $key => $value) {
        $url = str_replace('{' . $key . '}', (string) $value, $url);
    }
    return $url;
}

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $data = event2026_json_input();
    $registrationId = (int) ($data['registration_id'] ?? 0);
    $addonPurchaseId = (int) ($data['addon_purchase_id'] ?? 0);
    $summaryToken = trim((string) ($data['summary_token'] ?? ''));
    $buyerEmail = trim((string) ($data['buyer_email'] ?? ''));
    $paymentReferenceCode = trim((string) ($data['payment_reference_code'] ?? ''));

    if ($registrationId <= 0 && $addonPurchaseId <= 0) {
        throw new InvalidArgumentException('registration_id oder addon_purchase_id fehlt.');
    }

    if ($registrationId > 0 && $addonPurchaseId > 0) {
        throw new InvalidArgumentException('Bitte nur registration_id oder addon_purchase_id senden.');
    }

    $auth = authenticateRequest($pdo);

    if ($registrationId > 0) {
        $stmt = $pdo->prepare("SELECT
                r.id,
                r.event_id,
                r.registered_by_user_id,
                r.payment_reference_code,
                r.payment_status,
                p.expected_amount,
                p.status AS payment_status_detail
            FROM event2026_registrations r
            INNER JOIN event2026_payments p ON p.registration_id = r.id
            WHERE r.id = :registration_id
            LIMIT 1");
        $stmt->execute([':registration_id' => $registrationId]);
        $registration = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$registration) {
            http_response_code(404);
            throw new RuntimeException('Registrierung nicht gefunden.');
        }

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

        $expectedAmount = (float) ($registration['expected_amount'] ?? 0);
        $paymentStatus = (string) ($registration['payment_status_detail'] ?: $registration['payment_status']);
        if ($paymentStatus === 'paid') {
            throw new RuntimeException('Diese Registrierung ist bereits bezahlt.');
        }
        if ($expectedAmount <= 0) {
            throw new RuntimeException('Für diese Registrierung ist kein offener Betrag vorhanden.');
        }

        $successTemplate = event2026_stripe_env(
            'EVENT2026_STRIPE_SUCCESS_URL',
            'https://ice-app.de/#/event-registration-summary?registrationId={registration_id}&checkout=success&session_id={CHECKOUT_SESSION_ID}{summary_token_suffix}'
        );
        $cancelTemplate = event2026_stripe_env(
            'EVENT2026_STRIPE_CANCEL_URL',
            'https://ice-app.de/#/event-registration-summary?registrationId={registration_id}{summary_token_suffix}&checkout=cancel'
        );
        $summaryTokenSuffix = $summaryToken !== '' ? '&summaryToken=' . $summaryToken : '';
        $successUrl = event2026_checkout_url_from_template($successTemplate, [
            'registration_id' => $registrationId,
            'CHECKOUT_SESSION_ID' => '{CHECKOUT_SESSION_ID}',
            'summary_token_suffix' => $summaryTokenSuffix,
        ]);
        $cancelUrl = event2026_checkout_url_from_template($cancelTemplate, [
            'registration_id' => $registrationId,
            'summary_token_suffix' => $summaryTokenSuffix,
        ]);

        $session = event2026_stripe_create_checkout_session([
            'amount_eur' => $expectedAmount,
            'product_name' => 'Ice-Tour 2026 Anmeldung ' . (string) $registration['payment_reference_code'],
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'metadata' => [
                'event_kind' => 'registration',
                'event_id' => (string) ((int) $registration['event_id']),
                'registration_id' => (string) $registrationId,
                'payment_reference_code' => (string) $registration['payment_reference_code'],
            ],
        ]);

        echo json_encode([
            'status' => 'success',
            'checkout_url' => (string) ($session['url'] ?? ''),
            'checkout_session_id' => (string) ($session['id'] ?? ''),
        ]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT
            id,
            event_id,
            registration_id,
            buyer_user_id,
            buyer_name,
            buyer_email,
            payment_reference_code,
            expected_amount,
            status
        FROM event2026_addon_purchases
        WHERE id = :id
        LIMIT 1");
    $stmt->execute([':id' => $addonPurchaseId]);
    $purchase = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$purchase) {
        http_response_code(404);
        throw new RuntimeException('Zusatzbestellung nicht gefunden.');
    }

    $isAllowed = false;
    if ($auth) {
        $isAllowed = (int) $auth['user_id'] === 1
            || ((int) ($purchase['buyer_user_id'] ?? 0) > 0 && (int) $purchase['buyer_user_id'] === (int) $auth['user_id']);
    } else {
        $isGuestMatch = $buyerEmail !== ''
            && strcasecmp($buyerEmail, (string) ($purchase['buyer_email'] ?? '')) === 0
            && $paymentReferenceCode !== ''
            && strcasecmp($paymentReferenceCode, (string) ($purchase['payment_reference_code'] ?? '')) === 0;
        $isAllowed = $isGuestMatch;
    }

    if (!$isAllowed) {
        http_response_code(403);
        throw new RuntimeException('Keine Berechtigung für diese Zusatzbestellung.');
    }

    $expectedAmount = (float) ($purchase['expected_amount'] ?? 0);
    $status = (string) ($purchase['status'] ?? '');
    if ($status === 'paid') {
        throw new RuntimeException('Diese Zusatzbestellung ist bereits bezahlt.');
    }
    if ($expectedAmount <= 0) {
        throw new RuntimeException('Für diese Zusatzbestellung ist kein offener Betrag vorhanden.');
    }

    $successTemplate = event2026_stripe_env(
        'EVENT2026_STRIPE_SUCCESS_URL_ADDON',
        'https://ice-app.de/#/event-gifts?checkout=success&session_id={CHECKOUT_SESSION_ID}'
    );
    $cancelTemplate = event2026_stripe_env(
        'EVENT2026_STRIPE_CANCEL_URL_ADDON',
        'https://ice-app.de/#/event-gifts?checkout=cancel'
    );
    $successUrl = event2026_checkout_url_from_template($successTemplate, [
        'CHECKOUT_SESSION_ID' => '{CHECKOUT_SESSION_ID}',
    ]);
    $cancelUrl = event2026_checkout_url_from_template($cancelTemplate, []);

    $session = event2026_stripe_create_checkout_session([
        'amount_eur' => $expectedAmount,
        'product_name' => 'Ice-Tour 2026 Gutscheine ' . (string) $purchase['payment_reference_code'],
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'metadata' => [
            'event_kind' => 'addon_purchase',
            'event_id' => (string) ((int) $purchase['event_id']),
            'addon_purchase_id' => (string) $addonPurchaseId,
            'payment_reference_code' => (string) $purchase['payment_reference_code'],
        ],
    ]);

    echo json_encode([
        'status' => 'success',
        'checkout_url' => (string) ($session['url'] ?? ''),
        'checkout_session_id' => (string) ($session['id'] ?? ''),
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
