<?php
require_once  __DIR__ . '/../db_connect.php';

// SQL-Statement: löscht nicht abgeschlossene Challenges, die mehr als 1 Tag abgelaufen sind
$sql = "
    DELETE FROM challenges
    WHERE completed = 0
      AND valid_until < (NOW() - INTERVAL 1 DAY)
";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    echo "Abgelaufene Challenges gelöscht: " . $stmt->rowCount() . PHP_EOL;
} catch (PDOException $e) {
    error_log("Fehler beim Löschen: " . $e->getMessage());
}

?>