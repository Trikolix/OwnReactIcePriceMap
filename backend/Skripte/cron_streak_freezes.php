<?php
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/streaks.php';
$now = streakNow(); $lastId = 0; $failed = 0;
do {
    $q = $pdo->prepare('SELECT id FROM nutzer WHERE id>? ORDER BY id LIMIT 200'); $q->execute([$lastId]);
    $ids = $q->fetchAll(PDO::FETCH_COLUMN);
    foreach ($ids as $id) {
        $lastId = (int)$id;
        try { $pdo->beginTransaction(); streakReconcile($pdo,$lastId,$now); $pdo->commit(); }
        catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); error_log("Streak user $id: ".$e->getMessage()); $failed++; }
    }
} while (count($ids) === 200);
exit($failed ? 1 : 0);
