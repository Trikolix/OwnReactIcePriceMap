<?php
require_once '../db_connect.php';
require_once '../../backend_dev/db_connect.php'; // Entwicklungsdatenbank
header('Content-Type: application/json');

$code = $_POST['code'] ?? '';
$category = $_POST['category'] ?? '';

if ($code !== '') {
    // Produktiv
    $stmt = $pdo->prepare("INSERT INTO awards (code, category) VALUES (?, ?)");
    $stmt->execute([$code, $category]);
    // Entwicklung
    $stmt_dev = $pdo_dev->prepare("INSERT INTO awards (code, category) VALUES (?, ?)");
    $stmt_dev->execute([$code, $category]);
}

echo json_encode(['success' => true]);

?>