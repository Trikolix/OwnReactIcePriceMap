<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/checkin.php';

function getActivityFeed(PDO $pdo): array {
    $activities = [];

    // 🟢 CHECKINS holen
    $stmtCheckins = $pdo->prepare("
        SELECT id, datum AS erstellt_am
        FROM checkins
        ORDER BY erstellt_am DESC
        LIMIT 30
    ");
    $stmtCheckins->execute();
    $checkinIds = $stmtCheckins->fetchAll(PDO::FETCH_COLUMN);

    foreach ($checkinIds as $id) {
        $checkin = getCheckinById($pdo, $id);
        if ($checkin) {
            $activities[] = [
                'typ' => 'checkin',
                'id' => $checkin['id'],
                'data' => $checkin
            ];
        }
    }

    // 🟡 BEWERTUNGEN holen
    $stmtReviews = $pdo->prepare("
        SELECT b.*,
               e.name AS eisdiele_name,
               n.username AS nutzer_name,
               n.id AS nutzer_id
        FROM bewertungen b
        JOIN eisdielen e ON b.eisdiele_id = e.id
        JOIN nutzer n ON b.nutzer_id = n.id
        ORDER BY b.erstellt_am DESC
        LIMIT 10
    ");
    $stmtReviews->execute();
    $reviews = $stmtReviews->fetchAll(PDO::FETCH_ASSOC);

    foreach ($reviews as &$review) {
        $stmtAttr = $pdo->prepare("
            SELECT a.name 
            FROM bewertung_attribute ba 
            JOIN attribute a ON ba.attribut_id = a.id 
            WHERE ba.bewertung_id = :bewertungId
        ");
        $stmtAttr->execute(['bewertungId' => $review['id']]);
        $review['bewertung_attribute'] = $stmtAttr->fetchAll(PDO::FETCH_COLUMN);

        $activities[] = [
            'typ' => 'bewertung',
            'id' => $review['id'],
            'data' => $review
        ];
    }

    // 🔵 ROUTEN holen
    $stmtRouten = $pdo->prepare("
        SELECT r.*, n.username AS nutzer_name
        FROM routen r
        JOIN nutzer n ON r.nutzer_id = n.id
        WHERE r.ist_oeffentlich = TRUE
        ORDER BY r.erstellt_am DESC
        LIMIT 10
    ");
    $stmtRouten->execute();
    $routen = $stmtRouten->fetchAll(PDO::FETCH_ASSOC);

    foreach ($routen as $route) {
        $activities[] = [
            'typ' => 'route',
            'id' => $route['id'],
            'data' => $route
        ];
    }

    // 🔷 OPTIONAL: Eisdielen-Einträge hinzufügen (falls sinnvoll)
    
    $stmtEisdielen = $pdo->prepare("
        SELECT e.*, n.username AS nutzer_name
        FROM eisdielen e
        JOIN nutzer n ON e.user_id = n.id
        ORDER BY e.erstellt_am DESC
        LIMIT 10
    ");
    $stmtEisdielen->execute();
    $eisdielen = $stmtEisdielen->fetchAll(PDO::FETCH_ASSOC);

    foreach ($eisdielen as $shop) {
        $activities[] = [
            'typ' => 'eisdiele',
            'id' => $shop['id'],
            'data' => $shop
        ];
    }

    // 🔄 Aktivitäten nach Datum sortieren (optional)
    usort($activities, function ($a, $b) {
      $dateA = $a['data']['erstellt_am'] ?? $a['data']['datum'] ?? null;
      $dateB = $b['data']['erstellt_am'] ?? $b['data']['datum'] ?? null;
      return strtotime($dateB) <=> strtotime($dateA);
    });

    return $activities;
}


$sql = "
(
  SELECT 
    'bewertung' AS typ,
    b.id,
    b.erstellt_am AS datum,
    CAST(b.beschreibung AS CHAR) AS beschreibung,
    CAST(n.username AS CHAR) AS nutzer_name,
    CAST(e.name AS CHAR) AS eisdiele_name,
    NULL AS extra1,
    NULL AS extra2
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
    CAST(c.kommentar AS CHAR) AS beschreibung,
    CAST(n.username AS CHAR) AS nutzer_name,
    CAST(e.name AS CHAR) AS eisdiele_name,
    NULL AS extra1,
    NULL AS extra2
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
    CAST(r.beschreibung AS CHAR) AS beschreibung,
    CAST(n.username AS CHAR) AS nutzer_name,
    CAST(e.name AS CHAR) AS eisdiele_name,
    CAST(r.url AS CHAR) AS extra1,
    CAST(r.typ AS CHAR) AS extra2
  FROM routen r
  JOIN nutzer n ON r.nutzer_id = n.id
  JOIN eisdielen e ON r.eisdiele_id = e.id
)

UNION ALL

(
  SELECT 
    'eisdiele' AS typ,
    e.id,
    e.erstellt_am AS datum,
    CAST(e.name AS CHAR) AS beschreibung,
    CAST(n.username AS CHAR) AS nutzer_name,
    CAST(e.adresse AS CHAR) AS eisdiele_name,
    CAST(l.name AS CHAR) AS extra1,
    CONCAT(CAST(b.name AS CHAR), ', ', CAST(lk.name AS CHAR)) AS extra2
  FROM eisdielen e
  JOIN nutzer n ON e.user_id = n.id
  JOIN laender l ON e.land_id = l.id
  JOIN bundeslaender b ON e.bundesland_id = b.id
  JOIN landkreise lk ON e.landkreis_id = lk.id
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
        $item['eissorten'] = getSortenForCheckin($pdo, $item['id']);
        $item['bilder'] = getBilderForCheckin($pdo, $item['id']);
    }
}
unset($item);

echo json_encode(getActivityFeed($pdo));
// echo json_encode($feed);

?>