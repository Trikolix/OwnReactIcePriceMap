<?php
require_once 'db_connect.php';

$sql = "SELECT * FROM eisdielen";
$result = $conn->query($sql);

$eisdielen = [];
while ($row = $result->fetch_assoc()) {
    $eisdielen[] = $row;
}

echo json_encode($eisdielen);
?>
