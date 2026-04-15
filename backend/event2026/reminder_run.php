<?php
require_once __DIR__ . '/reminders.php';

function event2026_cli_arg_value(array $argv, string $name, $default = null)
{
    $prefix = '--' . $name . '=';
    foreach ($argv as $arg) {
        if (strpos($arg, $prefix) === 0) {
            return substr($arg, strlen($prefix));
        }
        if ($arg === '--' . $name) {
            return '1';
        }
    }
    return $default;
}

try {
    event2026_ensure_schema($pdo);

    $isCli = PHP_SAPI === 'cli';
    $dryRun = false;
    $kindParam = null;

    if ($isCli) {
        $kindParam = (string) event2026_cli_arg_value($argv ?? [], 'kind', '');
        $dryRun = in_array(strtolower((string) event2026_cli_arg_value($argv ?? [], 'dry-run', '0')), ['1', 'true', 'yes'], true);
    } else {
        if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'POST'], true)) {
            http_response_code(405);
            throw new RuntimeException('Methode nicht erlaubt.');
        }
        event2026_require_admin($pdo);
        $kindParam = trim((string) ($_REQUEST['kind'] ?? ''));
        $dryRun = in_array(strtolower(trim((string) ($_REQUEST['dry_run'] ?? '0'))), ['1', 'true', 'yes'], true);
    }

    $event = event2026_current_event($pdo);
    $kinds = $kindParam !== ''
        ? array_values(array_filter(array_map('trim', explode(',', $kindParam))))
        : event2026_automatic_reminder_kinds();

    if (empty($kinds)) {
        throw new InvalidArgumentException('Kein Reminder-Typ angegeben.');
    }

    $results = [];
    $totalCandidates = 0;
    $totalSent = 0;
    $totalFailed = 0;

    foreach ($kinds as $kind) {
        $run = event2026_run_reminder_kind($pdo, $event, $kind, $dryRun, false, null, 'cron');
        $results[] = $run;
        $totalCandidates += (int) $run['candidate_count'];
        $totalSent += (int) $run['sent_count'];
        $totalFailed += (int) $run['failed_count'];
    }

    $payload = [
        'status' => 'success',
        'dry_run' => $dryRun,
        'event' => [
            'id' => (int) $event['id'],
            'event_date' => $event['event_date'],
            'pre_event_trigger_date' => event2026_calculate_pre_event_trigger_date($event['event_date'] ?? null),
        ],
        'summary' => [
            'kinds' => count($results),
            'candidate_count' => $totalCandidates,
            'sent_count' => $totalSent,
            'failed_count' => $totalFailed,
        ],
        'results' => $results,
    ];

    if (!$isCli) {
        echo json_encode($payload);
        exit;
    }

    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
} catch (Throwable $e) {
    if (!headers_sent() && http_response_code() < 400) {
        http_response_code(400);
    }
    $payload = [
        'status' => 'error',
        'message' => $e->getMessage(),
    ];

    if (PHP_SAPI === 'cli') {
        fwrite(STDERR, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL);
        exit(1);
    }

    echo json_encode($payload);
}
