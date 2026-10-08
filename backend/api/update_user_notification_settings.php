<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/notification_dispatcher.php';
header('Content-Type: application/json; charset=utf-8');
$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Methode nicht erlaubt.']);
    exit;
}
$data = json_decode(file_get_contents('php://input'), true) ?: [];
if (isset($data['user_id']) && (int)$data['user_id'] !== $userId) {
    http_response_code(403);
    echo json_encode(['error' => 'Zugriff verweigert']);
    exit;
}
ensurePushInfrastructureSchema($pdo);
saveUserNotificationSettings($pdo, $userId, $data);
echo json_encode(['success' => true]);
