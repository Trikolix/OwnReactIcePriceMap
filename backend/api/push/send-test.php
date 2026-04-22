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
    $userId = (int)$auth['user_id'];

    // Sicherstellen, dass nur der Admin (user_id = 1) dies tun kann
    if ($userId !== 1) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Nur Admins duerfen diese Funktion nutzen.']);
        exit;
    }
    
    // Eine Test-Benachrichtigung erstellen und versenden
    createNotification(
        $pdo,
        1, // Empfänger ist immer der Admin mit ID 1
        'systemmeldung', // Wir können den vorhandenen Typ "systemmeldung" nutzen
        time(), // Eindeutige Referenz-ID
        'Dies ist eine Test-Benachrichtigung von deiner Ice App!',
        ['is_test' => true]
    );

    echo json_encode(['success' => true, 'message' => 'Test-Benachrichtigung wurde versendet.']);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Error in send-test.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Ein interner Fehler ist aufgetreten.']);
}
