<?php
require_once 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['name']) || !isset($data['adresse']) || !isset($data['latitude']) || !isset($data['longitude']) || !isset($data['openingHours']) || !isset($data['komoot']) || !isset($data['userId'])) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter"]);
    exit;
}

$sql = "INSERT INTO eisdielen (name, adresse, latitude, longitude, openingHours, komoot, user_id) VALUES (:name, :adresse, :latitude, :longitude, :openingHours, :komoot, :userId)";
$stmt = $pdo->prepare($sql);

try {
    $stmt->execute([
        ':name' => $data['name'],
        ':adresse' => $data['adresse'],
        ':latitude' => floatval($data['latitude']),
        ':longitude' => floatval($data['longitude']),
        ':openingHours' => $data['openingHours'],
        ':komoot' => $data['komoot'],
        ':userId' => intval($data['userId'])
    ]);
    echo json_encode(["status" => "success"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>