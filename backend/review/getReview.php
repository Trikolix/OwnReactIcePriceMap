<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/review.php';

$userId = $_GET['userId'] ?? null;
$shopId = $_GET['shopId'] ?? null;

if (!$userId || !$shopId) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter"]);
    exit;
}

$review = getReviewByUserAndShop($pdo, (int)$userId, (int)$shopId);
$allAttributes = getAllAttributes($pdo);

echo json_encode([
    'review' => $review,
    'attributes' => $review['attribute'] ?? null,
    'bilder' => $review['bilder'] ?? [],
    'allAttributes' => $allAttributes
]);
?>