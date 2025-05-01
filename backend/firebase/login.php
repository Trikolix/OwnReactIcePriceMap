<?php
require_once 'firebase.php';
require_once '../db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);
$idToken = $data['idToken'];

try {
    $verifiedIdToken = $auth->verifyIdToken($idToken);
    $email = $verifiedIdToken->getClaim('email');

    $stmt = $pdo->prepare("SELECT id, username FROM nutzer WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["error" => "Kein passender SQL-Nutzer gefunden"]);
        exit;
    }

    // Session o. Ä. starten
    session_start();
    $_SESSION['user_id'] = $user['id'];

    echo json_encode(["status" => "success", "username" => $user['username']]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
