<?php

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/user_notification_settings.php';

function socialAuthGetEnv(string $key, ?string $default = null): ?string {
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }

    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }

    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }

    return $default;
}

function socialAuthRequestScheme(): string {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
}

function socialAuthCurrentOrigin(): string {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return socialAuthRequestScheme() . '://' . $host;
}

function socialAuthAllowedOrigins(): array {
    $configured = socialAuthGetEnv('SOCIAL_AUTH_ALLOWED_ORIGINS', '');
    $origins = array_filter(array_map('trim', explode(',', $configured)));

    if (!$origins) {
        $origins = [
            socialAuthCurrentOrigin(),
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ];
    }

    return array_values(array_unique($origins));
}

function socialAuthValidateFrontendOrigin(string $origin): bool {
    return in_array(rtrim($origin, '/'), array_map(static fn ($item) => rtrim($item, '/'), socialAuthAllowedOrigins()), true);
}

function socialAuthBaseUrl(): string {
    $origin = socialAuthCurrentOrigin();
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    return $origin . rtrim($scriptDir, '/');
}

function socialAuthCallbackUrl(): string {
    return socialAuthBaseUrl() . '/oauth_callback.php';
}

function socialAuthStateSecret(): string {
    $secret = socialAuthGetEnv('SOCIAL_AUTH_STATE_SECRET', '');
    if ($secret === '') {
        throw new RuntimeException('SOCIAL_AUTH_STATE_SECRET ist nicht gesetzt.');
    }

    return $secret;
}

function socialAuthBase64UrlEncode(string $value): string {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function socialAuthBase64UrlDecode(string $value): string {
    $padded = strtr($value, '-_', '+/');
    $padding = strlen($padded) % 4;
    if ($padding > 0) {
        $padded .= str_repeat('=', 4 - $padding);
    }

    $decoded = base64_decode($padded, true);
    if ($decoded === false) {
        throw new RuntimeException('Base64URL-Dekodierung fehlgeschlagen.');
    }

    return $decoded;
}

function socialAuthEncodeState(array $payload): string {
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException('OAuth state konnte nicht serialisiert werden.');
    }

    $base = socialAuthBase64UrlEncode($json);
    $signature = socialAuthBase64UrlEncode(hash_hmac('sha256', $base, socialAuthStateSecret(), true));

    return $base . '.' . $signature;
}

function socialAuthDecodeState(string $state): array {
    $parts = explode('.', $state, 2);
    if (count($parts) !== 2) {
        throw new RuntimeException('Ungültiger OAuth state.');
    }

    [$base, $signature] = $parts;
    $expected = socialAuthBase64UrlEncode(hash_hmac('sha256', $base, socialAuthStateSecret(), true));
    if (!hash_equals($expected, $signature)) {
        throw new RuntimeException('OAuth state Signatur ungültig.');
    }

    $payload = json_decode(socialAuthBase64UrlDecode($base), true);
    if (!is_array($payload)) {
        throw new RuntimeException('OAuth state Inhalt ungültig.');
    }

    return $payload;
}

function socialAuthProviderConfig(string $provider): array {
    $provider = strtolower(trim($provider));

    $configs = [
        'google' => [
            'provider' => 'google',
            'label' => 'Google',
            'client_id' => socialAuthGetEnv('GOOGLE_OAUTH_CLIENT_ID', ''),
            'client_secret' => socialAuthGetEnv('GOOGLE_OAUTH_CLIENT_SECRET', ''),
            'authorize_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
            'token_url' => 'https://oauth2.googleapis.com/token',
            'userinfo_url' => 'https://openidconnect.googleapis.com/v1/userinfo',
            'scope' => 'openid email profile',
        ],
        'facebook' => [
            'provider' => 'facebook',
            'label' => 'Facebook',
            'client_id' => socialAuthGetEnv('FACEBOOK_OAUTH_APP_ID', ''),
            'client_secret' => socialAuthGetEnv('FACEBOOK_OAUTH_APP_SECRET', ''),
            'authorize_url' => 'https://www.facebook.com/dialog/oauth',
            'token_url' => 'https://graph.facebook.com/oauth/access_token',
            'userinfo_url' => 'https://graph.facebook.com/me?fields=id,name,email',
            'scope' => 'email,public_profile',
        ],
    ];

    if (!isset($configs[$provider])) {
        throw new RuntimeException('Unbekannter OAuth-Provider.');
    }

    return $configs[$provider];
}

