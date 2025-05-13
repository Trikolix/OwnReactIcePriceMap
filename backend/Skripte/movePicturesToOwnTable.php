<?php
// DB-Verbindung herstellen
require_once  __DIR__ . '/../db_connect.php';

// Hole alle Checkins mit Bild
$sql = "SELECT id, bild_url FROM checkins WHERE bild_url IS NOT NULL AND bild_url != ''";
$stmt = $pdo->query($sql);
$checkins = $stmt->fetchAll(PDO::FETCH_ASSOC);

$insertStmt = $pdo->prepare("
    INSERT INTO bilder (url, checkin_id, shop_id, beschreibung)
    VALUES (:url, :checkin_id, NULL, NULL)
");

$count = 0;
foreach ($checkins as $checkin) {
    $bildUrl = trim($checkin['bild_url']);

    if (!empty($bildUrl)) {
        $insertStmt->execute([
            ':url' => $bildUrl,
            ':checkin_id' => $checkin['id']
        ]);
        $count++;
    }
}

echo "$count Bilder wurden erfolgreich übernommen.";
?>