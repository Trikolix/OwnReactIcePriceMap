<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace_femme.php';
header('Content-Type: application/json');
try {
    $auth = authenticateRequest($pdo);
    echo json_encode(['status' => 'success', 'authenticated' => $auth !== null, ...buildTourDeGlaceFemmeProgress($pdo, $auth ? (int)$auth['user_id'] : null)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Tour de Glace Femmes konnte nicht geladen werden.', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
