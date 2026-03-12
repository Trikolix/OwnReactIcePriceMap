<?php

function event2026_stripe_env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    if (($value === false || $value === '') && isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        $value = (string) $_SERVER[$key];
    }
    if (($value === false || $value === '') && isset($_ENV[$key]) && $_ENV[$key] !== '') {
        $value = (string) $_ENV[$key];
    }
    if ($value === false || $value === '') {
        return $default;
    }
    return $value;
}

function event2026_stripe_local_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $path = __DIR__ . '/stripe.local.php';
    if (!is_file($path)) {
        $config = [];
        return $config;
    }

    $loaded = require $path;
    $config = is_array($loaded) ? $loaded : [];
    return $config;
}

function event2026_stripe_secret_key(): string
{
    $local = event2026_stripe_local_config();
    $secret = event2026_stripe_env('EVENT2026_STRIPE_SECRET_KEY')
        ?? event2026_stripe_env('STRIPE_SECRET_KEY')
        ?? (($local['EVENT2026_STRIPE_SECRET_KEY'] ?? '') !== '' ? (string) $local['EVENT2026_STRIPE_SECRET_KEY'] : null)
        ?? (($local['STRIPE_SECRET_KEY'] ?? '') !== '' ? (string) $local['STRIPE_SECRET_KEY'] : null)
        ?? '';
    if ($secret === '') {
        throw new RuntimeException('Stripe Secret Key fehlt (EVENT2026_STRIPE_SECRET_KEY).');
    }
    return $secret;
}

function event2026_stripe_webhook_secret(): string
{
    $local = event2026_stripe_local_config();
    $secret = event2026_stripe_env('EVENT2026_STRIPE_WEBHOOK_SECRET')
        ?? event2026_stripe_env('STRIPE_WEBHOOK_SECRET')
        ?? (($local['EVENT2026_STRIPE_WEBHOOK_SECRET'] ?? '') !== '' ? (string) $local['EVENT2026_STRIPE_WEBHOOK_SECRET'] : null)
        ?? (($local['STRIPE_WEBHOOK_SECRET'] ?? '') !== '' ? (string) $local['STRIPE_WEBHOOK_SECRET'] : null)
        ?? '';
    if ($secret === '') {
        throw new RuntimeException('Stripe Webhook Secret fehlt (EVENT2026_STRIPE_WEBHOOK_SECRET).');
    }
    return $secret;
}

function event2026_stripe_api_post(string $path, array $params): array
{
    $secret = event2026_stripe_secret_key();
    $url = 'https://api.stripe.com/v1/' . ltrim($path, '/');

    $ch = curl_init($url);
    if (!$ch) {
        throw new RuntimeException('Stripe cURL konnte nicht initialisiert werden.');
    }

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $secret,
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_POSTFIELDS => http_build_query($params),
        CURLOPT_TIMEOUT => 20,
    ]);

    $responseBody = curl_exec($ch);
    $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($responseBody === false) {
        throw new RuntimeException('Stripe API Fehler: ' . ($curlError ?: 'Unbekannter cURL Fehler'));
    }

    $json = json_decode($responseBody, true);
    if (!is_array($json)) {
        throw new RuntimeException('Stripe API Antwort war kein valides JSON.');
    }

    if ($statusCode < 200 || $statusCode >= 300) {
        $msg = (string) ($json['error']['message'] ?? 'Unbekannter Stripe Fehler');
        throw new RuntimeException('Stripe API Fehler: ' . $msg);
    }

    return $json;
}

function event2026_stripe_create_checkout_session(array $args): array
{
    $amountCents = (int) round(((float) ($args['amount_eur'] ?? 0)) * 100);
    if ($amountCents <= 0) {
        throw new InvalidArgumentException('Stripe Checkout benötigt einen Betrag größer 0.');
    }

    $metadata = is_array($args['metadata'] ?? null) ? $args['metadata'] : [];
    $productName = (string) ($args['product_name'] ?? 'Ice-Tour 2026');
    $successUrl = (string) ($args['success_url'] ?? '');
    $cancelUrl = (string) ($args['cancel_url'] ?? '');

    if ($successUrl === '' || $cancelUrl === '') {
        throw new InvalidArgumentException('Stripe Success/Cancel URL fehlt.');
    }

    $params = [
        'mode' => 'payment',
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'line_items[0][quantity]' => 1,
        'line_items[0][price_data][currency]' => 'eur',
        'line_items[0][price_data][unit_amount]' => $amountCents,
        'line_items[0][price_data][product_data][name]' => $productName,
        'payment_intent_data[metadata][event_kind]' => (string) ($metadata['event_kind'] ?? ''),
    ];

    foreach ($metadata as $key => $value) {
        $params["metadata[{$key}]"] = (string) $value;
        $params["payment_intent_data[metadata][{$key}]"] = (string) $value;
    }

    return event2026_stripe_api_post('/checkout/sessions', $params);
}

function event2026_stripe_verify_signature(string $payload, string $signatureHeader, string $secret): bool
{
    if ($signatureHeader === '' || $secret === '') {
        return false;
    }

    $parts = [];
    foreach (explode(',', $signatureHeader) as $part) {
        $segment = explode('=', trim($part), 2);
        if (count($segment) === 2) {
            $parts[$segment[0]][] = $segment[1];
        }
    }

    $timestamp = $parts['t'][0] ?? null;
    $signatures = $parts['v1'] ?? [];
    if (!$timestamp || !$signatures) {
        return false;
    }

    if (abs(time() - (int) $timestamp) > 300) {
        return false;
    }

    $signedPayload = $timestamp . '.' . $payload;
    $expected = hash_hmac('sha256', $signedPayload, $secret);
    foreach ($signatures as $candidate) {
        if (hash_equals($expected, $candidate)) {
            return true;
        }
    }

    return false;
}
