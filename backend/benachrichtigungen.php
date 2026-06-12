<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/likes.php';

function respond($data)
{
    echo json_encode($data);
    exit;
}

function enrichLikeNotification(PDO $pdo, array $notification): array
{
    if (($notification['typ'] ?? '') !== 'like') {
        return $notification;
    }

    $data = [];
    if (!empty($notification['zusatzdaten'])) {
        $decoded = json_decode((string)$notification['zusatzdaten'], true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    $entityType = (string)($data['entity_type'] ?? '');
    $entityId = (int)($data['entity_id'] ?? $notification['referenz_id'] ?? 0);
    if (!isValidLikeEntityType($entityType) || $entityId <= 0) {
        return $notification;
    }

    $likerId = (int)($data['liker_id'] ?? 0);
    $enriched = array_merge($data, getLikeNotificationExtraData($pdo, $entityType, $entityId, $likerId));
    $notification['zusatzdaten'] = json_encode($enriched, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    return $notification;
}

function enrichLikeNotifications(PDO $pdo, array $notifications): array
{
    return array_map(static fn(array $notification): array => enrichLikeNotification($pdo, $notification), $notifications);
}

function ensureNotificationHiddenColumn(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    try {
        $columnStmt = $pdo->query("SHOW COLUMNS FROM benachrichtigungen LIKE 'ausgeblendet_am'");
        if (!$columnStmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->exec("
                ALTER TABLE benachrichtigungen
                ADD COLUMN ausgeblendet_am DATETIME NULL DEFAULT NULL AFTER ist_gelesen
            ");
        }

        $indexStmt = $pdo->query("SHOW INDEX FROM benachrichtigungen WHERE Key_name = 'idx_benachrichtigungen_empfaenger_visible'");
        if (!$indexStmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->exec("
                CREATE INDEX idx_benachrichtigungen_empfaenger_visible
                ON benachrichtigungen (empfaenger_id, ausgeblendet_am, erstellt_am)
            ");
        }
    } catch (Throwable $e) {
        error_log('Failed to ensure benachrichtigungen soft-delete column: ' . $e->getMessage());
    }
}

ensureNotificationHiddenColumn($pdo);

$action = $_GET['action'] ?? null;

if ($action === 'list' && isset($_GET['nutzer_id'])) {
    $nutzerId = (int)$_GET['nutzer_id'];

    $stmt = $pdo->prepare("
        SELECT id, typ, referenz_id, text, ist_gelesen, erstellt_am, zusatzdaten
        FROM benachrichtigungen
        WHERE empfaenger_id = :uid
          AND ausgeblendet_am IS NULL
        ORDER BY erstellt_am DESC
        LIMIT 50
    ");
    $stmt->execute(['uid' => $nutzerId]);
    $notifs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    respond(['status' => 'success', 'notifications' => enrichLikeNotifications($pdo, $notifs)]);
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

if ($action === 'markAllAsRead') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['nutzer_id'])) {
        respond(['status' => 'error', 'message' => 'Fehlende Parameter']);
    }

    $stmt = $pdo->prepare("
        UPDATE benachrichtigungen
        SET ist_gelesen = 1
        WHERE empfaenger_id = :uid AND ist_gelesen = 0 AND ausgeblendet_am IS NULL
    ");
    $stmt->execute([
        'uid' => $input['nutzer_id'],
    ]);

    respond(['status' => 'success']);
}

if ($action === 'hide' || $action === 'delete') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['id'], $input['nutzer_id'])) {
        respond(['status' => 'error', 'message' => 'Fehlende Parameter']);
    }

    $stmt = $pdo->prepare("
        UPDATE benachrichtigungen
        SET ausgeblendet_am = COALESCE(ausgeblendet_am, NOW())
        WHERE id = :id AND empfaenger_id = :uid
    ");
    $stmt->execute([
        'id' => (int)$input['id'],
        'uid' => (int)$input['nutzer_id'],
    ]);

    respond(['status' => 'success']);
}

if ($action === 'get' && isset($_GET['id'], $_GET['nutzer_id'])) {
    $stmt = $pdo->prepare("
        SELECT id, typ, referenz_id, text, ist_gelesen, erstellt_am, zusatzdaten
        FROM benachrichtigungen
        WHERE id = :id AND empfaenger_id = :uid
          AND ausgeblendet_am IS NULL
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

    respond(['status' => 'success', 'notification' => enrichLikeNotification($pdo, $notification)]);
}

respond(['status' => 'error', 'message' => 'Ungültige Anfrage']);
?>
