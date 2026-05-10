<?php
require_once __DIR__ . '/auth_awards_admin.php';
require_once __DIR__ . '/dev_db.php';
require_once __DIR__ . '/awards_cache.php';
header('Content-Type: application/json');

$pdo_dev = getAwardsDevPdo();

$code = $_POST['code'] ?? '';
$category = $_POST['category'] ?? '';

if ($code !== '') {
    // Produktiv
    $stmt = $pdo->prepare("INSERT INTO awards (code, category) VALUES (?, ?)");
    $stmt->execute([$code, $category]);
    // Entwicklung
    $stmt_dev = $pdo_dev->prepare("INSERT INTO awards (code, category) VALUES (?, ?)");
    $stmt_dev->execute([$code, $category]);

    invalidateAwardsCache();
}

echo json_encode(['success' => true]);

?>
