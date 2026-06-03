<?php
require_once  __DIR__ . '/../db_connect.php';
require_once  __DIR__ . '/../lib/route_helpers.php';
require_once  __DIR__ . '/../lib/user_profile.php';

ensureUserProfileTable($pdo);

// Eisdiele-ID aus der Anfrage holen
$eisdiele_id = isset($_GET['eisdiele_id']) ? (int)$_GET['eisdiele_id'] : null;
$nutzer_id = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : null; // Optional: ID des eingeloggten Nutzers

if (!$eisdiele_id) {
    echo json_encode(['error' => 'Eisdiele-ID ist erforderlich']);
    exit;
}

// SQL-Abfrage vorbereiten
$sql = "SELECT r.*,
               n.username,
               n.current_level,
               up.avatar_path AS avatar_url,
               up.show_level_badge,
               up.avatar_frame_key
        FROM routen r
        JOIN route_eisdielen rel ON rel.route_id = r.id
        JOIN nutzer n ON r.nutzer_id = n.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE rel.eisdiele_id = :eisdiele_id
          AND (r.ist_oeffentlich = TRUE OR r.nutzer_id = :nutzer_id)";
$stmt = $pdo->prepare($sql);
$stmt->execute(['eisdiele_id' => $eisdiele_id, 'nutzer_id' => $nutzer_id]);

$routen = $stmt->fetchAll(PDO::FETCH_ASSOC);
$routeIds = array_column($routen, 'id');
$shopMap = getRouteIceShops($pdo, $routeIds);

foreach ($routen as &$route) {
    $rid = (int)$route['id'];
    $route['eisdielen'] = $shopMap[$rid] ?? [];
    if (!empty($route['eisdielen'])) {
        $route['eisdiele_id'] = $route['eisdielen'][0]['id'];
        $route['eisdiele_name'] = $route['eisdielen'][0]['name'];
    }
    $route['commentCount'] = getCommentCountForRoute($pdo, $rid);
}

echo json_encode($routen);
?>
