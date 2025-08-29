<?php
require_once  __DIR__ . '/db_connect.php';

$action = $_GET['action'] ?? '';

if ($action === 'create') {
    $input = json_decode(file_get_contents("php://input"), true);
    $title = $input['title'] ?? '';
    $message = $input['message'] ?? '';

    if (empty($title) || empty($message)) {
        echo json_encode(["status" => "error", "message" => "Titel und Nachricht sind erforderlich"]);
        exit;
    }

    // Master-Systemmeldung anlegen
    $stmt = $pdo->prepare("INSERT INTO systemmeldungen (titel, nachricht) VALUES (?, ?)");
    $stmt->execute([$title, $message]);
    $systemmeldungId = $pdo->lastInsertId();

    // Benachrichtigung für alle Nutzer erzeugen
    $nutzer = $pdo->query("SELECT id FROM nutzer")->fetchAll(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare("
        INSERT INTO benachrichtigungen 
        (empfaenger_id, typ, referenz_id, text, ist_gelesen, zusatzdaten) 
        VALUES (?, 'systemmeldung', ?, ?, 0, ?)
    ");

    foreach ($nutzer as $row) {
        $stmt->execute([
            $row['id'],
            $systemmeldungId,
            $title,
            json_encode(["message" => $message])
        ]);
    }

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === 'list') {
    // Alle Systemmeldungen abrufen
    $stmt = $pdo->query("SELECT * FROM systemmeldungen ORDER BY erstellt_am DESC");
    $systemmeldungen = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Für jede Systemmeldung die Anzahl der Benachrichtigungen + gelesene zählen
    foreach ($systemmeldungen as &$meldung) {
        $id = $meldung['id'];

        $stmtCount = $pdo->prepare("
            SELECT 
                COUNT(*) as total, 
                SUM(ist_gelesen) as gelesen
            FROM benachrichtigungen
            WHERE typ = 'systemmeldung' AND referenz_id = ?
        ");
        $stmtCount->execute([$id]);
        $countData = $stmtCount->fetch(PDO::FETCH_ASSOC);

        $meldung['benachrichtigungen_total'] = intval($countData['total']);
        $meldung['benachrichtigungen_gelesen'] = intval($countData['gelesen']);
    }

    echo json_encode(["status" => "success", "systemmeldungen" => $systemmeldungen]);
    exit;
}

if ($action === 'delete') {
    $id = intval($_GET['id'] ?? 0);
    if ($id > 0) {
        $pdo->prepare("DELETE FROM systemmeldungen WHERE id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM benachrichtigungen WHERE referenz_id = ? AND typ = 'systemmeldung'")->execute([$id]);
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Ungültige ID"]);
    }
    exit;
}

if ($action === 'update') {
    $input = json_decode(file_get_contents("php://input"), true);
    $id = intval($input['id'] ?? 0);
    $titel = $input['title'] ?? '';
    $nachricht = $input['message'] ?? '';

    if ($id <= 0 || empty($titel) || empty($nachricht)) {
        echo json_encode(["status" => "error", "message" => "Ungültige Daten"]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE systemmeldungen SET titel = ?, nachricht = ? WHERE id = ?");
    $stmt->execute([$titel, $nachricht, $id]);

    // Optional: alle Benachrichtigungen für Nutzer aktualisieren
    $stmt2 = $pdo->prepare("UPDATE benachrichtigungen SET zusatzdaten = ? WHERE referenz_id = ? AND typ = 'systemmeldung'");
    $stmt2->execute([json_encode(["message" => $nachricht]), $id]);

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === 'get' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt =  $pdo->prepare("SELECT id, titel, nachricht, erstellt_am FROM systemmeldungen WHERE id = ?");
    $stmt->execute([$id]);
    $meldung = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($meldung) {
        echo json_encode(["status" => "success", "systemmeldung" => $meldung]);
    } else {
        echo json_encode(["status" => "error", "message" => "Systemmeldung nicht gefunden"]);
    }
    exit;
}
?>