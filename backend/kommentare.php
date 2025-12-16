<?php
require_once  __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/email_notification.php';
require_once __DIR__ . '/lib/auth.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
if ($method === "OPTIONS") {
    http_response_code(200);
    exit();
}
switch ("$method:$action") {
    case 'POST:create':
        createKommentar($pdo, $currentUserId);
        break;
    case 'GET:list':
        listKommentare($pdo);
        break;
    case 'POST:update':
        updateKommentar($pdo, $currentUserId);
        break;
    case 'POST:delete':
        deleteKommentar($pdo, $currentUserId);
        break;
    default:
        http_response_code(400);
        echo json_encode([
            "status" =>"error",
            "message" => "Ungültige Anfrage"
        ]);
        break;
}

function createKommentar($pdo, $currentUserId) {
    $input = json_decode(file_get_contents('php://input'), true);
    $checkinId = isset($input['checkin_id']) ? (int)$input['checkin_id'] : null;
    $bewertungId = isset($input['bewertung_id']) ? (int)$input['bewertung_id'] : null;
    $routeId = isset($input['route_id']) ? (int)$input['route_id'] : null;
    $kommentar = trim($input['kommentar']);

    // Validierung: genau eine ID muss gesetzt sein
    $ids = array_filter([$checkinId, $bewertungId, $routeId], fn($v) => $v !== null);
    if (count($ids) !== 1) {
        echo json_encode([
            "status" => "error",
            "message" => "Genau eine von checkin_id, bewertung_id oder route_id muss gesetzt sein."
        ]);
        return;
    }

    if (!$kommentar) {
        echo json_encode([
            "status" => "error",
            "message" => "Kommentar darf nicht leer sein."
        ]);
        return;
    }

    // Kommentar einfügen
    $stmt = $pdo->prepare("
        INSERT INTO kommentare (checkin_id, bewertung_id, route_id, nutzer_id, kommentar)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$checkinId, $bewertungId, $routeId, $currentUserId, $kommentar]);
    $kommentarId = $pdo->lastInsertId();

    if ($checkinId) {
        handleCheckinKommentarBenachrichtigungen($pdo, $checkinId, $currentUserId, $kommentarId);
    } elseif ($bewertungId) {
        handleBewertungKommentarBenachrichtigungen($pdo, $bewertungId, $currentUserId, $kommentarId);
    } elseif ($routeId) {
        handleRouteKommentarBenachrichtigungen($pdo, $routeId, $currentUserId, $kommentarId);
    }

    echo json_encode([
        "status" => "success",
        "kommentar_id" => $kommentarId
    ]);
}

