<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/tour_de_glace_femme.php';
header('Content-Type: application/json; charset=UTF-8');
try {
    $auth = requireAuth($pdo);
    if ((int)$auth['user_id'] !== 1) throw new RuntimeException('Kein Zugriff.');
    echo json_encode(buildTourDeGlaceFemmeAdminState($pdo), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (RuntimeException $e) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Admin-Daten konnten nicht geladen werden.', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
