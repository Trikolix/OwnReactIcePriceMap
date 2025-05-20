<?php
require_once  __DIR__ . '/../db_connect.php';

$sql = "DELETE FROM passwort_reset_tokens WHERE expires_at < NOW() OR used = 1";
$stmt = $pdo->prepare($sql);
$stmt->execute();

echo "Abgelaufene/benutzte Tokens wurden gelöscht.";

?>