<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/social_auth.php';

$provider = strtolower(trim((string) ($_GET['provider'] ?? '')));
$origin = rtrim(trim((string) ($_GET['origin'] ?? '')), '/');
$mode = strtolower(trim((string) ($_GET['mode'] ?? 'register')));
$inviteCode = trim((string) ($_GET['inviteCode'] ?? ''));
$desiredUsername = trim((string) ($_GET['desiredUsername'] ?? ''));

try {
    if ($origin === '' || !socialAuthValidateFrontendOrigin($origin)) {
        throw new RuntimeException('Unzulässige Frontend-Origin für Social Login.');
    }

    if (!in_array($mode, ['register', 'login'], true)) {
        $mode = 'register';
    }

    $config = socialAuthProviderConfig($provider);
    if (!socialAuthProviderIsConfigured($provider)) {
        throw new RuntimeException($config['label'] . '-Anmeldung ist aktuell noch nicht serverseitig konfiguriert.');
    }

    $state = socialAuthEncodeState([
        'provider' => $provider,
        'origin' => $origin,
        'mode' => $mode,
        'inviteCode' => $inviteCode !== '' ? $inviteCode : null,
        'desiredUsername' => $desiredUsername !== '' ? $desiredUsername : null,
        'issuedAt' => time(),
        'nonce' => bin2hex(random_bytes(16)),
    ]);

    $params = [
        'client_id' => $config['client_id'],
        'redirect_uri' => socialAuthCallbackUrl(),
        'response_type' => 'code',
        'state' => $state,
        'scope' => $config['scope'],
    ];

    if ($provider === 'google') {
        $params['prompt'] = 'select_account';
    }

    header('Location: ' . $config['authorize_url'] . '?' . http_build_query($params));
    exit;
} catch (Throwable $e) {
    $fallbackOrigin = $origin !== '' ? $origin : socialAuthCurrentOrigin();
    socialAuthRenderPopupResult($fallbackOrigin, [
        'type' => 'ice-social-auth',
        'status' => 'error',
        'provider' => $provider ?: null,
        'message' => $e->getMessage(),
    ], 400);
}
