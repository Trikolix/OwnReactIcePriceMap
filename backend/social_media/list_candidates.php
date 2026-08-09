<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$auth = requireSocialMediaAdmin($pdo);

try {
    $result = socialMediaFetchCandidates($pdo, [
        'search' => $_GET['search'] ?? '',
        'type' => $_GET['type'] ?? '',
        'from' => $_GET['from'] ?? '',
        'to' => $_GET['to'] ?? '',
        'page' => $_GET['page'] ?? 1,
        'limit' => $_GET['limit'] ?? 24,
    ]);

    echo json_encode([
        'status' => 'success',
        'data' => $result['items'],
        'pagination' => [
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
            'pages' => $result['pages'],
        ],
        'viewer_id' => (int)$auth['user_id'],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Foto-Kandidaten konnten nicht geladen werden.',
    ], JSON_UNESCAPED_UNICODE);
}
