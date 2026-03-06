<?php
require_once  __DIR__ . '/../db_connect.php';

function generateInviteCode($length = 10) {
    return bin2hex(random_bytes($length / 2)); // z. B. "f8c21a90d3"
}

// Nutzer ohne Invite-Code laden
$stmt = $pdo->query("SELECT id FROM nutzer WHERE invite_code IS NULL");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $user) {
    $codeValid = false;
    while (!$codeValid) {
        $code = generateInviteCode();
        // sicherstellen, dass der Code noch nicht vergeben ist
        $check = $pdo->prepare("SELECT id FROM nutzer WHERE invite_code = ?");
        $check->execute([$code]);
        if ($check->rowCount() === 0) {
            $codeValid = true;
        }
    }

    $update = $pdo->prepare("UPDATE nutzer SET invite_code = ? WHERE id = ?");
    $update->execute([$code, $user['id']]);
}

echo "Invite-Codes erfolgreich generiert.\n";
?>