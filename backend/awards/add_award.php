<?php
require_once '../db_connect.php';

$code = $_POST['code'] ?? '';
$category = $_POST['category'] ?? '';

if ($code !== '') {
    $stmt = $pdo->prepare("INSERT INTO awards (code, category) VALUES (?, ?)");
    $stmt->execute([$code, $category]);
}

header('Location: index.html');
exit;

?>