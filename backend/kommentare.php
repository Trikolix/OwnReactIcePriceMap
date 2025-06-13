<?php
require_once  __DIR__ . '/db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
if ($method === "OPTIONS") {
    http_response_code(200);
    exit();
}
switch ("$method:$action") {
    case 'POST:create':
        createKommentar($pdo);
        break;
    case 'GET:list':
        listKommentare($pdo);
        break;
    case 'POST:update':
        updateKommentar($pdo);
        break;
    case 'POST:delete':
        deleteKommentar($pdo);
        break;
    default:
        http_response_code(400);
        echo json_encode([
            "status" =>"error",
            "message" => "Ungültige Anfrage"
        ]);
        break;
}

function createKommentar($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $checkinId = (int)$input['checkin_id'];
    $nutzerId = (int)$input['nutzer_id'];
    $kommentar = trim($input['kommentar']);

    if (!$kommentar) {
        echo json_encode([
            "status" => "error",
            "message" => "Kommentar darf nicht leer sein."
        ]);
        return;
    }

    // Einfügen
    $stmt = $pdo->prepare("
        INSERT INTO kommentare (checkin_id, nutzer_id, kommentar)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$checkinId, $nutzerId, $kommentar]);
    $kommentarId = $pdo->lastInsertId();

    // Checkin-Autor und Shop-ID ermitteln
    $stmt = $pdo->prepare("
        SELECT c.nutzer_id AS autor_id, c.eisdiele_id, n.username AS kommentator_name
        FROM checkins c
        JOIN nutzer n ON n.id = ?
        WHERE c.id = ?
    ");
    $stmt->execute([$nutzerId, $checkinId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $checkinAutorId = $row['autor_id'];
    $eisdieleId = $row['eisdiele_id'];
    $kommentatorName = $row['kommentator_name'];

    $zusatzdaten = json_encode([
            'checkin_id' => $checkinId,
            'eisdiele_id' => $eisdieleId,
            'kommentar_id' => $kommentarId
        ]);

    // 1. Benachrichtigung an Check-in-Autor
    if ($checkinAutorId && $checkinAutorId != $nutzerId) {
        $stmt = $pdo->prepare("
            INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten)
            VALUES (?, 'kommentar', ?, ?, ?)
        ");
        $text = "$kommentatorName hat deinen Check-in kommentiert.";
        
        $stmt->execute([$checkinAutorId, $kommentarId, $text, $zusatzdaten]);
    }

    // 2. Andere Kommentierende benachrichtigen
    $stmt = $pdo->prepare("
        SELECT DISTINCT nutzer_id
        FROM kommentare
        WHERE checkin_id = ? AND nutzer_id NOT IN (?, ?)
    ");
    $stmt->execute([$checkinId, $nutzerId, $checkinAutorId]);
    $beteiligteIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if ($beteiligteIds) {
        $text = "$kommentatorName hat einen Check-in kommentiert, den du auch kommentiert hast.";
        $stmt = $pdo->prepare("
            INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten)
            VALUES (?, 'kommentar', ?, ?, ?)
        ");

        foreach ($beteiligteIds as $beteiligterId) {
            $stmt->execute([$beteiligterId, $kommentarId, $text, $zusatzdaten]);
        }
    }

    echo json_encode([
        "status" => "success",
        "kommentar_id" => $kommentarId
    ]);
}

function listKommentare($pdo) {
    $checkinId = (int)($_GET['checkin_id'] ?? 0);

    $stmt = $pdo->prepare("
        SELECT k.id, k.nutzer_id, n.username AS nutzername, k.kommentar, k.erstellt_am
        FROM kommentare k
        JOIN nutzer n ON k.nutzer_id = n.id
        WHERE k.checkin_id = ?
        ORDER BY k.erstellt_am ASC
    ");
    $stmt->execute([$checkinId]);
    $kommentare = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "anzahl" => count($kommentare),
        "kommentare" => $kommentare
    ]);
}

function updateKommentar($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $kommentarId = (int)$input['id'];
    $nutzerId = (int)$input['nutzer_id'];
    $kommentar = trim($input['kommentar']);

    if (!$kommentar) {
        echo json_encode([
            "status" => "error",
            "message" => "Kommentar darf nicht leer sein."
        ]);
        return;
    }

    // Sicherheit: nur eigene Kommentare bearbeiten
    $stmt = $pdo->prepare("SELECT nutzer_id FROM kommentare WHERE id = ?");
    $stmt->execute([$kommentarId]);
    $autorId = $stmt->fetchColumn();

    if ($autorId != $nutzerId) {
        http_response_code(403);
        echo json_encode([
            "status" => "error",
            "message" => "Nicht erlaubt."
        ]);
        return;
    }

    $stmt = $pdo->prepare("UPDATE kommentare SET kommentar = ? WHERE id = ?");
    $stmt->execute([$kommentar, $kommentarId]);

    echo json_encode(["status" => "success"]);
}

function deleteKommentar($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $kommentarId = (int)$input['id'];
    $nutzerId = (int)$input['nutzer_id'];

    // Sicherheit: nur eigene Kommentare löschen
    $stmt = $pdo->prepare("SELECT nutzer_id FROM kommentare WHERE id = ?");
    $stmt->execute([$kommentarId]);
    $autorId = $stmt->fetchColumn();

    if ($autorId != $nutzerId) {
        http_response_code(403);
        echo json_encode([
            "status" =>"error",
            "message" => "Nicht erlaubt."
        ]);
        return;
    }

    // Zuerst Benachrichtigung löschen
    $stmt = $pdo->prepare("DELETE FROM benachrichtigungen WHERE typ = 'kommentar' AND referenz_id = ?");
    $stmt->execute([$kommentarId]);

    // Dann Kommentar löschen
    $stmt = $pdo->prepare("DELETE FROM kommentare WHERE id = ?");
    $stmt->execute([$kommentarId]);

    echo json_encode(["status" => "success"]);
}

?>