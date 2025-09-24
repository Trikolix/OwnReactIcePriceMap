<?php
require_once  __DIR__ . '/../db_connect.php';

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$users = [];

if ($q !== '') {

    // is there an @ in the query?
    $hasAtSymbol = strpos($q, '@') !== false;

    if ($hasAtSymbol) {
        // search for username and email
        $stmt = $pdo->prepare("
            SELECT id, username, email
            FROM nutzer
            WHERE username LIKE :q
               OR email LIKE :q
            LIMIT 10
        ");
        $stmt->execute([ ':q' => "%$q%" ]);
    } else {
        // search only for username
        $stmt = $pdo->prepare("
            SELECT id, username, email
            FROM nutzer
            WHERE username LIKE :q
            LIMIT 10
        ");
        $stmt->execute([ ':q' => "%$q%" ]);
    }
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

echo json_encode($users);
?>