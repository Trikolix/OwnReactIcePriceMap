<?php
require_once  __DIR__ . '/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $shopId = isset($_GET['shopId']) ? intval($_GET['shopId']) : null;

    if (!$shopId) {
        echo json_encode(['error' => 'shop ID is required']);
        exit;
    }

    $shopDetails = [];

    $sqlEisdiele = "SELECT *
            FROM eisdielen e
            WHERE e.id = :shopId";

    $sqlReviews = "SELECT b.*, n.username
    FROM bewertungen b
    JOIN nutzer n ON b.nutzer_id = n.id
    WHERE b.eisdiele_id = :shopId";

}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);

?>