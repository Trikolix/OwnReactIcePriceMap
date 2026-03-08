<?php
require_once __DIR__ . '/db_connect.php';

$nutzerId = isset($_GET['nutzer_id']) ? intval($_GET['nutzer_id']) : null;

$sql = "
SELECT
    c.nutzer_id,
    c.eisdiele_id,
    e.name AS eisdielenname,
    e.adresse,
    e.openingHours,
    c.geschmackbewertung,
    c.waffelbewertung,
    c.preisleistungsbewertung
FROM checkins c
JOIN eisdielen e ON e.id = c.eisdiele_id
WHERE
    c.typ = 'Softeis'
    AND c.geschmackbewertung IS NOT NULL
    AND c.waffelbewertung IS NOT NULL
    AND c.preisleistungsbewertung IS NOT NULL" .
    ($nutzerId ? " AND c.nutzer_id = :nutzerId" : "") . "
ORDER BY c.eisdiele_id;
";

$stmt = $pdo->prepare($sql);
if ($nutzerId) {
    $stmt->bindValue(':nutzerId', $nutzerId, PDO::PARAM_INT);
}
$stmt->execute();
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>