<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';

header('Content-Type: application/json');

try {
    $auth = authenticateRequest($pdo);
    $userId = $auth ? (int)$auth['user_id'] : null;
    echo json_encode([
        'status' => 'success',
        'authenticated' => $userId !== null,
        ...buildTourDeGlaceProgress($pdo, $userId),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Tour de Glace konnte nicht geladen werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
?>
