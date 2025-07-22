<?php
require_once __DIR__ . '/../db_connect.php';

$stmt = $pdo->query("
    SELECT *
    FROM wochenstatistiken
    ORDER BY start_datum ASC
");

$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: application/json');
echo json_encode($data);
?>