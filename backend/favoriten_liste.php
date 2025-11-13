<?php
require_once  __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/opening_hours.php';

$nutzerId = $_GET['nutzer_id'] ?? null;

if (!$nutzerId) {
    echo json_encode(["error" => "nutzer_id fehlt"]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT 
        e.*,
        f.hinzugefuegt_am AS favorit_seit
    FROM favoriten f
    JOIN eisdielen e ON f.eisdiele_id = e.id
    WHERE f.nutzer_id = ?
    ORDER by f.hinzugefuegt_am DESC
");
$stmt->execute([$nutzerId]);
$favoriten = $stmt->fetchAll(PDO::FETCH_ASSOC);

$openingHoursMap = fetch_opening_hours_map($pdo, array_column($favoriten, 'id'));
foreach ($favoriten as &$favorit) {
    $shopId = (int)$favorit['id'];
    $rows = $openingHoursMap[$shopId] ?? [];
    $note = $favorit['opening_hours_note'] ?? null;
    if (empty($rows) && !empty($favorit['openingHours'])) {
        $parsed = parse_legacy_opening_hours($favorit['openingHours']);
        $rows = $parsed['rows'];
        if ($note === null && $parsed['note']) {
            $note = $parsed['note'];
        }
    }
    $favorit['openingHoursStructured'] = build_structured_opening_hours($rows, $note);
    $favorit['is_open_now'] = is_shop_open($rows, null, $favorit['status'] ?? null);
}
unset($favorit);

echo json_encode($favoriten);

?>
