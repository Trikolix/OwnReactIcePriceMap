<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

$authData = requireAuth($pdo);
if ((int) ($authData['user_id'] ?? 0) !== 1) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Nur Admin erlaubt.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
