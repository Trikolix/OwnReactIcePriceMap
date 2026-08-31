<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/ice_dates.php';

ensureIceDateSchema($pdo);
$authData = requireAuth($pdo);
$creatorId = (int)$authData['user_id'];
$payload = json_decode(file_get_contents('php://input'), true);
$shopId = isset($payload['shop_id']) ? (int)$payload['shop_id'] : 0;
$startsAt = trim((string)($payload['starts_at'] ?? ''));
$title = trim((string)($payload['title'] ?? ''));
$note = trim((string)($payload['note'] ?? ''));
$participantIds = is_array($payload['participant_user_ids'] ?? null) ? $payload['participant_user_ids'] : [];

$parsedStart = DateTime::createFromFormat('Y-m-d H:i:s', $startsAt);
if (!$parsedStart || $parsedStart->format('Y-m-d H:i:s') !== $startsAt) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Bitte gib einen gültigen Termin an.']);
    exit;
}
if ($parsedStart < new DateTime('now') || $parsedStart > (new DateTime('now'))->modify('+1 year')) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Der Termin muss in der Zukunft und innerhalb des nächsten Jahres liegen.']);
    exit;
}
if ($shopId <= 0 || mb_strlen($title) > 120 || mb_strlen($note) > 2000) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Date-Daten.']);
    exit;
}

$participantIds = array_values(array_unique(array_filter(array_map('intval', $participantIds), static function (int $id) use ($creatorId): bool {
    return $id > 0 && $id !== $creatorId;
})));
if (count($participantIds) > 7) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ein Eis-Date kann maximal acht Personen umfassen.']);
    exit;
}

$shopStmt = $pdo->prepare("SELECT id FROM eisdielen WHERE id = :shop_id AND place_type = 'ice_shop' LIMIT 1");
$shopStmt->execute(['shop_id' => $shopId]);
if (!$shopStmt->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Eisdiele nicht gefunden.']);
    exit;
}

if ($participantIds) {
    $userStmt = $pdo->prepare('SELECT id FROM nutzer WHERE id IN (' . implode(',', array_fill(0, count($participantIds), '?')) . ')');
    $userStmt->execute($participantIds);
    $validIds = array_map('intval', $userStmt->fetchAll(PDO::FETCH_COLUMN));
    if (count($validIds) !== count($participantIds)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Mindestens ein eingeladener Nutzer wurde nicht gefunden.']);
        exit;
    }
}

try {
    // Die Benachrichtigungs-Tabellen können bei der ersten Nutzung noch angelegt
    // oder erweitert werden. MySQL beendet bei DDL innerhalb einer Transaktion
    // diese implizit; deshalb muss die Initialisierung vorher erfolgen.
    ensurePushInfrastructureSchema($pdo);

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT INTO ice_dates (creator_user_id, shop_id, title, note, starts_at, invite_token) VALUES (:creator_id, :shop_id, :title, :note, :starts_at, :token)');
    $stmt->execute([
        'creator_id' => $creatorId,
        'shop_id' => $shopId,
        'title' => $title !== '' ? $title : null,
        'note' => $note !== '' ? $note : null,
        'starts_at' => $startsAt,
        'token' => iceDateToken(),
    ]);
    $dateId = (int)$pdo->lastInsertId();

    $participantStmt = $pdo->prepare("INSERT INTO ice_date_participants (date_id, user_id, role, status) VALUES (:date_id, :user_id, :role, :status)");
    $participantStmt->execute(['date_id' => $dateId, 'user_id' => $creatorId, 'role' => 'organizer', 'status' => 'going']);
    foreach ($participantIds as $participantId) {
        $participantStmt->execute(['date_id' => $dateId, 'user_id' => $participantId, 'role' => 'participant', 'status' => 'invited']);
    }

    $creatorStmt = $pdo->prepare('SELECT username FROM nutzer WHERE id = :id LIMIT 1');
    $creatorStmt->execute(['id' => $creatorId]);
    $creatorName = (string)$creatorStmt->fetchColumn();
    foreach ($participantIds as $participantId) {
        iceDateNotify($pdo, $participantId, $dateId, "{$creatorName} hat dich zu einem Eis-Date eingeladen.", 'invite', $creatorName);
    }
    $pdo->commit();

    echo json_encode(['status' => 'success', 'ice_date' => iceDateFetchDetail($pdo, $dateId, null, $creatorId)]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
