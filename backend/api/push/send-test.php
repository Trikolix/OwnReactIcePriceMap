<?php
require_once __DIR__ . '/../../db_connect.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/notification_dispatcher.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

try {
    // Authentifizierung sicherstellen
    $auth = requireAuth($pdo);
    $currentUserId = (int)$auth['user_id'];
    if ($currentUserId <= 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Nicht angemeldet.']);
        exit;
    }

    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $targetUserId = $currentUserId;
    // Nur Admin darf Test-Pushes an fremde Nutzer-IDs senden
    if (isset($body['user_id']) && (int)$body['user_id'] > 0 && (int)$body['user_id'] !== $currentUserId) {
        if ($currentUserId !== 1) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Nur Admins dürfen Tests an andere Nutzer senden.']);
            exit;
        }
        $targetUserId = (int)$body['user_id'];
    }
    
    // Eine Test-Benachrichtigung erstellen und versenden
    createNotification(
        $pdo,
        $targetUserId,
        'systemmeldung',
        time(),
        'Dies ist eine Test-Benachrichtigung von deiner Ice App!',
        ['is_test' => true, 'sent_at' => date('Y-m-d H:i:s')]
    );

    echo json_encode(['success' => true, 'message' => 'Test-Benachrichtigung wurde versendet.']);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Error in send-test.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Ein interner Fehler ist aufgetreten: ' . $e->getMessage()]);
}
