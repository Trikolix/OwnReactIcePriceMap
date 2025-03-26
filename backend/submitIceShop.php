<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
$host = "localhost";
$dbname = "db_439770_2";
$username = "USER439770_wed";
$password = "K8RYTP23y8kWSdt";

// Verbindung zur Datenbank
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Datenbankverbindung fehlgeschlagen"]);
    exit();
}

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