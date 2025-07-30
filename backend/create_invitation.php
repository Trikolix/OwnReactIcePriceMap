<?php
require_once  __DIR__ . '/db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['userId'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'userId fehlt']);
    exit;
}

$inviterId = intval($data['userId']);

// Einladungscode generieren (z. B. eindeutige zufällige ID)
$code = bin2hex(random_bytes(8)); // z. B. 16 Zeichen

try {
    $stmt = $pdo->prepare("INSERT INTO invitations (id, inviter_id) VALUES (?, ?)");
    $stmt->execute([$code, $inviterId]);

    $inviteLink = "https://ice-app.de/#/register/$code";

    echo json_encode([
        'status' => 'success',
        'inviteLink' => $inviteLink
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Could not create invitation']);
}

?>