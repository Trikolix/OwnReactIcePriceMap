<?php
require_once '../db_connect.php';
header('Content-Type: application/json');

$code = $_POST['code'] ?? '';
$category = $_POST['category'] ?? '';

if ($code !== '') {
    $stmt = $pdo->prepare("INSERT INTO awards (code, category) VALUES (?, ?)");
    $stmt->execute([$code, $category]);
}

echo json_encode(['success' => true]);

?>