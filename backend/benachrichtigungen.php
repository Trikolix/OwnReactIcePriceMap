<?php
require_once __DIR__ . '/db_connect.php';

function respond($data)
{
    echo json_encode($data);
    exit;
}

$action = $_GET['action'] ?? null;

if ($action === 'list' && isset($_GET['nutzer_id'])) {
    $nutzerId = (int)$_GET['nutzer_id'];

    $stmt = $pdo->prepare("
        SELECT id, typ, referenz_id, text, ist_gelesen, erstellt_am, zusatzdaten
        FROM benachrichtigungen
        WHERE empfaenger_id = :uid
        ORDER BY erstellt_am DESC
        LIMIT 50
    ");
    $stmt->execute(['uid' => $nutzerId]);
    $notifs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    respond(['status' => 'success', 'notifications' => $notifs]);
}

if ($action === 'markAsRead') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['id'], $input['nutzer_id'])) {
        respond(['status' => 'error', 'message' => 'Fehlende Parameter']);
    }

    $stmt = $pdo->prepare("
        UPDATE benachrichtigungen
        SET ist_gelesen = 1
        WHERE id = :id AND empfaenger_id = :uid
    ");
    $stmt->execute([
        'id' => $input['id'],
        'uid' => $input['nutzer_id'],
    ]);

    respond(['status' => 'success']);
}

if ($action === 'get' && isset($_GET['id'], $_GET['nutzer_id'])) {
    $stmt = $pdo->prepare("
        SELECT id, typ, referenz_id, text, ist_gelesen, erstellt_am, zusatzdaten
        FROM benachrichtigungen
        WHERE id = :id AND empfaenger_id = :uid
        LIMIT 1
    ");
    $stmt->execute([
        'id' => (int)$_GET['id'],
        'uid' => (int)$_GET['nutzer_id'],
    ]);
    $notification = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$notification) {
        respond(['status' => 'error', 'message' => 'Benachrichtigung nicht gefunden']);
    }

    respond(['status' => 'success', 'notification' => $notification]);
}

respond(['status' => 'error', 'message' => 'Ungueltige Anfrage']);
?>
