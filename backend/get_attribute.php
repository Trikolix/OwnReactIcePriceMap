<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
require_once 'db_connect.php';

$sql = "SELECT * FROM attribute";
$result = $conn->query($sql);

$attribute = [];
while ($row = $result->fetch_assoc()) {
    $attribute[] = $row;
}

echo json_encode($attribute);
?>
