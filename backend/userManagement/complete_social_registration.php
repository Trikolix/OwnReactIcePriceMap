<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/social_auth.php';

$input = json_decode(file_get_contents('php://input'), true);
$pendingToken = trim((string) ($input['pendingRegistrationToken'] ?? ''));
$desiredUsername = trim((string) ($input['username'] ?? ''));
$acceptedTerms = !empty($input['acceptedTerms']);
$newsletterOptIn = !empty($input['newsletterOptIn']) ? 1 : 0;

try {
    if ($pendingToken === '') {
        throw new RuntimeException('Registrierungsdaten fehlen. Bitte erneut mit Google fortfahren.');
    }

    if (!$acceptedTerms) {
        throw new RuntimeException('Bitte akzeptiere AGB, Datenschutzerklärung und Community-Richtlinien.');
    }

    $pending = socialAuthDecodePendingRegistration($pendingToken);
    $identity = [
        'provider' => (string) ($pending['provider'] ?? ''),
        'provider_user_id' => (string) ($pending['provider_user_id'] ?? ''),
        'email' => (string) ($pending['email'] ?? ''),
        'email_verified' => !empty($pending['email_verified']),
        'display_name' => (string) ($pending['display_name'] ?? ''),
    ];

    if ($identity['provider'] === '' || $identity['provider_user_id'] === '' || $identity['email'] === '') {
        throw new RuntimeException('Die Google-Registrierungsdaten sind unvollständig. Bitte erneut versuchen.');
    }

    $existingUser = socialAuthFindResolvedUser($pdo, $identity);
    if ($existingUser) {
        $user = socialAuthResolveUser($pdo, $identity, $pending['inviteCode'] ?? null, $desiredUsername, $newsletterOptIn);
    } else {
        $user = socialAuthCreateUser($pdo, $identity, $pending['inviteCode'] ?? null, $desiredUsername, $newsletterOptIn);
        socialAuthUpsertIdentity($pdo, (int) $user['id'], $identity);
    }

    echo json_encode(socialAuthIssueAppLogin($pdo, $user));
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
