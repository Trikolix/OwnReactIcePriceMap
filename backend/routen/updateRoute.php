<?php
require_once  __DIR__ . '/../db_connect.php';

// Daten aus der Anfrage holen
$data = json_decode(file_get_contents('php://input'), true);
$route_id = $data['id'] ?? null;
$nutzer_id = $data['nutzer_id'] ?? null;
$url = $data['url'] ?? null;
$beschreibung = $data['beschreibung'] ?? null;
$typ = $data['typ'] ?? null;
$ist_oeffentlich = $data['ist_oeffentlich'] ?? null;

if (!$route_id || !$nutzer_id) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Fehlende erforderliche Daten'
    ]);
    exit;
}

// SQL-Abfrage vorbereiten
$sql = "UPDATE routen SET url = :url, beschreibung = :beschreibung, typ = :typ, ist_oeffentlich = :ist_oeffentlich WHERE id = :id AND nutzer_id = :nutzer_id";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    'url' => $url,
    'beschreibung' => $beschreibung,
    'typ' => $typ,
    'ist_oeffentlich' => $ist_oeffentlich,
    'id' => $route_id,
    'nutzer_id' => $nutzer_id
]);

echo json_encode([
    'status' => 'success',
    'message' => 'Route erfolgreich aktualisiert'
]);
?>