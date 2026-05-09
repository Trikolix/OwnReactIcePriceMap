<?php
require_once  __DIR__ . '/../db_connect.php';
require_once  __DIR__ . '/../lib/auth.php';

function issueLoginResponse(PDO $pdo, array $user, string $inputPassword): array {
    if ($user['is_verified'] !== 1) {
        return ['status' => 'error', 'message' => 'Dein Benutzeraccount ist noch nicht bestätigt.'];
    }

    if (!password_verify($inputPassword, $user['password_hash'])) {
        return ['status' => 'error', 'message' => 'Falsches Passwort'];
    }

    $tokenData = generateAuthToken($pdo, (int)$user['id']);

    setcookie(
        AUTH_COOKIE_NAME,
        $tokenData['token'],
        [
            'expires'  => strtotime($tokenData['expires_at']),
            'path'     => '/',
            'secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]
    );

    return [
        'status'      => 'success',
        'userId'      => (int)$user['id'],
        'username'    => $user['username'],
        'currentLevel'=> (int)($user['current_level'] ?? 0),
        'token'       => $tokenData['token'],
        'expires_at'  => $tokenData['expires_at'],
    ];
}

function checkLogin(PDO $pdo, string $inputUsername, string $inputPassword): array {
    $stmt = $pdo->prepare("SELECT id, username, password_hash, is_verified, deletion_requested_at, current_level FROM nutzer WHERE username = :login OR email = :login LIMIT 1");
    $stmt->bindParam(':login', $inputUsername, PDO::PARAM_STR);
    $stmt->execute();

    $user = $stmt->fetch();

    if (!$user) {
        return ['status' => 'error', 'message' => "Benutzername \"$inputUsername\" nicht gefunden"];
    }

    if (!empty($user['deletion_requested_at'])) {
        return [
            'status' => 'error', 
            'message' => 'Dieser Account wurde zur Löschung markiert. Bitte kontaktiere den Support, falls du dies rückgängig machen möchtest.'
        ];
    }

    return issueLoginResponse($pdo, $user, $inputPassword);
}

$input = json_decode(file_get_contents("php://input"), true);
if (!is_array($input)) {
    iceapp_log_event('login_failed', ['reason' => 'invalid_json']);
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ungültige JSON Daten.']);
    exit;
}
$inputUsername = $input['username'] ?? '';
$inputPassword = $input['password'] ?? '';

$result = checkLogin($pdo, $inputUsername, $inputPassword);
if (($result['status'] ?? '') === 'success') {
    iceapp_log_event('login_success', [
        'user_id' => (int) ($result['userId'] ?? 0),
        'login_hash' => iceapp_hash_for_log($inputUsername),
    ]);
} else {
    $reasonMessage = (string) ($result['message'] ?? '');
    $reason = 'unknown';
    if (strpos($reasonMessage, 'nicht gefunden') !== false) {
        $reason = 'user_not_found';
    } elseif (strpos($reasonMessage, 'Falsches Passwort') !== false) {
        $reason = 'wrong_password';
    } elseif (strpos($reasonMessage, 'noch nicht bestätigt') !== false) {
        $reason = 'account_unverified';
    } elseif (strpos($reasonMessage, 'Löschung') !== false) {
        $reason = 'deletion_requested';
    }

    iceapp_log_event('login_failed', [
        'reason' => $reason,
        'login_hash' => iceapp_hash_for_log($inputUsername),
    ]);
}
echo json_encode($result);
?>
