<?php
require_once  __DIR__ . '/../db_connect.php';
require_once  __DIR__ . '/../evaluators/PublicRouteCountEvaluator.php';
require_once  __DIR__ . '/../evaluators/PrivateRouteCountEvaluator.php';

try {
    // Daten aus der Anfrage holen
    $data = json_decode(file_get_contents('php://input'), true);
    $eisdiele_id = $data['eisdiele_id'] ?? null;
    $nutzer_id = $data['nutzer_id'] ?? null;
    $url = $data['url'] ?? null;
    $beschreibung = $data['beschreibung'] ?? null;
    $typ = $data['typ'] ?? null;
    $ist_oeffentlich = $data['ist_oeffentlich'] ?? false;
    
    if (!$eisdiele_id || !$nutzer_id || !$url || !$typ) {
        echo json_encode([
            'status' => 'error', 
            'message' => 'Fehlende erforderliche Daten'
    ]);
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

    // Evaluatoren
    $evaluators = [
        new PublicRouteCountEvaluator(),
        new PrivateRouteCountEvaluator()
    ];

    $newAwards = [];
    foreach ($evaluators as $evaluator) {
        try {
            $evaluated = $evaluator->evaluate($nutzer_id);
            $newAwards = array_merge($newAwards, $evaluated);
        } catch (Exception $e) {
            error_log("Fehler beim Evaluator: " . get_class($evaluator) . " - " . $e->getMessage());
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Route erfolgreich eingetragen',
        'new_awards' => $newAwards
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fehler beim Einfügen der Route',
        'details' => $e->getMessage()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unbekannter Fehler',
        'details' => $e->getMessage()
    ]);
}
?>