<?php
require_once 'db_connect.php';

try {
    $stmt = $pdo->query("SELECT * FROM attribute");
    $attribute = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($attribute);
} catch (PDOException $e) {
    echo json_encode(["error" => "Datenbankabfrage fehlgeschlagen: " . $e->getMessage()]);
}
?>
