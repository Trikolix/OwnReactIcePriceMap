<?php
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = intval($input['user_id'] ?? $input['nutzer_id'] ?? 0);
$shopId = intval($input['shop_id'] ?? 0);

if ($userId <= 0 || $shopId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'user_id und shop_id sind erforderlich']);
    exit;
}

date_default_timezone_set('Europe/Berlin');
$periodStart = '2026-02-28 00:00:00';
$periodEnd = '2026-03-22 23:59:59';
$cooldownHours = 3;
$now = new DateTime('now');
$startDate = new DateTime($periodStart);
$endDate = new DateTime($periodEnd);

if ($now < $startDate || $now > $endDate) {
    echo json_encode([
        'success' => false,
        'in_period' => false,
        'message' => 'Geschenke auf der Karte sind aktuell nicht aktiv.',
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT MAX(discovered_at)
         FROM birthday_easter_eggs
         WHERE user_id = :user_id
           AND discovered_at BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $latestDiscoveryRaw = $stmt->fetchColumn();

    if ($latestDiscoveryRaw) {
        $nextAvailable = new DateTime($latestDiscoveryRaw);
        $nextAvailable->modify("+{$cooldownHours} hours");
        if ($now < $nextAvailable) {
            $remainingSeconds = $nextAvailable->getTimestamp() - $now->getTimestamp();
            echo json_encode([
                'success' => false,
                'in_period' => true,
                'cooldown_active' => true,
                'next_available_at' => $nextAvailable->format('Y-m-d H:i:s'),
                'remaining_seconds' => max(0, $remainingSeconds),
                'message' => 'Neues Geschenk erst nach Cooldown verfügbar.',
            ]);
            exit;
        }
    }

    $stmt = $pdo->prepare(
        "INSERT INTO birthday_easter_eggs (user_id, shop_id, discovered_at)
         VALUES (:user_id, :shop_id, NOW())
         ON DUPLICATE KEY UPDATE discovered_at = discovered_at"
    );
    $stmt->execute(['user_id' => $userId, 'shop_id' => $shopId]);
    $newlyDiscovered = $stmt->rowCount() > 0;

    $stmt = $pdo->prepare(
        "SELECT COUNT(DISTINCT shop_id)
         FROM birthday_easter_eggs
         WHERE user_id = :user_id
           AND discovered_at BETWEEN :start AND :end"
    );
    $stmt->execute(['user_id' => $userId, 'start' => $periodStart, 'end' => $periodEnd]);
    $found = (int)$stmt->fetchColumn();

    $nextAvailable = (new DateTime('now'))->modify("+{$cooldownHours} hours");

    echo json_encode([
        'success' => true,
        'in_period' => true,
        'newly_discovered' => $newlyDiscovered,
        'easter_eggs_found' => $found,
        'target_reached' => $found >= 3,
        'cooldown_active' => true,
        'next_available_at' => $nextAvailable->format('Y-m-d H:i:s'),
        'cooldown_hours' => $cooldownHours,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
