<?php
require_once  __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/route_utils.php';

$authData = requireAuth($pdo);

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $url = $data['url'] ?? '';

    if (empty($url)) {
        echo json_encode(['status' => 'error', 'message' => 'Keine URL angegeben']);
        die();
    }

    $visibility = checkRouteVisibility($url);

    echo json_encode([
        'status' => 'success',
        'visibility' => $visibility['status']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fehler bei der Prüfung',
        'details' => $e->getMessage()
    ]);
}
?>
