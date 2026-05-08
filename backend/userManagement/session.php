<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

$authData = requireAuth($pdo);
$stmt = $pdo->prepare("SELECT current_level FROM nutzer WHERE id = ? LIMIT 1");
$stmt->execute([(int)$authData['user_id']]);
$currentLevel = (int)($stmt->fetchColumn() ?: 0);

$response = [
    'status'      => 'success',
    'userId'      => (int)$authData['user_id'],
    'username'    => $authData['username'],
    'currentLevel'=> $currentLevel,
    'expires_at'  => $authData['expires_at'],
];

echo json_encode($response);
