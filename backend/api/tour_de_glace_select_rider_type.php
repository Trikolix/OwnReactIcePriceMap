<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/tour_de_glace.php';

header('Content-Type: application/json');

try {
    $auth = requireAuth($pdo);
    $payload = json_decode(file_get_contents('php://input'), true);
    $riderType = (string)($payload['rider_type'] ?? '');
    $profile = selectTourDeGlaceRiderType($pdo, (int)$auth['user_id'], $riderType);
    echo json_encode([
        'status' => 'success',
        'profile' => [
            'rider_type' => $profile['rider_type'],
            'selected_at' => $profile['selected_at'] ?? null,
        ],
        ...buildTourDeGlaceProgress($pdo, (int)$auth['user_id']),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fahrertyp konnte nicht gespeichert werden.',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
?>
