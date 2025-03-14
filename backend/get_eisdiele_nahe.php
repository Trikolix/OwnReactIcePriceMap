<?php
require_once 'db_connect.php';

$latitude = $_GET['latitude'];
$longitude = $_GET['longitude'];
$radius = $_GET['radius']; // Radius in km

$sql = "SELECT *, 
    (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))) AS entfernung 
    FROM eisdielen 
    HAVING entfernung < ? 
    ORDER BY entfernung";

$stmt = $conn->prepare($sql);
$stmt->bind_param("dddi", $latitude, $longitude, $latitude, $radius);
$stmt->execute();
$result = $stmt->get_result();

$eisdielen = [];
while ($row = $result->fetch_assoc()) {
    $eisdielen[] = $row;
}

echo json_encode($eisdielen);
?>