function handleCheckinKommentarBenachrichtigungen($pdo, $checkinId, $currentUserId, $kommentarId) {
    try {
        // Checkin-Informationen inkl. Eisdielen-Name und Kommentator-Name ermitteln
        $stmt = $pdo->prepare("
            SELECT c.nutzer_id AS autor_id, c.eisdiele_id, e.name AS eisdiele_name
            FROM checkins c
            JOIN eisdielen e ON c.eisdiele_id = e.id
            WHERE c.id = ?
        ");
        $stmt->execute([$checkinId]);
        $checkinData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$checkinData) {
            error_log("Checkin not found: $checkinId");
            return;
        }

        // Kommentator-Name separat holen
        $stmt = $pdo->prepare("SELECT username FROM nutzer WHERE id = ?");
        $stmt->execute([$currentUserId]);
        $kommentatorName = $stmt->fetchColumn();

        if (!$kommentatorName) {
            error_log("User not found: $currentUserId");
            return;
        }

        $checkinAutorId = $checkinData['autor_id'];
        $eisdieleId = $checkinData['eisdiele_id'];
        $eisdieleName = $checkinData['eisdiele_name'] ?? '';

        $zusatzdaten = json_encode([
            'checkin_id' => $checkinId,
            'eisdiele_id' => $eisdieleId,
            'eisdiele_name' => $eisdieleName,
            'kommentar_id' => $kommentarId
        ]);

        // 1. Benachrichtigung an Check-in-Autor
        if ($checkinAutorId && $checkinAutorId != $currentUserId) {
            $stmt = $pdo->prepare("
                INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten)
                VALUES (?, 'kommentar', ?, ?, ?)
            ");
            $text = "$kommentatorName hat deinen Check-in kommentiert.";
            $stmt->execute([$checkinAutorId, $kommentarId, $text, $zusatzdaten]);
            // E-Mail über die generische Funktion
            sendNotificationEmailIfAllowed(
                $pdo,
                $checkinAutorId,
                'comment',
                $kommentatorName,
                [
                    'shopName' => $eisdieleName,
                    'shopId' => $eisdieleId,
                    'checkinId' => $checkinId,
                    'kommentarId' => $kommentarId,
                    'byUserId' => $currentUserId
               ]
            );
        }

        // 2. Andere Kommentierende benachrichtigen (außer dem aktuellen Kommentar)
        $stmt = $pdo->prepare("
            SELECT DISTINCT nutzer_id
            FROM kommentare
            WHERE checkin_id = ? AND nutzer_id NOT IN (?, ?) AND id != ?
        ");
        $stmt->execute([$checkinId, $currentUserId, $checkinAutorId ?: 0, $kommentarId]);
        $beteiligteIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if ($beteiligteIds) {
            $text = "$kommentatorName hat einen Check-in kommentiert, den du auch kommentiert hast.";
            $stmt = $pdo->prepare("
                INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten)
                VALUES (?, 'kommentar', ?, ?, ?)
            ");

            foreach ($beteiligteIds as $beteiligterId) {
                $stmt->execute([$beteiligterId, $kommentarId, $text, $zusatzdaten]);
                // Email-Berechtigung wird in sendNotificationEmailIfAllowed geprüft
                sendNotificationEmailIfAllowed(
                    $pdo,
                    $beteiligterId,
                    'comment_participated',
                    $kommentatorName,
                    [
                        'shopName' => $eisdieleName,
                        'shopId' => $eisdieleId,
                        'checkinId' => $checkinId,
                        'kommentarId' => $kommentarId,
                        'byUserId' => $currentUserId
                   ]
                );
            }
        }
    } catch (Exception $e) {
        error_log("Error in handleCheckinKommentarBenachrichtigungen: " . $e->getMessage());
    }
}

function handleBewertungKommentarBenachrichtigungen($pdo, $bewertungId, $currentUserId, $kommentarId) {
    try {
        // Bewertungs-Informationen ermitteln
        $stmt = $pdo->prepare("
            SELECT b.nutzer_id AS autor_id, b.eisdiele_id
            FROM bewertungen b
            WHERE b.id = ?
        ");
        $stmt->execute([$bewertungId]);
        $bewertungData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$bewertungData) {
            error_log("Bewertung not found: $bewertungId");
            return;
        }

        // Kommentator-Name separat holen
        $stmt = $pdo->prepare("SELECT username FROM nutzer WHERE id = ?");
        $stmt->execute([$currentUserId]);
        $kommentatorName = $stmt->fetchColumn();

        if (!$kommentatorName) {
            error_log("User not found: $currentUserId");
            return;
        }

        $bewertungAutorId = $bewertungData['autor_id'];
        $eisdieleId = $bewertungData['eisdiele_id'];

        $zusatzdaten = json_encode([
            'bewertung_id' => $bewertungId,
            'eisdiele_id' => $eisdieleId,
            'kommentar_id' => $kommentarId
        ]);

        // 1. Benachrichtigung an Bewertungsautor
        if ($bewertungAutorId && $bewertungAutorId != $currentUserId) {
            $stmt = $pdo->prepare("
                INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten)
                VALUES (?, 'kommentar_bewertung', ?, ?, ?)
            ");
            $text = "$kommentatorName hat deine Bewertung kommentiert.";
            $stmt->execute([$bewertungAutorId, $kommentarId, $text, $zusatzdaten]);
            // E-Mail über die generische Funktion
            sendNotificationEmailIfAllowed(
                $pdo,
                $bewertungAutorId,
                'comment',
                $kommentatorName,
                [
                    'shopName' => '',
                    'shopId' => $eisdieleId,
                    'bewertungId' => $bewertungId,
                    'kommentarId' => $kommentarId,
                    'byUserId' => $currentUserId
                ]
            );
        }

        // 2. Andere Kommentierende benachrichtigen (außer dem aktuellen Kommentar)
        $stmt = $pdo->prepare("
            SELECT DISTINCT nutzer_id
            FROM kommentare
            WHERE bewertung_id = ? AND nutzer_id NOT IN (?, ?) AND id != ?
        ");
        $stmt->execute([$bewertungId, $currentUserId, $bewertungAutorId ?: 0, $kommentarId]);
        $beteiligteIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if ($beteiligteIds) {
            $text = "$kommentatorName hat eine Bewertung kommentiert, die du auch kommentiert hast.";
            $stmt = $pdo->prepare("
                INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten)
                VALUES (?, 'kommentar_bewertung', ?, ?, ?)
            ");

            foreach ($beteiligteIds as $beteiligterId) {
                $stmt->execute([$beteiligterId, $kommentarId, $text, $zusatzdaten]);
            }
        }
    } catch (Exception $e) {
        error_log("Error in handleBewertungKommentarBenachrichtigungen: " . $e->getMessage());
    }
}

// Route-Kommentar-Benachrichtigungen
function handleRouteKommentarBenachrichtigungen($pdo, $routeId, $currentUserId, $kommentarId) {
    try {
        $stmt = $pdo->prepare("SELECT r.nutzer_id AS autor_id, r.name AS route_name FROM routen r WHERE r.id = ?");
        $stmt->execute([$routeId]);
        $routeData = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$routeData) return;

        $stmt = $pdo->prepare("SELECT username FROM nutzer WHERE id = ?");
        $stmt->execute([$currentUserId]);
        $kommentatorName = $stmt->fetchColumn();
        if (!$kommentatorName) return;

        $routeAutorId = $routeData['autor_id'];
        $routeName = $routeData['route_name'] ?? '';
        $zusatzdaten = json_encode([
            'route_id' => $routeId,
            'route_name' => $routeName,
            'kommentar_id' => $kommentarId,
            'route_autor_id' => $routeAutorId
        ]);

        // 1. Benachrichtigung an Route-Autor
        if ($routeAutorId && $routeAutorId != $currentUserId) {
            $stmt = $pdo->prepare("INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten) VALUES (?, 'kommentar_route', ?, ?, ?)");
            $text = "$kommentatorName hat deine Route '$routeName' kommentiert.";
            $stmt->execute([$routeAutorId, $kommentarId, $text, $zusatzdaten]);
            sendNotificationEmailIfAllowed(
                $pdo,
                $routeAutorId,
                'comment',
                $kommentatorName,
                [
                    'routeName' => $routeName,
                    'routeId' => $routeId,
                    'kommentarId' => $kommentarId,
                    'byUserId' => $currentUserId,
                    'route_autor_id' => $routeAutorId
                ]
            );
        }

        // 2. Andere Kommentierende benachrichtigen
        $stmt = $pdo->prepare("SELECT DISTINCT nutzer_id FROM kommentare WHERE route_id = ? AND nutzer_id NOT IN (?, ?) AND id != ?");
        $stmt->execute([$routeId, $currentUserId, $routeAutorId ?: 0, $kommentarId]);
        $beteiligteIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if ($beteiligteIds) {
            $text = "$kommentatorName hat eine Route kommentiert, die du auch kommentiert hast.";
            $stmt = $pdo->prepare("INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten) VALUES (?, 'kommentar_route', ?, ?, ?)");
            foreach ($beteiligteIds as $beteiligterId) {
                $stmt->execute([$beteiligterId, $kommentarId, $text, $zusatzdaten]);
                sendNotificationEmailIfAllowed(
                    $pdo,
                    $beteiligterId,
                    'comment_participated_route',
                    $kommentatorName,
                    [
                        'routeName' => $routeName,
                        'routeId' => $routeId,
                        'kommentarId' => $kommentarId,
                        'byUserId' => $currentUserId,
                        'route_autor_id' => $routeAutorId
                    ]
                );
            }
        }
    } catch (Exception $e) {
        error_log("Error in handleRouteKommentarBenachrichtigungen: " . $e->getMessage());
    }
}

function listKommentare($pdo) {
    $checkinId = isset($_GET['checkin_id']) ? (int)$_GET['checkin_id'] : null;
    $bewertungId = isset($_GET['bewertung_id']) ? (int)$_GET['bewertung_id'] : null;
    $routeId = isset($_GET['route_id']) ? (int)$_GET['route_id'] : null;

    // Validierung: genau eine ID muss gesetzt sein
    $ids = array_filter([$checkinId, $bewertungId, $routeId], fn($v) => $v !== null);
    if (count($ids) !== 1) {
        echo json_encode([
            "status" => "error",
            "message" => "Genau eine von checkin_id, bewertung_id oder route_id muss als Parameter übergeben werden."
        ]);
        return;
    }

    if ($checkinId) {
        $whereClause = "k.checkin_id = ?";
        $parameter = $checkinId;
    } elseif ($bewertungId) {
        $whereClause = "k.bewertung_id = ?";
        $parameter = $bewertungId;
    } else {
        $whereClause = "k.route_id = ?";
        $parameter = $routeId;
    }

    $stmt = $pdo->prepare("
        SELECT k.id, k.nutzer_id, n.username AS nutzername, k.kommentar, k.erstellt_am
        FROM kommentare k
        JOIN nutzer n ON k.nutzer_id = n.id
        WHERE $whereClause
        ORDER BY k.erstellt_am ASC
    ");
    $stmt->execute([$parameter]);
    $kommentare = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "anzahl" => count($kommentare),
        "kommentare" => $kommentare
    ]);
}

