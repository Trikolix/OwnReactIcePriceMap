<?php
require_once '../db_connect.php';
require_once '../lib/auth.php';
require_once '../lib/user_profile.php';
header('Content-Type: application/json');

$authData = requireAuth($pdo);
$userId = (int)$authData['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    return;
}

try {
    ensureUserProfileColumns($pdo);

    $stmt = $pdo->prepare("SELECT instagram_account, strava_account FROM nutzer WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode($row);
    } else {
        echo json_encode(['instagram_account' => null, 'strava_account' => null]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
