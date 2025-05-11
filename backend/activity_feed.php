<?php
require_once  __DIR__ . '/db_connect.php';

$page = $_GET['page'] ?? 1;
$limit = 20;
$offset = ($page - 1) * $limit;

$sql = "
  (
  SELECT 
    'bewertung' AS typ,
    b.id,
    b.erstellt_am AS datum,
    CAST(b.beschreibung AS CHAR) COLLATE utf8mb4_general_ci AS beschreibung,
    CAST(n.username AS CHAR) COLLATE utf8mb4_general_ci AS nutzer_name,
    CAST(e.name AS CHAR) COLLATE utf8mb4_general_ci AS eisdiele_name,
    NULL AS extra_data
  FROM bewertungen b
  JOIN nutzer n ON b.nutzer_id = n.id
  JOIN eisdielen e ON b.eisdiele_id = e.id
)

UNION ALL

(
  SELECT 
    'checkin' AS typ,
    c.id,
    c.datum AS datum,
    CAST(c.kommentar AS CHAR) COLLATE utf8mb4_general_ci AS beschreibung,
    CAST(n.username AS CHAR) COLLATE utf8mb4_general_ci AS nutzer_name,
    CAST(e.name AS CHAR) COLLATE utf8mb4_general_ci AS eisdiele_name,
    CAST(c.bild_url AS CHAR) COLLATE utf8mb4_general_ci AS extra_data
  FROM checkins c
  JOIN nutzer n ON c.nutzer_id = n.id
  JOIN eisdielen e ON c.eisdiele_id = e.id
)

UNION ALL

(
  SELECT 
    'route' AS typ,
    r.id,
    r.erstellt_am AS datum,
    CAST(r.beschreibung AS CHAR) COLLATE utf8mb4_general_ci AS beschreibung,
    CAST(n.username AS CHAR) COLLATE utf8mb4_general_ci AS nutzer_name,
    CAST(e.name AS CHAR) COLLATE utf8mb4_general_ci AS eisdiele_name,
    CAST(r.url AS CHAR) COLLATE utf8mb4_general_ci AS extra_data
  FROM routen r
  JOIN nutzer n ON r.nutzer_id = n.id
  JOIN eisdielen e ON r.eisdiele_id = e.id
)

ORDER BY datum DESC
LIMIT :limit OFFSET :offset;
";

$stmt = $pdo->prepare($sql);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$feed = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($feed as &$item) {
    if ($item['typ'] === 'bewertung') {
        $stmt = $pdo->prepare("
            SELECT a.name
            FROM bewertung_attribute ba
            JOIN attribute a ON ba.attribut_id = a.id
            WHERE ba.bewertung_id = :id
        ");
        $stmt->execute(['id' => $item['id']]);
        $item['attribute'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } elseif ($item['typ'] === 'checkin') {
        $stmt = $pdo->prepare("
            SELECT sortenname, bewertung
            FROM checkin_sorten
            WHERE checkin_id = :id
        ");
        $stmt->execute(['id' => $item['id']]);
        $item['sorten'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
unset($item);

echo json_encode($feed);

?>