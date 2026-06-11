<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/likes.php';

header('Content-Type: application/json');

try {
    $authUser = requireAuth($pdo);

    $entityType = $_GET['entity_type'] ?? '';
    $entityId = (int)($_GET['entity_id'] ?? 0);

    if (!in_array($entityType, ['checkin', 'bewertung', 'route', 'kommentar']) || $entityId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid parameters']);
        exit();
    }

    ensureLikesSchema($pdo);

    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.profilbild
        FROM likes l
        JOIN nutzer u ON l.user_id = u.id
        WHERE l.entity_type = ? AND l.entity_id = ?
        ORDER BY l.created_at DESC
    ");
    $stmt->execute([$entityType, $entityId]);
    $likers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['likers' => $likers]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
