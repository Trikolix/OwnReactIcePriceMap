<?php
require_once __DIR__ . '/../db_connect.php';

header('Access-Control-Allow-Headers: Content-Type');

function respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'error' => 'Method not allowed']);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    respond(400, ['success' => false, 'error' => 'Invalid JSON payload']);
}

$email = filter_var($input['email'] ?? null, FILTER_VALIDATE_EMAIL);
$activityDate = $input['activity_date'] ?? null;

if (!$email) {
    respond(422, ['success' => false, 'error' => 'Valid email required']);
}

if (!is_string($activityDate)) {
    respond(422, ['success' => false, 'error' => 'activity_date must be ISO format (YYYY-MM-DD)']);
}

$date = DateTimeImmutable::createFromFormat('Y-m-d', $activityDate);
$errors = DateTimeImmutable::getLastErrors();
if (!$date || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))) {
    respond(422, ['success' => false, 'error' => 'activity_date must be ISO format (YYYY-MM-DD)']);
}

$startOfDay = $date->setTime(0, 0, 0);
$endOfDay = $startOfDay->modify('+1 day');

try {
    $stmtUser = $pdo->prepare('SELECT id, username, is_verified FROM nutzer WHERE email = :email LIMIT 1');
    $stmtUser->execute(['email' => $email]);
    $user = $stmtUser->fetch();

    if (!$user) {
        respond(200, [
            'success' => true,
            'data' => [
                'user_exists' => false,
                'checkins_count' => 0,
                'has_three_checkins' => false,
                'has_three_bike_checkins' => false,
                'checkins' => [],
            ],
        ]);
    }

    $stmtCheckins = $pdo->prepare(
        'SELECT id, datum, eisdiele_id, anreise, bild_url
         FROM checkins
         WHERE nutzer_id = :uid
           AND datum >= :start
           AND datum < :end
         ORDER BY datum ASC'
    );
    $stmtCheckins->execute([
        'uid' => $user['id'],
        'start' => $startOfDay->format('Y-m-d H:i:s'),
        'end'   => $endOfDay->format('Y-m-d H:i:s'),
    ]);
    $checkins = $stmtCheckins->fetchAll(PDO::FETCH_ASSOC);
    $bikeCheckinsCount = count(array_filter($checkins, static fn(array $row) => isset($row['anreise']) && strcasecmp($row['anreise'], 'Fahrrad') === 0));

    respond(200, [
        'success' => true,
        'data' => [
            'user_exists' => true,
            'user' => [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'is_verified' => (bool)$user['is_verified'],
            ],
            'checkins_count' => count($checkins),
            'has_three_checkins' => count($checkins) >= 3,
            'has_three_bike_checkins' => $bikeCheckinsCount >= 3,
            'checkins' => array_map(static fn(array $row) => [
                'id' => (int)$row['id'],
                'datetime' => $row['datum'],
                'eisdiele_id' => (int)$row['eisdiele_id'],
                'anreise' => $row['anreise'],
                'image_url' => $row['bild_url'],
            ], $checkins),
        ],
    ]);
} catch (Throwable $e) {
    error_log('Sachsendreier API error: ' . $e->getMessage());
    respond(500, ['success' => false, 'error' => 'Internal server error']);
}
