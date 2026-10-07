<?php
// Isolate delivery providers; preserve actual notification inserts and duplicate checks.
function ensurePushInfrastructureSchema(PDO $pdo): void {}
function createNotification(PDO $pdo, int $recipientId, string $type, int $referenceId, string $text, array $extraData = [], array $context = []): array {
    $stmt = $pdo->prepare('INSERT INTO benachrichtigungen (empfaenger_id, typ, referenz_id, text, zusatzdaten) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$recipientId, $type, $referenceId, $text, json_encode($extraData)]);
    return ['id' => (int)$pdo->lastInsertId()];
}
