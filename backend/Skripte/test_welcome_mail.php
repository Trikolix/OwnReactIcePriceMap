<?php

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    echo "Dieses Skript darf nur per CLI ausgeführt werden.\n";
    exit(1);
}

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/welcome_mail.php';

$options = getopt('', [
    'user::',
    'to::',
]);

$userId = isset($options['user']) ? (int) $options['user'] : 1;
$to = trim((string) ($options['to'] ?? 'ch_helbig@mail.de'));

if ($userId <= 0) {
    fwrite(STDERR, "Ungueltige userId.\n");
    exit(1);
}

if ($to === '' || filter_var($to, FILTER_VALIDATE_EMAIL) === false) {
    fwrite(STDERR, "Ungueltige Empfaengeradresse.\n");
    exit(1);
}

$stmt = $pdo->prepare("
    SELECT id, username, email, invite_code
    FROM nutzer
    WHERE id = ?
    LIMIT 1
");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    fwrite(STDERR, "Kein Nutzer mit ID {$userId} gefunden.\n");
    exit(1);
}

$sent = iceapp_send_welcome_mail($to, $user);

if ($sent) {
    echo "Welcome-Mail wurde an {$to} uebergeben. Kontext: userId={$user['id']}, username={$user['username']}.\n";
    exit(0);
}

fwrite(STDERR, "mail() hat false zurueckgegeben. Bitte Mailserver/sendmail-Konfiguration pruefen.\n");
exit(1);
