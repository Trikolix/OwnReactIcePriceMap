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
        'token'       => $tokenData['token'],
        'expires_at'  => $tokenData['expires_at'],
    ];
}

function checkLogin(PDO $pdo, string $inputUsername, string $inputPassword): array {
    $stmt = $pdo->prepare("SELECT id, username, password_hash, is_verified FROM nutzer WHERE username = :login OR email = :login LIMIT 1");
    $stmt->bindParam(':login', $inputUsername, PDO::PARAM_STR);
    $stmt->execute();

    $user = $stmt->fetch();

    if (!$user) {
        return ['status' => 'error', 'message' => "Benutzername \"$inputUsername\" nicht gefunden"];
    }

    return issueLoginResponse($pdo, $user, $inputPassword);
}

$input = json_decode(file_get_contents("php://input"), true);
$inputUsername = $input['username'] ?? '';
$inputPassword = $input['password'] ?? '';

$result = checkLogin($pdo, $inputUsername, $inputPassword);
echo json_encode($result);
?>
