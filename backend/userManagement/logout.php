<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

$rawToken = getAuthTokenFromRequest();
if ($rawToken) {
    revokeToken($pdo, $rawToken);
    setcookie(
        AUTH_COOKIE_NAME,
        '',
        [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]
    );
}

echo json_encode([
    'status'  => 'success',
    'message' => 'Abgemeldet',
]);
