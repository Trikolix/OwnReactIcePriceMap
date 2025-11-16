<?php

const AUTH_TOKEN_TTL_DAYS = 30;
const AUTH_COOKIE_NAME = 'ice_auth_token';

function hashAuthToken(string $token): string {
    return hash('sha256', $token);
}

function getClientUserAgent(): ?string {
    return $_SERVER['HTTP_USER_AGENT'] ?? null;
}

function getClientIpAddress(): ?string {
    $headers = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'REMOTE_ADDR',
    ];

    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $value = $_SERVER[$header];
            if ($header === 'HTTP_X_FORWARDED_FOR') {
                $parts = explode(',', $value);
                return trim($parts[0]);
            }
            return $value;
        }
    }

    return null;
}

function generateAuthToken(PDO $pdo, int $userId): array {
    $rawToken = bin2hex(random_bytes(32));
    $tokenHash = hashAuthToken($rawToken);
    $expiresAt = (new DateTime())->modify('+' . AUTH_TOKEN_TTL_DAYS . ' days')->format('Y-m-d H:i:s');

    $stmt = $pdo->prepare("
        INSERT INTO user_api_tokens (user_id, token_hash, user_agent, ip_address, created_at, last_used_at, expires_at)
        VALUES (:user_id, :token_hash, :user_agent, :ip_address, NOW(), NOW(), :expires_at)
    ");
    $stmt->execute([
        'user_id'    => $userId,
        'token_hash' => $tokenHash,
        'user_agent' => getClientUserAgent(),
        'ip_address' => getClientIpAddress(),
        'expires_at' => $expiresAt,
    ]);

    return [
        'token'      => $rawToken,
        'expires_at' => $expiresAt,
    ];
}

function getAuthTokenFromRequest(): ?string {
    $headerToken = null;

    $serverHeaders = [
        $_SERVER['HTTP_AUTHORIZATION'] ?? null,
        $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
    ];

    foreach ($serverHeaders as $serverHeader) {
        if (!empty($serverHeader)) {
            $headerToken = $serverHeader;
            break;
        }
    }

    if (!$headerToken && function_exists('getallheaders')) {
        foreach (getallheaders() as $key => $value) {
            if (strcasecmp($key, 'Authorization') === 0) {
                $headerToken = $value;
                break;
            }
        }
    }

    if (!$headerToken && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $value) {
            if (strcasecmp($key, 'Authorization') === 0) {
                $headerToken = $value;
                break;
            }
        }
    }

    if ($headerToken) {
        if (preg_match('/Bearer\s+(.+)/i', $headerToken, $matches)) {
            return trim($matches[1]);
        }
    }

    if (!empty($_COOKIE[AUTH_COOKIE_NAME])) {
        return $_COOKIE[AUTH_COOKIE_NAME];
    }

    return null;
}

function fetchTokenRecord(PDO $pdo, string $tokenHash): ?array {
    $stmt = $pdo->prepare("
        SELECT
            t.id AS token_id,
            t.user_id,
            t.last_used_at,
            t.expires_at,
            t.revoked_at,
            n.username
        FROM user_api_tokens t
        JOIN nutzer n ON n.id = t.user_id
        WHERE t.token_hash = :token_hash
        LIMIT 1
    ");
    $stmt->execute(['token_hash' => $tokenHash]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    return $record ?: null;
}

function updateTokenUsage(PDO $pdo, int $tokenId): string {
    $newExpiry = (new DateTime())->modify('+' . AUTH_TOKEN_TTL_DAYS . ' days')->format('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
        UPDATE user_api_tokens
        SET last_used_at = NOW(), expires_at = :expires_at
        WHERE id = :id
    ");
    $stmt->execute([
        'expires_at' => $newExpiry,
        'id'         => $tokenId,
    ]);

    return $newExpiry;
}

function unauthorizedResponse(string $message = 'Unauthorized'): void {
    http_response_code(401);
    echo json_encode([
        'status'  => 'error',
        'message' => $message,
    ]);
    exit;
}

function authenticateRequest(PDO $pdo): ?array {
    $rawToken = getAuthTokenFromRequest();
    if (!$rawToken) {
        return null;
    }

    $tokenRecord = fetchTokenRecord($pdo, hashAuthToken($rawToken));
    if (!$tokenRecord) {
        return null;
    }

    if (!empty($tokenRecord['revoked_at'])) {
        return null;
    }

    if (new DateTime($tokenRecord['expires_at']) < new DateTime()) {
        return null;
    }

    $tokenRecord['expires_at'] = updateTokenUsage($pdo, (int)$tokenRecord['token_id']);

    return array_merge($tokenRecord, [
        'raw_token' => $rawToken,
    ]);
}

function requireAuth(PDO $pdo): array {
    $record = authenticateRequest($pdo);

    if (!$record) {
        unauthorizedResponse();
    }

    return $record;
}

function revokeToken(PDO $pdo, string $rawToken): void {
    if (!$rawToken) {
        return;
    }

    $stmt = $pdo->prepare("
        UPDATE user_api_tokens
        SET revoked_at = NOW()
        WHERE token_hash = :token_hash
    ");
    $stmt->execute(['token_hash' => hashAuthToken($rawToken)]);
}

function revokeAllTokensForUser(PDO $pdo, int $userId): void {
    $stmt = $pdo->prepare("
        UPDATE user_api_tokens
        SET revoked_at = NOW()
        WHERE user_id = :user_id AND revoked_at IS NULL
    ");
    $stmt->execute(['user_id' => $userId]);
}