function socialAuthProviderIsConfigured(string $provider): bool {
    $config = socialAuthProviderConfig($provider);
    return $config['client_id'] !== '' && $config['client_secret'] !== '';
}

function socialAuthHttpPostForm(string $url, array $data): array {
    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException('cURL konnte nicht initialisiert werden.');
    }

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_POSTFIELDS => http_build_query($data),
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/x-www-form-urlencoded',
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException('OAuth HTTP-Fehler: ' . $error);
    }

    curl_close($ch);

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        parse_str($response, $parsed);
        $decoded = is_array($parsed) ? $parsed : [];
    }

    if ($httpCode >= 400) {
        $message = $decoded['error_description'] ?? $decoded['error']['message'] ?? $decoded['message'] ?? ('HTTP ' . $httpCode);
        throw new RuntimeException('OAuth Token-Austausch fehlgeschlagen: ' . $message);
    }

    return $decoded;
}

function socialAuthHttpGetJson(string $url, array $headers = []): array {
    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException('cURL konnte nicht initialisiert werden.');
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => array_merge(['Accept: application/json'], $headers),
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException('OAuth HTTP-Fehler: ' . $error);
    }

    curl_close($ch);

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('OAuth-Antwort war kein JSON.');
    }

    if ($httpCode >= 400) {
        $message = $decoded['error_description'] ?? $decoded['error']['message'] ?? $decoded['message'] ?? ('HTTP ' . $httpCode);
        throw new RuntimeException('OAuth Profilabruf fehlgeschlagen: ' . $message);
    }

    return $decoded;
}

function socialAuthFetchIdentity(string $provider, string $code, string $redirectUri): array {
    $config = socialAuthProviderConfig($provider);

    if (!socialAuthProviderIsConfigured($provider)) {
        throw new RuntimeException($config['label'] . '-OAuth ist noch nicht konfiguriert.');
    }

    if ($provider === 'google') {
        $tokenResponse = socialAuthHttpPostForm($config['token_url'], [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri,
        ]);

        $accessToken = $tokenResponse['access_token'] ?? '';
        if ($accessToken === '') {
            throw new RuntimeException('Google hat kein Access-Token geliefert.');
        }

        $profile = socialAuthHttpGetJson($config['userinfo_url'], [
            'Authorization: Bearer ' . $accessToken,
        ]);

        $providerUserId = (string) ($profile['sub'] ?? '');
        $email = isset($profile['email']) ? strtolower(trim((string) $profile['email'])) : '';
        if ($providerUserId === '' || $email === '') {
            throw new RuntimeException('Google hat keine ausreichenden Profildaten geliefert.');
        }

        return [
            'provider' => 'google',
            'provider_user_id' => $providerUserId,
            'email' => $email,
            'email_verified' => !empty($profile['email_verified']),
            'display_name' => trim((string) ($profile['name'] ?? $email)),
        ];
    }

    if ($provider === 'facebook') {
        $tokenUrl = $config['token_url']
            . '?client_id=' . urlencode($config['client_id'])
            . '&client_secret=' . urlencode($config['client_secret'])
            . '&redirect_uri=' . urlencode($redirectUri)
            . '&code=' . urlencode($code);

        $tokenResponse = socialAuthHttpGetJson($tokenUrl);
        $accessToken = $tokenResponse['access_token'] ?? '';
        if ($accessToken === '') {
            throw new RuntimeException('Facebook hat kein Access-Token geliefert.');
        }

        $profile = socialAuthHttpGetJson($config['userinfo_url'] . '&access_token=' . urlencode($accessToken));
        $providerUserId = (string) ($profile['id'] ?? '');
        $email = isset($profile['email']) ? strtolower(trim((string) $profile['email'])) : '';
        if ($providerUserId === '' || $email === '') {
            throw new RuntimeException('Facebook hat keine E-Mail-Adresse geliefert. Bitte nutze alternativ Google oder die normale Registrierung.');
        }

        return [
            'provider' => 'facebook',
            'provider_user_id' => $providerUserId,
            'email' => $email,
            'email_verified' => true,
            'display_name' => trim((string) ($profile['name'] ?? $email)),
        ];
    }

    throw new RuntimeException('Unbekannter OAuth-Provider.');
}

