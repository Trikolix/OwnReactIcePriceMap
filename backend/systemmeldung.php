<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/notification_dispatcher.php';

function ensureSystemmeldungSchema(PDO $pdo): void
{
    $stmt = $pdo->prepare("SHOW COLUMNS FROM systemmeldungen LIKE 'link_url'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE systemmeldungen ADD COLUMN link_url VARCHAR(255) NULL DEFAULT NULL");
    }

    $stmt = $pdo->prepare("SHOW COLUMNS FROM systemmeldungen LIKE 'link_label'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE systemmeldungen ADD COLUMN link_label VARCHAR(100) NULL DEFAULT NULL");
    }
}

ensureSystemmeldungSchema($pdo);

$action = $_GET['action'] ?? '';

if ($action === 'create') {
    $input = json_decode(file_get_contents("php://input"), true);
    $title = trim((string)($input['title'] ?? ''));
    $message = trim((string)($input['message'] ?? ''));
    $linkUrl = trim((string)($input['link_url'] ?? ''));
    $linkLabel = trim((string)($input['link_label'] ?? ''));

    if ($title === '' || $message === '') {
        echo json_encode(["status" => "error", "message" => "Titel und Nachricht sind erforderlich"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO systemmeldungen (titel, nachricht, link_url, link_label) VALUES (?, ?, ?, ?)");
    $stmt->execute([$title, $message, $linkUrl !== '' ? $linkUrl : null, $linkLabel !== '' ? $linkLabel : null]);
    $systemmeldungId = (int)$pdo->lastInsertId();

    $notificationExtra = [
        'message' => $message,
        'link_url' => $linkUrl !== '' ? $linkUrl : null,
        'link_label' => $linkLabel !== '' ? $linkLabel : null
    ];

    $nutzer = $pdo->query("SELECT id FROM nutzer")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($nutzer as $row) {
        createNotification(
            $pdo,
            (int)$row['id'],
            'systemmeldung',
            $systemmeldungId,
            $title,
            $notificationExtra,
            [
                'email' => [
                    'type' => 'news',
                    'senderName' => 'Ice App',
                    'extra' => [
                        'title' => $title,
                        'message' => $message,
                        'linkUrl' => $linkUrl !== '' ? $linkUrl : null,
                        'linkLabel' => $linkLabel !== '' ? $linkLabel : null,
                        'skipRateLimit' => true
                    ]
                ]
            ]
        );
    }

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === 'list') {
    $stmt = $pdo->query("SELECT * FROM systemmeldungen ORDER BY erstellt_am DESC");
    $systemmeldungen = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($systemmeldungen as &$meldung) {
        $id = (int)$meldung['id'];

        $stmtCount = $pdo->prepare("
            SELECT COUNT(*) as total, SUM(ist_gelesen) as gelesen
            FROM benachrichtigungen
            WHERE typ = 'systemmeldung' AND referenz_id = ?
        ");
        $stmtCount->execute([$id]);
        $countData = $stmtCount->fetch(PDO::FETCH_ASSOC);

        $meldung['benachrichtigungen_total'] = (int)($countData['total'] ?? 0);
        $meldung['benachrichtigungen_gelesen'] = (int)($countData['gelesen'] ?? 0);
    }

    echo json_encode(["status" => "success", "systemmeldungen" => $systemmeldungen]);
    exit;
}

if ($action === 'delete') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id > 0) {
        $pdo->prepare("DELETE FROM systemmeldungen WHERE id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM benachrichtigungen WHERE referenz_id = ? AND typ = 'systemmeldung'")->execute([$id]);
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Ungueltige ID"]);
    }
    exit;
}

if ($action === 'update') {
    $input = json_decode(file_get_contents("php://input"), true);
    $id = (int)($input['id'] ?? 0);
    $titel = trim((string)($input['title'] ?? ''));
    $nachricht = trim((string)($input['message'] ?? ''));
    $linkUrl = trim((string)($input['link_url'] ?? ''));
    $linkLabel = trim((string)($input['link_label'] ?? ''));

    if ($id <= 0 || $titel === '' || $nachricht === '') {
        echo json_encode(["status" => "error", "message" => "Ungueltige Daten"]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE systemmeldungen SET titel = ?, nachricht = ?, link_url = ?, link_label = ? WHERE id = ?");
    $stmt->execute([$titel, $nachricht, $linkUrl !== '' ? $linkUrl : null, $linkLabel !== '' ? $linkLabel : null, $id]);

    $stmt2 = $pdo->prepare("UPDATE benachrichtigungen SET text = ?, zusatzdaten = ? WHERE referenz_id = ? AND typ = 'systemmeldung'");
    $stmt2->execute([
        $titel,
        json_encode([
            "message" => $nachricht,
            "link_url" => $linkUrl !== '' ? $linkUrl : null,
            "link_label" => $linkLabel !== '' ? $linkLabel : null
        ]),
        $id
    ]);

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === 'get' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT id, titel, nachricht, link_url, link_label, erstellt_am FROM systemmeldungen WHERE id = ?");
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
