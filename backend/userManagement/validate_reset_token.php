<?php
require_once  __DIR__ . '/../db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';

if (!$token) {
    echo json_encode(['valid' => false, 'message' => 'Kein Token übergeben.']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM passwort_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()");
$stmt->execute([$token]);
$entry = $stmt->fetch();

if ($entry) {
    echo json_encode(['valid' => true]);
} else {
    echo json_encode(['valid' => false, 'message' => 'Token ungültig oder abgelaufen.']);
}
?>