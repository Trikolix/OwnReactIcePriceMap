<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/ice_dates.php';
require_once __DIR__ . '/../lib/opening_hours.php';

ensureIceDateSchema($pdo);
$shopId = isset($_GET['shop_id']) ? (int)$_GET['shop_id'] : 0;
$startsAt = trim((string)($_GET['starts_at'] ?? ''));
if ($startsAt !== '' && !iceDateParseStart($startsAt)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Bitte gib einen gültigen Termin an.']);
    exit;
}
if ($shopId <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Eisdiele fehlt.']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, name, adresse, latitude AS lat, longitude AS lon, openingHours, opening_hours_note, status, reopening_date, closing_date FROM eisdielen WHERE id = :shop_id AND place_type = 'ice_shop' LIMIT 1");
$stmt->execute(['shop_id' => $shopId]);
$shop = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$shop) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Eisdiele nicht gefunden.']);
    exit;
}

$shop['id'] = (int)$shop['id'];
$openingRows = fetch_opening_hours_rows($pdo, $shop['id']);
$openingNote = $shop['opening_hours_note'] ?? null;
if (empty($openingRows) && !empty($shop['openingHours'])) {
    $parsed = parse_legacy_opening_hours($shop['openingHours']);
    $openingRows = $parsed['rows'];
    if ($openingNote === null && $parsed['note']) {
        $openingNote = $parsed['note'];
    }
}
$shop['openingHoursStructured'] = build_structured_opening_hours($openingRows, $openingNote);
$shop['opening_hours_note'] = $openingNote;
$shop['is_open_now'] = is_shop_open($openingRows, null, $shop['status'] ?? null);
$shop['is_open_at_start'] = $startsAt !== '' ? iceDateOpenAtStart($openingRows, $shop, $startsAt) : null;
$shop['opening_reference'] = $startsAt !== '' ? $startsAt : null;
echo json_encode(['status' => 'success', 'shop' => $shop]);
