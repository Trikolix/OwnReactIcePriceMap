<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../evaluators/PublicRouteCountEvaluator.php';
require_once __DIR__ . '/../evaluators/PrivateRouteCountEvaluator.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'], '/'));
$endpoint = $request[0] ?? null;

// Helper function to send JSON responses
function sendResponse($status, $message, $data = null) {
    $response = ['status' => $status, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

// Helper function to get input data
function getInputData() {
    return json_decode(file_get_contents('php://input'), true);
}

// Helper function to validate required fields
function validateRequiredFields($data, $requiredFields) {
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            return false;
        }
    }
    return true;
}

// Route creation endpoint
if ($method === 'POST' && $endpoint === 'routes') {
    try {
        $data = getInputData();
        $requiredFields = ['eisdiele_id', 'nutzer_id', 'url', 'typ'];
        if (!validateRequiredFields($data, $requiredFields)) {
            sendResponse('error', 'Fehlende erforderliche Daten');
        }

        $sql = "INSERT INTO routen (eisdiele_id, nutzer_id, url, beschreibung, typ, ist_oeffentlich)
                VALUES (:eisdiele_id, :nutzer_id, :url, :beschreibung, :typ, :ist_oeffentlich)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'eisdiele_id' => $data['eisdiele_id'],
            'nutzer_id' => $data['nutzer_id'],
            'url' => $data['url'],
            'beschreibung' => $data['beschreibung'] ?? null,
            'typ' => $data['typ'],
            'ist_oeffentlich' => $data['ist_oeffentlich'] ?? false
        ]);

        // Evaluatoren
        $evaluators = [
            new PublicRouteCountEvaluator(),
            new PrivateRouteCountEvaluator()
        ];

        $newAwards = [];
        foreach ($evaluators as $evaluator) {
            try {
                $evaluated = $evaluator->evaluate($data['nutzer_id']);
                $newAwards = array_merge($newAwards, $evaluated);
            } catch (Exception $e) {
                error_log("Fehler beim Evaluator: " . get_class($evaluator) . " - " . $e->getMessage());
            }
        }

        sendResponse('success', 'Route erfolgreich eingetragen', ['new_awards' => $newAwards]);
    } catch (PDOException $e) {
        sendResponse('error', 'Fehler beim Einfügen der Route', ['details' => $e->getMessage()]);
    } catch (Throwable $e) {
        sendResponse('error', 'Unbekannter Fehler', ['details' => $e->getMessage()]);
    }
}

// Route retrieval endpoint
elseif ($method === 'GET' && $endpoint === 'routes') {
    $eisdiele_id = $_GET['eisdiele_id'] ?? null;
    $nutzer_id = $_GET['nutzer_id'] ?? null;

    if (!$eisdiele_id) {
        sendResponse('error', 'Eisdiele-ID ist erforderlich');
    }

    $sql = "SELECT r.*, n.username
            FROM routen r
            JOIN nutzer n ON r.nutzer_id = n.id
            WHERE r.eisdiele_id = :eisdiele_id AND (r.ist_oeffentlich = TRUE OR r.nutzer_id = :nutzer_id)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['eisdiele_id' => $eisdiele_id, 'nutzer_id' => $nutzer_id]);

    $routen = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($routen);
    exit;
}

// Route update endpoint
elseif ($method === 'PUT' && $endpoint === 'routes') {
    $data = getInputData();
    $requiredFields = ['id', 'nutzer_id'];
    if (!validateRequiredFields($data, $requiredFields)) {
        sendResponse('error', 'Fehlende erforderliche Daten');
    }

    $sql = "UPDATE routen
            SET url = :url, beschreibung = :beschreibung, typ = :typ, ist_oeffentlich = :ist_oeffentlich
            WHERE id = :id AND nutzer_id = :nutzer_id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'url' => $data['url'] ?? null,
        'beschreibung' => $data['beschreibung'] ?? null,
        'typ' => $data['typ'] ?? null,
        'ist_oeffentlich' => $data['ist_oeffentlich'] ?? null,
        'id' => $data['id'],
        'nutzer_id' => $data['nutzer_id']
    ]);

    sendResponse('success', 'Route erfolgreich aktualisiert');
}

// Route deletion endpoint
elseif ($method === 'DELETE' && $endpoint === 'routes') {
    $data = getInputData();
    $requiredFields = ['id', 'nutzer_id'];
    if (!validateRequiredFields($data, $requiredFields)) {
        sendResponse('error', 'Fehlende erforderliche Daten');
    }

    $sql = "DELETE FROM routen WHERE id = :id AND nutzer_id = :nutzer_id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $data['id'], 'nutzer_id' => $data['nutzer_id']]);

    sendResponse('success', 'Route erfolgreich gelöscht');
}

// Invalid endpoint
else {
    sendResponse('error', 'Ungültiger Endpunkt oder Methode');
}
?>
