<?php
require 'firebase-init.php';

header('Content-Type: application/json');

$body = json_decode(file_get_contents('php://input'), true);
$idToken = $body['idToken'] ?? '';

try {
    $verifiedIdToken = $auth->verifyIdToken($idToken);
    $uid = $verifiedIdToken->claims()->get('sub');
    echo json_encode(['status' => 'success', 'uid' => $uid]);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token: ' . $e->getMessage()]);
}
