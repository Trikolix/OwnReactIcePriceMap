<?php
declare(strict_types=1);

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/opening_hours.php';

$isCli = php_sapi_name() === 'cli';
$stderrHandle = defined('STDERR') ? STDERR : fopen('php://output', 'w');

if (!$isCli) {
    header('Content-Type: text/plain; charset=utf-8');
    if (!isset($_GET['confirm']) || $_GET['confirm'] !== '1') {
        fwrite($stderrHandle, "Sicherheitsabbruch: Bitte rufe das Skript mit ?confirm=1 auf.\n");
        exit(1);
    }
}

if ($isCli) {
    $options = getopt('', ['dry-run', 'shop::', 'limit::']);
    $dryRun = array_key_exists('dry-run', $options);
    $shopSource = $options['shop'] ?? null;
    $limit = isset($options['limit']) ? max(1, (int)$options['limit']) : null;
} else {
    $dryRun = isset($_GET['dryRun']) && $_GET['dryRun'] === '1';
    $shopSource = $_GET['shop'] ?? null;
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : null;
}

$shopFilter = [];
if (!empty($shopSource)) {
    $shopFilter = array_values(array_unique(array_filter(array_map('intval', explode(',', (string)$shopSource)))));
}

$sql = 'SELECT id, openingHours, opening_hours_note FROM eisdielen';
$params = [];
if (!empty($shopFilter)) {
    $placeholders = implode(',', array_fill(0, count($shopFilter), '?'));
    $sql .= " WHERE id IN ($placeholders)";
    $params = $shopFilter;
}
if ($limit !== null) {
    $sql .= ' ORDER BY id ASC LIMIT ' . (int)$limit;
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$shops = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (!$shops) {
    fwrite($stderrHandle, "Keine passenden Eisdielen gefunden.\n");
    exit(0);
}

$migrated = 0;
$skipped = 0;

foreach ($shops as $shop) {
    $shopId = (int)$shop['id'];
    $legacyText = (string)($shop['openingHours'] ?? '');
    $existingNote = $shop['opening_hours_note'] ?? null;

    $parsed = parse_legacy_opening_hours($legacyText);
    $rows = $parsed['rows'];
    $note = $existingNote ?: ($parsed['note'] ?? null);

    if (empty($rows) && trim($legacyText) !== '') {
        // Fallback: alles als Hinweis speichern
        $note = trim($legacyText);
    }

    $display = build_opening_hours_display($rows, $note);

    if ($dryRun) {
        printf(
            "[DRY-RUN] #%d: %d Zeitfenster%s%s\n",
            $shopId,
            count($rows),
            $note ? ", Hinweis: {$note}" : '',
            $display ? " → {$display}" : ''
        );
        $migrated++;
        continue;
    }

    $pdo->beginTransaction();
    try {
        replace_opening_hours($pdo, $shopId, $rows);
        $update = $pdo->prepare("
            UPDATE eisdielen
            SET openingHours = :text,
                opening_hours_note = :note
            WHERE id = :id
        ");
        $update->execute([
            ':text' => $display,
            ':note' => $note,
            ':id' => $shopId,
        ]);
        $pdo->commit();
        $migrated++;
    } catch (Throwable $e) {
        $pdo->rollBack();
        $skipped++;
        fwrite($stderrHandle, sprintf("Migration für #%d fehlgeschlagen: %s\n", $shopId, $e->getMessage()));
    }
}

printf(
    "Fertig. %d Eisdielen migriert, %d übersprungen.%s\n",
    $migrated,
    $skipped,
    $dryRun ? ' (Dry-Run)' : ''
);
