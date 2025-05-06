<?php
require_once  __DIR__ . '/../db_connect.php';

// Daten aus der Anfrage holen
$data = json_decode(file_get_contents('php://input'), true);
$eisdiele_id = $data['eisdiele_id'] ?? null;
$nutzer_id = $data['nutzer_id'] ?? null;
$url = $data['url'] ?? null;
$beschreibung = $data['beschreibung'] ?? null;
$typ = $data['typ'] ?? null;
$ist_oeffentlich = $data['ist_oeffentlich'] ?? false;

if (!$eisdiele_id || !$nutzer_id || !$url || !$typ) {
    echo json_encode(['error' => 'Fehlende erforderliche Daten']);
    exit;
}

// SQL-Abfrage vorbereiten
$sql = "INSERT INTO routen (eisdiele_id, nutzer_id, url, beschreibung, typ, ist_oeffentlich) VALUES (:eisdiele_id, :nutzer_id, :url, :beschreibung, :typ, :ist_oeffentlich)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    'eisdiele_id' => $eisdiele_id,
    'nutzer_id' => $nutzer_id,
    'url' => $url,
    'beschreibung' => $beschreibung,
    'typ' => $typ,
    'ist_oeffentlich' => $ist_oeffentlich
]);

echo json_encode(['message' => 'Route erfolgreich eingetragen']);
?>
