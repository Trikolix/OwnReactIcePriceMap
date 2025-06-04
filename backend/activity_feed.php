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

echo json_encode(getActivityFeed($pdo));
// echo json_encode($feed);

?>