function socialAuthRenderPopupResult(string $origin, array $payload, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: text/html; charset=utf-8');

    $safeOrigin = json_encode(rtrim($origin, '/'), JSON_UNESCAPED_SLASHES);
    $safePayload = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $title = $payload['status'] === 'success' ? 'Anmeldung abgeschlossen' : 'Anmeldung fehlgeschlagen';
    $message = $payload['message'] ?? ($payload['status'] === 'success' ? 'Du kannst dieses Fenster jetzt schließen.' : 'Der Vorgang konnte nicht abgeschlossen werden.');

    echo '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>' . htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</title></head>';
    echo '<body style="font-family:Arial,sans-serif;padding:24px;">';
    echo '<h1 style="font-size:20px;margin-bottom:12px;">' . htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</h1>';
    echo '<p style="margin:0 0 16px;">' . htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>';
    echo '<p style="color:#666;font-size:14px;">Falls sich das Fenster nicht automatisch schließt, kannst du es einfach schließen.</p>';
    echo '<script>';
    echo 'const origin = ' . $safeOrigin . ';';
    echo 'const payload = ' . $safePayload . ';';
    echo 'try { if (window.opener && origin) { window.opener.postMessage(payload, origin); window.close(); } } catch (error) {}';
    echo '</script></body></html>';
    exit;
}