function updateKommentar($pdo, $currentUserId) {
    $input = json_decode(file_get_contents('php://input'), true);
    $kommentarId = (int)$input['id'];
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

    if ($autorId != $currentUserId) {
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

function deleteKommentar($pdo, $currentUserId) {
    $input = json_decode(file_get_contents('php://input'), true);
    $kommentarId = (int)$input['id'];

    // Sicherheit: nur eigene Kommentare löschen
    $stmt = $pdo->prepare("SELECT nutzer_id FROM kommentare WHERE id = ?");
    $stmt->execute([$kommentarId]);
    $autorId = $stmt->fetchColumn();

    if ($autorId != $currentUserId) {
        http_response_code(403);
        echo json_encode([
            "status" =>"error",
            "message" => "Nicht erlaubt."
        ]);
        return;
    }

    // Zuerst Benachrichtigungen löschen (sowohl für Checkins als auch Bewertungen)
    $stmt = $pdo->prepare("DELETE FROM benachrichtigungen WHERE (typ = 'kommentar' OR typ = 'kommentar_bewertung') AND referenz_id = ?");
    $stmt->execute([$kommentarId]);

    // Dann Kommentar löschen
    $stmt = $pdo->prepare("DELETE FROM kommentare WHERE id = ?");
    $stmt->execute([$kommentarId]);

    echo json_encode(["status" => "success"]);
}

?>