<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/api_request.php';
require_once __DIR__ . '/lib/likes.php';

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

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
$action = $_GET['action'] ?? '';
$read = in_array($action, ['list', 'get'], true);
if (!$read && !in_array($action, ['markAsRead','markAllAsRead','hide','delete'], true)) {
    apiJson(['status' => 'error', 'message' => 'Unbekannte Aktion.'], 400);
}
apiMethod($read ? 'GET' : 'POST');
$input = $read ? $_GET : apiInput();
if (isset($input['nutzer_id']) && filter_var($input['nutzer_id'], FILTER_VALIDATE_INT) !== $userId) {
    apiJson(['status' => 'error', 'message' => 'Zugriff auf fremde Benachrichtigungen nicht erlaubt.'], 403);
}
try {
    if ($action === 'list') {
        $limit = 50;
        $before = filter_var($input['before_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $stmt = $pdo->prepare('SELECT id,typ,referenz_id,text,ist_gelesen,erstellt_am,zusatzdaten
            FROM benachrichtigungen WHERE empfaenger_id=? AND ausgeblendet_am IS NULL'
            . ($before ? ' AND id < ?' : '') . ' ORDER BY id DESC LIMIT 51');
        $stmt->execute($before ? [$userId, $before] : [$userId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $hasMore = count($items) > $limit;
        if ($hasMore) array_pop($items);
        foreach ($items as &$item) $item['ist_gelesen'] = (bool)$item['ist_gelesen'];
        unset($item);
        $count = $pdo->prepare('SELECT COUNT(*) FROM benachrichtigungen WHERE empfaenger_id=? AND ausgeblendet_am IS NULL AND ist_gelesen=0');
        $count->execute([$userId]);
        apiJson(['status' => 'success', 'notifications' => enrichLikeNotifications($pdo, $items),
            'unread_total' => (int)$count->fetchColumn(), 'next_cursor' => $hasMore ? (int)end($items)['id'] : null]);
    }
    if ($action === 'markAllAsRead') {
        $pdo->prepare('UPDATE benachrichtigungen SET ist_gelesen=1 WHERE empfaenger_id=? AND ausgeblendet_am IS NULL')->execute([$userId]);
        apiJson(['status' => 'success']);
    }
    $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$id) apiJson(['status' => 'error', 'message' => 'Ungültige ID.'], 422);
    $stmt = $pdo->prepare('SELECT * FROM benachrichtigungen WHERE id=? AND empfaenger_id=? AND ausgeblendet_am IS NULL');
    $stmt->execute([$id, $userId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$item) apiJson(['status' => 'error', 'message' => 'Benachrichtigung nicht gefunden.'], 404);
    if ($action === 'get') apiJson(['status' => 'success', 'notification' => enrichLikeNotification($pdo, $item)]);
    if ($action === 'markAsRead') {
        $pdo->prepare('UPDATE benachrichtigungen SET ist_gelesen=1 WHERE id=? AND empfaenger_id=?')->execute([$id, $userId]);
    } else {
        $pdo->prepare('UPDATE benachrichtigungen SET ausgeblendet_am=NOW() WHERE id=? AND empfaenger_id=?')->execute([$id, $userId]);
    }
    apiJson(['status' => 'success']);
} catch (Throwable $e) {
    error_log('Notification API: ' . $e->getMessage());
    apiJson(['status' => 'error', 'message' => 'Benachrichtigungen konnten nicht aktualisiert werden.'], 500);
}
