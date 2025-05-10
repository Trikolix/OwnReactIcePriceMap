<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

    if (!$userId) {
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }

    $query = "SELECT c.id, c.eisdiele_id, e.name AS eisdiele_name, c.date
              FROM checkins c
              JOIN eisdielen e ON c.eisdiele_id = e.id
              WHERE c.user_id = ?
              ORDER BY c.date DESC";

    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $checkins = [];
    while ($row = $result->fetch_assoc()) {
        $checkins[] = $row;
    }

    echo json_encode($checkins);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>