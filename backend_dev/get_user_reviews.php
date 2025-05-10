<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

    if (!$userId) {
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }

    $query = "SELECT r.id, r.eisdiele_id, e.name AS eisdiele_name, r.text, r.rating
              FROM bewertungen r
              JOIN eisdielen e ON r.eisdiele_id = e.id
              WHERE r.user_id = ?
              ORDER BY r.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $reviews = [];
    while ($row = $result->fetch_assoc()) {
        $reviews[] = $row;
    }

    echo json_encode($reviews);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>