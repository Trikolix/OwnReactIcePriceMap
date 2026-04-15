<?php
require_once  __DIR__ . '/../db_connect.php';
require_once  __DIR__ . '/../lib/opening_hours.php';

$nutzer_id = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : 0;

if ($nutzer_id <= 0) {
    echo json_encode(["error" => "Ungültige Nutzer-ID"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            c.*,
            e.id AS shop_id,
            e.name AS shop_name,
            e.adresse AS shop_address,
            e.latitude AS shop_lat,
            e.longitude AS shop_lon,
            e.openingHours,
            e.opening_hours_note,
            e.status
        FROM challenges c
        JOIN eisdielen e ON c.eisdiele_id = e.id
        WHERE c.nutzer_id = :nutzer_id
          AND (c.valid_until > NOW()
          OR c.`completed`)
        ORDER BY c.completed_at DESC, c.valid_until ASC
    ");
    $stmt->execute(['nutzer_id' => $nutzer_id]);
    $challenges = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $openingHoursMap = fetch_opening_hours_map($pdo, array_column($challenges, 'shop_id'));
    foreach ($challenges as &$challenge) {
        $shopId = (int)($challenge['shop_id'] ?? 0);
        $rows = $openingHoursMap[$shopId] ?? [];
        $note = $challenge['opening_hours_note'] ?? null;
        if (empty($rows) && !empty($challenge['openingHours'])) {
            $parsed = parse_legacy_opening_hours($challenge['openingHours']);
            $rows = $parsed['rows'];
            if ($note === null && $parsed['note']) {
                $note = $parsed['note'];
            }
        }
        $challenge['openingHoursStructured'] = build_structured_opening_hours($rows, $note);
        $challenge['opening_hours_note'] = $note;
        $challenge['is_open_now'] = is_shop_open($rows, null, $challenge['status'] ?? null);
    }
    unset($challenge);

    echo json_encode($challenges);
} catch (PDOException $e) {
    echo json_encode([
        "error" => "DB-Fehler beim Laden der Challenges",
        "details" => $e->getMessage()
    ]);
}
?>
