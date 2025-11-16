<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

$authData = requireAuth($pdo);

$response = [
    'status'      => 'success',
    'userId'      => (int)$authData['user_id'],
    'username'    => $authData['username'],
    'expires_at'  => $authData['expires_at'],
];

echo json_encode($response);