function socialAuthEnsureTable(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS social_auth_identities (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id INT NOT NULL,
            provider VARCHAR(32) NOT NULL,
            provider_user_id VARCHAR(191) NOT NULL,
            email VARCHAR(255) DEFAULT NULL,
            display_name VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_login_at TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_social_provider_user (provider, provider_user_id),
            KEY idx_social_user_id (user_id),
            KEY idx_social_provider_email (provider, email),
            CONSTRAINT fk_social_auth_user FOREIGN KEY (user_id) REFERENCES nutzer (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
}

function socialAuthGenerateInviteCode(int $length = 10): string {
    return bin2hex(random_bytes((int) max(1, $length / 2)));
}

function socialAuthSlugifyUsername(string $value): string {
    $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
    if ($transliterated === false) {
        $transliterated = $value;
    }

    $slug = preg_replace('/[^a-zA-Z0-9_-]+/', '', $transliterated ?? '');
    if ($slug === null || $slug === '') {
        $slug = 'user';
    }

    if (!preg_match('/^[a-zA-Z]/', $slug)) {
        $slug = 'user' . $slug;
    }

    $slug = substr($slug, 0, 20);
    if (strlen($slug) < 3) {
        $slug = str_pad($slug, 3, '0');
    }

    return $slug;
}

function socialAuthCreateUniqueUsername(PDO $pdo, string $preferred, string $email): string {
    $base = socialAuthSlugifyUsername($preferred !== '' ? $preferred : explode('@', $email)[0]);
    $candidate = $base;
    $counter = 1;

    while (true) {
        $stmt = $pdo->prepare('SELECT id FROM nutzer WHERE username = ? LIMIT 1');
        $stmt->execute([$candidate]);
        if (!$stmt->fetch()) {
            return $candidate;
        }

        $suffix = (string) $counter;
        $candidate = substr($base, 0, max(3, 20 - strlen($suffix))) . $suffix;
        $counter++;
    }
}

function socialAuthFindIdentity(PDO $pdo, string $provider, string $providerUserId): ?array {
    $stmt = $pdo->prepare("
        SELECT n.id, n.username, n.email, n.is_verified
        FROM social_auth_identities s
        JOIN nutzer n ON n.id = s.user_id
        WHERE s.provider = :provider AND s.provider_user_id = :provider_user_id
        LIMIT 1
    ");
    $stmt->execute([
        'provider' => $provider,
        'provider_user_id' => $providerUserId,
    ]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function socialAuthFindUserByEmail(PDO $pdo, string $email): ?array {
    $stmt = $pdo->prepare('SELECT id, username, email, is_verified FROM nutzer WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function socialAuthUpsertIdentity(PDO $pdo, int $userId, array $identity): void {
    $stmt = $pdo->prepare("
        INSERT INTO social_auth_identities (user_id, provider, provider_user_id, email, display_name, linked_at, last_login_at)
        VALUES (:user_id, :provider, :provider_user_id, :email, :display_name, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            email = VALUES(email),
            display_name = VALUES(display_name),
            last_login_at = NOW()
    ");
    $stmt->execute([
        'user_id' => $userId,
        'provider' => $identity['provider'],
        'provider_user_id' => $identity['provider_user_id'],
        'email' => $identity['email'],
        'display_name' => $identity['display_name'],
    ]);
}

function socialAuthCreateUser(PDO $pdo, array $identity, ?string $inviteCode = null): array {
    $invitedById = null;
    if ($inviteCode) {
        $stmt = $pdo->prepare('SELECT id FROM nutzer WHERE invite_code = ? LIMIT 1');
        $stmt->execute([$inviteCode]);
        $inviter = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($inviter) {
            $invitedById = (int) $inviter['id'];
        }
    }

    $username = socialAuthCreateUniqueUsername($pdo, (string) ($identity['display_name'] ?? ''), (string) $identity['email']);
    $passwordHash = password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO nutzer (username, email, password_hash, verification_token, invited_by, invite_code, is_verified)
        VALUES (:username, :email, :password_hash, NULL, :invited_by, :invite_code, :is_verified)
    ");
    $stmt->execute([
        'username' => $username,
        'email' => $identity['email'],
        'password_hash' => $passwordHash,
        'invited_by' => $invitedById,
        'invite_code' => socialAuthGenerateInviteCode(),
        'is_verified' => !empty($identity['email_verified']) ? 1 : 0,
    ]);

    $userId = (int) $pdo->lastInsertId();
    ensureUserNotificationSettingsSchema($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO user_notification_settings
            (user_id, notify_checkin_mention, notify_comment, notify_comment_participated, notify_news, notify_team_challenge)
        VALUES (?, 1, 1, 1, 0, 1)
    ");
    $stmt->execute([$userId]);

    return [
        'id' => $userId,
        'username' => $username,
        'email' => $identity['email'],
        'is_verified' => !empty($identity['email_verified']) ? 1 : 0,
    ];
}

function socialAuthResolveUser(PDO $pdo, array $identity, ?string $inviteCode = null): array {
    socialAuthEnsureTable($pdo);

    $pdo->beginTransaction();

    try {
        $user = socialAuthFindIdentity($pdo, $identity['provider'], $identity['provider_user_id']);

        if (!$user) {
            $user = socialAuthFindUserByEmail($pdo, $identity['email']);

            if (!$user) {
                $user = socialAuthCreateUser($pdo, $identity, $inviteCode);
            } elseif (!empty($identity['email_verified']) && (int) ($user['is_verified'] ?? 0) !== 1) {
                $stmt = $pdo->prepare('UPDATE nutzer SET is_verified = 1, verification_token = NULL WHERE id = ?');
                $stmt->execute([(int) $user['id']]);
                $user['is_verified'] = 1;
            }
        }

        socialAuthUpsertIdentity($pdo, (int) $user['id'], $identity);
        $pdo->commit();

        return [
            'id' => (int) $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'is_verified' => (int) ($user['is_verified'] ?? 0),
        ];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function socialAuthIssueAppLogin(PDO $pdo, array $user): array {
    $tokenData = generateAuthToken($pdo, (int) $user['id']);

    setcookie(
        AUTH_COOKIE_NAME,
        $tokenData['token'],
        [
            'expires' => strtotime($tokenData['expires_at']),
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]
    );

    return [
        'status' => 'success',
        'message' => 'Anmeldung erfolgreich.',
        'userId' => (int) $user['id'],
        'username' => $user['username'],
        'token' => $tokenData['token'],
        'expires_at' => $tokenData['expires_at'],
    ];
}
