<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

try {
    ensurePhotoChallengeSchema($pdo);
    $challenges = array_values(array_filter(
        fetchChallenges($pdo),
        fn($challenge) => ($challenge['status'] ?? '') !== 'draft'
    ));

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
