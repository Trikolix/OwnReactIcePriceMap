<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/social_auth.php';

$stateParam = (string) ($_GET['state'] ?? '');
$code = (string) ($_GET['code'] ?? '');
$error = trim((string) ($_GET['error_description'] ?? $_GET['error'] ?? ''));

$origin = socialAuthCurrentOrigin();

try {
    if ($stateParam === '') {
        throw new RuntimeException('OAuth state fehlt.');
    }

    $state = socialAuthDecodeState($stateParam);
    $origin = rtrim((string) ($state['origin'] ?? ''), '/');

    if ($origin === '' || !socialAuthValidateFrontendOrigin($origin)) {
        throw new RuntimeException('Frontend-Origin im OAuth state ist ungültig.');
    }

    if (!empty($state['issuedAt']) && (time() - (int) $state['issuedAt']) > 900) {
        throw new RuntimeException('Die Social-Login-Anfrage ist abgelaufen. Bitte erneut versuchen.');
    }

    if ($error !== '') {
        throw new RuntimeException('Anmeldung vom Anbieter abgebrochen: ' . $error);
    }

    if ($code === '') {
        throw new RuntimeException('OAuth-Code fehlt.');
    }

    $provider = (string) ($state['provider'] ?? '');
    $identity = socialAuthFetchIdentity($provider, $code, socialAuthCallbackUrl());
    $existingUser = socialAuthFindResolvedUser($pdo, $identity);

    if ($existingUser) {
        $user = socialAuthResolveUser(
            $pdo,
            $identity,
            $state['mode'] === 'register' ? ($state['inviteCode'] ?? null) : null,
            $state['mode'] === 'register' ? ($state['desiredUsername'] ?? null) : null
        );
        $loginPayload = socialAuthIssueAppLogin($pdo, $user);

        socialAuthRenderPopupResult($origin, array_merge($loginPayload, [
            'type' => 'ice-social-auth',
            'provider' => $provider,
        ]));
    }

    socialAuthRenderPopupResult($origin, array_merge(
        socialAuthBuildPendingRegistration(
            $identity,
            $state['mode'] === 'register' ? ($state['inviteCode'] ?? null) : null,
            $state['mode'] === 'register' ? ($state['desiredUsername'] ?? null) : null
        ),
        ['type' => 'ice-social-auth']
    ));
} catch (Throwable $e) {
    socialAuthRenderPopupResult($origin, [
        'type' => 'ice-social-auth',
        'status' => 'error',
        'message' => $e->getMessage(),
    ], 400);
}
