<?php
require_once  __DIR__ . '/../db_connect.php';

// SQL-Abfrage
$sql = "SELECT cs.sortenname, c.typ, COUNT(*) AS anzahl
        FROM checkin_sorten cs
        JOIN checkins c ON cs.checkin_id = c.id
        GROUP BY cs.sortenname, c.typ
        ORDER BY c.typ, anzahl DESC;";

$stmt = $pdo->prepare($sql);
$stmt->execute();

$sorten = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $typ = $row['typ'] ?? 'Kugel'; // Fallback falls keine Typ-Spalte
    $name = trim($row['sortenname']);

    if (!isset($sorten[$typ])) {
        $sorten[$typ] = [];
    }

    // Dubletten vermeiden (Vanille ≈ vanille)
    $alreadyExists = array_filter($sorten[$typ], fn($s) => mb_strtolower($s) === mb_strtolower($name));
    if (count($alreadyExists) === 0) {
        $sorten[$typ][] = $name;
    }
}

echo json_encode($sorten, JSON_UNESCAPED_UNICODE);


?>