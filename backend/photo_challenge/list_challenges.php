<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : 0;

if (!$userId) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID fehlt.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

try {
    ensurePhotoChallengeSchema($pdo);
    $challenges = fetchChallenges($pdo);

    echo json_encode([
        'status' => 'success',
        'data' => $challenges,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Challenges konnten nicht geladen werden.',
        'details' => $e->getMessage(),
    ]);
}
