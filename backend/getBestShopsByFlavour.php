<?php
require_once __DIR__ . '/db_connect.php';

$sortenname = $_GET['sortenname'];
$typ = $_GET['iceType'];

$stmt = $pdo->prepare("
SELECT 
  eisdielen.name AS eisdiele_name,
  eisdielen.id AS eisdiele_id,
  checkin_sorten.sortenname,
  AVG(checkin_sorten.bewertung) AS durchschnittsbewertung
FROM checkin_sorten
JOIN checkins ON checkin_sorten.checkin_id = checkins.id
JOIN eisdielen ON checkins.eisdiele_id = eisdielen.id
WHERE checkin_sorten.sortenname = :sortenname AND checkins.typ = :typ
GROUP BY eisdielen.id, checkin_sorten.sortenname
ORDER BY durchschnittsbewertung DESC
LIMIT 10
");

$stmt->execute([
  ':sortenname' => $sortenname,
  ':typ' => $typ,
]);

$shops = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($shops);

?>