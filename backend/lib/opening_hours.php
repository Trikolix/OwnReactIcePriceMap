<?php
declare(strict_types=1);

const OPENING_HOURS_DEFAULT_TIMEZONE = 'Europe/Berlin';
const OPENING_HOURS_DAY_LABELS = [
    1 => 'Mo',
    2 => 'Di',
    3 => 'Mi',
    4 => 'Do',
    5 => 'Fr',
    6 => 'Sa',
    7 => 'So',
];

const OPENING_HOURS_DAY_NAMES = [
    1 => 'Montag',
    2 => 'Dienstag',
    3 => 'Mittwoch',
    4 => 'Donnerstag',
    5 => 'Freitag',
    6 => 'Samstag',
    7 => 'Sonntag',
];

/**
 * Parsed the optional open_at parameter (expects ISO8601 or datetime-local) into a DateTimeImmutable.
 */
function parse_opening_hours_reference(?string $value): ?\DateTimeImmutable
{
    if ($value === null) {
        return null;
    }
    $trimmed = trim($value);
    if ($trimmed === '') {
        return null;
    }

    $timezone = new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE);
    $formats = [
        \DateTimeInterface::ATOM,
        'Y-m-d\TH:i:s',
        'Y-m-d\TH:i',
        'Y-m-d H:i:s',
        'Y-m-d H:i',
        'Y-m-d',
    ];

    foreach ($formats as $format) {
        $dt = \DateTimeImmutable::createFromFormat($format, $trimmed, $timezone);
        if ($dt instanceof \DateTimeImmutable) {
            if ($format === 'Y-m-d') {
                return $dt->setTime(12, 0);
            }
            return $dt;
        }
    }

    $timestamp = strtotime($trimmed);
    if ($timestamp !== false) {
        return (new \DateTimeImmutable('@' . $timestamp))->setTimezone($timezone);
    }

    return null;
}

/**
 * Brings a structured opening-hours payload (coming from the frontend) into a normalized list of DB rows.
 *
 * @return array{rows: array<int, array{weekday:int, opens_at:string, closes_at:string, overnight:int, sort_order:int}>, note: ?string, timezone: string}
 */
function normalize_structured_opening_hours(?array $payload): array
{
    $rows = [];
    $note = null;
    $timezone = OPENING_HOURS_DEFAULT_TIMEZONE;

    if (!is_array($payload)) {
        return ['rows' => $rows, 'note' => $note, 'timezone' => $timezone];
    }

    if (!empty($payload['timezone']) && is_string($payload['timezone'])) {
        $timezone = $payload['timezone'];
    }

    if (isset($payload['note'])) {
        $noteString = trim((string)$payload['note']);
        $note = $noteString !== '' ? $noteString : null;
    }

    $daysPayload = $payload['days'] ?? [];
    if (!is_array($daysPayload)) {
        $daysPayload = [];
    }

    $sortOrder = 0;
    foreach ($daysPayload as $dayPayload) {
        if (!is_array($dayPayload)) {
            continue;
        }
        $weekday = isset($dayPayload['weekday']) ? (int)$dayPayload['weekday'] : 0;
        if ($weekday < 1 || $weekday > 7) {
            continue;
        }
        $ranges = $dayPayload['ranges'] ?? [];
        if (!is_array($ranges)) {
            continue;
        }
        foreach ($ranges as $range) {
            if (!is_array($range)) {
                continue;
            }
            $open = normalize_time_token($range['open'] ?? null);
            $close = normalize_time_token($range['close'] ?? null);
            if (!$open || !$close) {
                continue;
            }
            $overnight = array_key_exists('overnight', $range) ? (bool)$range['overnight'] : ($close <= $open);
            $rows[] = [
                'weekday' => $weekday,
                'opens_at' => $open,
                'closes_at' => $close,
                'overnight' => $overnight ? 1 : 0,
                'sort_order' => $sortOrder++,
            ];
        }
    }

    return [
        'rows' => $rows,
        'note' => $note,
        'timezone' => $timezone,
    ];
}

/**
 * Converts common time notations such as "9", "9.30", "9:30" or "09 Uhr" into HH:MM:SS.
 */
function normalize_time_token($value): ?string
{
    if (!is_string($value) && !is_numeric($value)) {
        return null;
    }
    $raw = trim((string)$value);
    if ($raw === '') {
        return null;
    }

    $raw = str_ireplace(['uhr', 'h'], '', $raw);
    $raw = trim($raw);
    $raw = str_replace(',', ':', $raw);
    if (substr_count($raw, '.') === 1 && strpos($raw, ':') === false) {
        $raw = str_replace('.', ':', $raw);
    } else {
        $raw = str_replace('.', '', $raw);
    }

    if (!str_contains($raw, ':')) {
        $digits = preg_replace('/\D+/', '', $raw);
        if ($digits === '') {
            return null;
        }
        if (strlen($digits) > 2) {
            $minute = (int)substr($digits, -2);
            $hour = (int)substr($digits, 0, -2);
        } else {
            $hour = (int)$digits;
            $minute = 0;
        }
    } else {
        [$hourToken, $minuteToken] = array_pad(explode(':', $raw, 2), 2, '0');
        $hour = (int)preg_replace('/\D+/', '', $hourToken);
        $minute = (int)preg_replace('/\D+/', '', $minuteToken);
    }

    $hour = max(0, min(23, $hour));
    $minute = max(0, min(59, $minute));

    return sprintf('%02d:%02d:00', $hour, $minute);
}

/**
 * Persists opening hours for a shop (delete + insert rows).
 */
function replace_opening_hours(\PDO $pdo, int $shopId, array $rows): void
{
    $pdo->prepare('DELETE FROM eisdiele_opening_hours WHERE eisdiele_id = :id')->execute([':id' => $shopId]);
    if (empty($rows)) {
        return;
    }

    $insert = $pdo->prepare("
        INSERT INTO eisdiele_opening_hours (eisdiele_id, weekday, opens_at, closes_at, overnight, sort_order)
        VALUES (:eisdiele_id, :weekday, :opens_at, :closes_at, :overnight, :sort_order)
    ");
    foreach ($rows as $row) {
        $insert->execute([
            ':eisdiele_id' => $shopId,
            ':weekday' => $row['weekday'],
            ':opens_at' => $row['opens_at'],
            ':closes_at' => $row['closes_at'],
            ':overnight' => $row['overnight'] ?? 0,
            ':sort_order' => $row['sort_order'] ?? 0,
        ]);
    }
}

/**
 * Fetches raw rows for one shop.
 *
 * @return array<int, array{weekday:int, opens_at:string, closes_at:string, overnight:int}>
 */
function fetch_opening_hours_rows(\PDO $pdo, int $shopId): array
{
    $stmt = $pdo->prepare("
        SELECT weekday, opens_at, closes_at, overnight, sort_order
        FROM eisdiele_opening_hours
        WHERE eisdiele_id = :id
        ORDER BY weekday ASC, sort_order ASC, opens_at ASC
    ");
    $stmt->execute([':id' => $shopId]);
    return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
}

/**
 * Fetches raw rows for multiple shops and returns a map [shopId => rows[]].
 */
function fetch_opening_hours_map(\PDO $pdo, array $shopIds): array
{
    $shopIds = array_values(array_unique(array_filter(array_map('intval', $shopIds))));
    if (empty($shopIds)) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($shopIds), '?'));
    $stmt = $pdo->prepare("
        SELECT eisdiele_id, weekday, opens_at, closes_at, overnight, sort_order
        FROM eisdiele_opening_hours
        WHERE eisdiele_id IN ($placeholders)
        ORDER BY eisdiele_id ASC, weekday ASC, sort_order ASC, opens_at ASC
    ");
    $stmt->execute($shopIds);
    $map = [];
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $shopId = (int)$row['eisdiele_id'];
        unset($row['eisdiele_id']);
        if (!isset($map[$shopId])) {
            $map[$shopId] = [];
        }
        $map[$shopId][] = $row;
    }
    return $map;
}

/**
 * Converts DB rows into the structured payload shared with the frontend.
 */
function build_structured_opening_hours(array $rows, ?string $note = null, string $timezone = OPENING_HOURS_DEFAULT_TIMEZONE): array
{
    $days = [];
    foreach ($rows as $row) {
        $weekday = (int)$row['weekday'];
        if ($weekday < 1 || $weekday > 7) {
            continue;
        }
        if (!isset($days[$weekday])) {
            $days[$weekday] = [
                'weekday' => $weekday,
                'label' => OPENING_HOURS_DAY_NAMES[$weekday] ?? ('Tag ' . $weekday),
                'abbr' => OPENING_HOURS_DAY_LABELS[$weekday] ?? (string)$weekday,
                'ranges' => [],
            ];
        }
        $days[$weekday]['ranges'][] = [
            'open' => substr($row['opens_at'], 0, 5),
            'close' => substr($row['closes_at'], 0, 5),
            'overnight' => (bool)$row['overnight'],
        ];
    }
    ksort($days);

    return [
        'timezone' => $timezone,
        'note' => $note,
        'days' => array_values($days),
    ];
}

/**
 * Builds a compact human-readable representation (used for legacy text column).
 */
function build_opening_hours_display(array $rows, ?string $note = null): string
{
    if (empty($rows) && !$note) {
        return '';
    }

    $perDay = [];
    foreach ($rows as $row) {
        $weekday = (int)$row['weekday'];
        $rangeText = sprintf(
            '%s-%s',
            substr($row['opens_at'], 0, 5),
            substr($row['closes_at'], 0, 5)
        );
        if (!isset($perDay[$weekday])) {
            $perDay[$weekday] = [];
        }
        $perDay[$weekday][] = $rangeText . ((int)$row['overnight'] === 1 ? ' (↦)' : '');
    }

    $grouped = [];
    foreach ($perDay as $weekday => $ranges) {
        $key = implode(' | ', $ranges);
        if (!isset($grouped[$key])) {
            $grouped[$key] = [
                'days' => [],
                'text' => implode(', ', $ranges),
            ];
        }
        $grouped[$key]['days'][] = $weekday;
    }

    $lines = [];
    foreach ($grouped as $group) {
        $dayLabel = format_day_set($group['days']);
        $timeLabel = str_replace(' (↦)', ' ⤷', $group['text']);
        $lines[] = sprintf('%s: %s', $dayLabel, $timeLabel);
    }

    if ($note) {
        $lines[] = 'Hinweis: ' . $note;
    }

    return implode('; ', $lines);
}

/**
 * Formats a sorted list of day numbers into "Mo-Fr, So".
 */
function format_day_set(array $days): string
{
    sort($days);
    $ranges = [];
    $start = null;
    $previous = null;
    foreach ($days as $day) {
        if ($start === null) {
            $start = $day;
            $previous = $day;
            continue;
        }
        if ($day === $previous + 1) {
            $previous = $day;
            continue;
        }
        $ranges[] = [$start, $previous];
        $start = $day;
        $previous = $day;
    }
    if ($start !== null) {
        $ranges[] = [$start, $previous];
    }

    $labels = [];
    foreach ($ranges as [$rangeStart, $rangeEnd]) {
        $startLabel = OPENING_HOURS_DAY_LABELS[$rangeStart] ?? (string)$rangeStart;
        if ($rangeStart === $rangeEnd) {
            $labels[] = $startLabel;
        } else {
            $endLabel = OPENING_HOURS_DAY_LABELS[$rangeEnd] ?? (string)$rangeEnd;
            $labels[] = "{$startLabel}-{$endLabel}";
        }
    }

    return implode(', ', $labels);
}

/**
 * Detects which shops are currently open (server timezone aware).
 *
 * @return int[]
 */
function get_open_shop_ids(\PDO $pdo, ?\DateTimeInterface $moment = null, array $statusMap = []): array
{
    $moment = $moment
        ? \DateTimeImmutable::createFromInterface($moment)
        : new \DateTimeImmutable('now', new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));

    $local = $moment->setTimezone(new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));
    $weekday = (int)$local->format('N'); // 1 (Mon) - 7 (Sun)
    $prevWeekday = $weekday === 1 ? 7 : $weekday - 1;
    $time = $local->format('H:i:s');

    $stmt = $pdo->prepare("
        SELECT DISTINCT eoh.eisdiele_id, e.status, e.reopening_date, e.closing_date
        FROM eisdiele_opening_hours eoh
        JOIN eisdielen e ON eoh.eisdiele_id = e.id
        WHERE (
            (weekday = :weekday AND overnight = 0 AND :time >= opens_at AND :time < closes_at)
            OR
            (weekday = :weekday AND overnight = 1 AND :time >= opens_at)
            OR
            (weekday = :prevWeekday AND overnight = 1 AND :time < closes_at)
        )
    ");
    $stmt->execute([
        ':weekday' => $weekday,
        ':prevWeekday' => $prevWeekday,
        ':time' => $time,
    ]);
    $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $openIds = [];
    foreach ($rows as $row) {
        $shopId = (int)$row['eisdiele_id'];
        $status = $statusMap[$shopId] ?? $row['status'] ?? 'open';
        $reopeningDate = $row['reopening_date'] ?? null;
        $closingDate = $row['closing_date'] ?? null;
        $momentCheck = $moment
            ? \DateTimeImmutable::createFromInterface($moment)
            : new \DateTimeImmutable('now', new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));

        // Wenn permanent geschlossen, immer überspringen
        if ($status === 'permanent_closed') {
            continue;
        }

        // Wenn closing_date und reopening_date gesetzt sind, prüfe ob Zeitpunkt dazwischen liegt
        if ($closingDate && $reopeningDate) {
            $close = \DateTimeImmutable::createFromFormat('Y-m-d', $closingDate, new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));
            $reopen = \DateTimeImmutable::createFromFormat('Y-m-d', $reopeningDate, new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));
            if ($close && $reopen && $momentCheck >= $close && $momentCheck < $reopen) {
                continue; // Shop ist zwischen closing_date und reopening_date geschlossen
            }
        }

        // Wenn status seasonal_closed, aber reopening_date ist erreicht, Shop als offen behandeln
        if ($status === 'seasonal_closed') {
            if ($reopeningDate) {
                $reopen = \DateTimeImmutable::createFromFormat('Y-m-d', $reopeningDate, new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));
                if (!$reopen || $reopen > $momentCheck) {
                    continue;
                }
                // reopening_date ist erreicht, Shop gilt als offen
            } else {
                continue;
            }
        }

        $openIds[] = $shopId;
    }
    return array_values(array_unique($openIds));
}

/**
 * Returns true if a shop is open at the given moment.
 *
 * @param array<int, array{weekday:int, opens_at:string, closes_at:string, overnight:int}> $rows
 */
function is_shop_open(array $rows, ?\DateTimeInterface $moment = null, ?string $status = null): bool
{
    if ($status === 'seasonal_closed') {
        // Prüfe, ob reopening_date vor dem abzufragenden Zeitpunkt liegt
        // Annahme: reopening_date ist im $rows[0]['reopening_date'] oder als zusätzlicher Parameter verfügbar
        $reopeningDate = null;
        if (isset($rows[0]['reopening_date'])) {
            $reopeningDate = $rows[0]['reopening_date'];
        }
        // Alternativ: $reopeningDate als Parameter übergeben
        if ($reopeningDate) {
            $momentCheck = $moment
                ? \DateTimeImmutable::createFromInterface($moment)
                : new \DateTimeImmutable('now', new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));
            $reopen = \DateTimeImmutable::createFromFormat('Y-m-d', $reopeningDate, new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));
            if ($reopen && $reopen <= $momentCheck) {
                // Shop ist wieder offen
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    if ($status === 'permanent_closed') {
        return false;
    }
    $moment = $moment
        ? \DateTimeImmutable::createFromInterface($moment)
        : new \DateTimeImmutable('now', new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));

    $local = $moment->setTimezone(new \DateTimeZone(OPENING_HOURS_DEFAULT_TIMEZONE));
    $weekday = (int)$local->format('N');
    $time = $local->format('H:i:s');
    $nextWeekday = $weekday === 7 ? 1 : $weekday + 1;
    $prevWeekday = $weekday === 1 ? 7 : $weekday - 1;

    foreach ($rows as $row) {
        $rowDay = (int)$row['weekday'];
        $opensAt = $row['opens_at'];
        $closesAt = $row['closes_at'];
        $overnight = (int)$row['overnight'] === 1;

        if (!$overnight && $rowDay === $weekday) {
            if ($time >= $opensAt && $time < $closesAt) {
                return true;
            }
            continue;
        }

        if ($overnight) {
            // Span from rowDay until next day
            if ($rowDay === $weekday && $time >= $opensAt) {
                return true;
            }
            $rowNext = $rowDay === 7 ? 1 : $rowDay + 1;
            if ($rowNext === $weekday && $time < $closesAt) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Parses the legacy free-text opening hours string into structured rows (best effort).
 *
 * @return array{rows: array<int, array{weekday:int, opens_at:string, closes_at:string, overnight:int, sort_order:int}>, note: ?string, warnings: string[]}
 */
function parse_legacy_opening_hours(?string $text): array
{
    $rows = [];
    $notes = [];
    $warnings = [];
    $sort = 0;
    $raw = trim((string)$text);
    if ($raw === '') {
        return ['rows' => $rows, 'note' => null, 'warnings' => $warnings];
    }

    $normalized = str_replace(["\r\n", "\r"], "\n", $raw);
    $normalized = str_replace(['–', '—', 'bis'], ['-', '-', '-'], $normalized);

    if (preg_match('/24\\/?7|24h/i', $normalized)) {
        for ($day = 1; $day <= 7; $day++) {
            $rows[] = [
                'weekday' => $day,
                'opens_at' => '00:00:00',
                'closes_at' => '23:59:59',
                'overnight' => 0,
                'sort_order' => $sort++,
            ];
        }
        return ['rows' => $rows, 'note' => null, 'warnings' => $warnings];
    }

    $segments = preg_split('/[\\n;]+/', $normalized);
    foreach ($segments as $segment) {
        $segment = trim($segment);
        if ($segment === '') {
            continue;
        }
        if (!preg_match('/(mo|di|mi|do|fr|sa|so)/i', $segment)) {
            $notes[] = $segment;
            continue;
        }

        $parts = preg_split('/:\\s*/', $segment, 2);
        if (count($parts) < 2) {
            $notes[] = $segment;
            continue;
        }

        [$dayPart, $timePart] = $parts;
        $days = expand_day_part($dayPart);
        if (empty($days)) {
            $notes[] = $segment;
            continue;
        }

        $ranges = extract_time_ranges($timePart);
        if (empty($ranges)) {
            $notes[] = $segment;
            continue;
        }

        foreach ($days as $day) {
            foreach ($ranges as $range) {
                $rows[] = [
                    'weekday' => $day,
                    'opens_at' => $range['open'],
                    'closes_at' => $range['close'],
                    'overnight' => $range['overnight'] ? 1 : 0,
                    'sort_order' => $sort++,
                ];
            }
        }
    }

    $noteString = !empty($notes) ? implode('; ', array_unique($notes)) : null;
    return [
        'rows' => $rows,
        'note' => $noteString,
        'warnings' => $warnings,
    ];
}

/**
 * Expands "Mo-Fr & So" etc. into a list of weekday numbers.
 *
 * @return int[]
 */
function expand_day_part(string $dayPart): array
{
    $dayPart = mb_strtolower($dayPart, 'UTF-8');
    $dayPart = str_replace(['&', '/', '|'], ',', $dayPart);
    $dayPart = preg_replace('/\bund\b/u', ',', $dayPart);
    $tokens = preg_split('/[,]+/', $dayPart);
    if (!$tokens) {
        return [];
    }

    $map = [
        'montag' => 1, 'mo' => 1, 'monday' => 1,
        'dienstag' => 2, 'di' => 2, 'tue' => 2, 'dienstag' => 2,
        'mittwoch' => 3, 'mi' => 3, 'wed' => 3,
        'donnerstag' => 4, 'do' => 4, 'thu' => 4,
        'freitag' => 5, 'fr' => 5, 'fri' => 5,
        'samstag' => 6, 'sa' => 6, 'sat' => 6,
        'sonntag' => 7, 'so' => 7, 'sun' => 7,
    ];

    $days = [];
    foreach ($tokens as $token) {
        $token = trim($token);
        if ($token === '') {
            continue;
        }
        if (str_contains($token, '-')) {
            [$startToken, $endToken] = array_map('trim', explode('-', $token, 2));
            $start = $map[$startToken] ?? null;
            $end = $map[$endToken] ?? null;
            if ($start === null || $end === null) {
                continue;
            }
            if ($start <= $end) {
                for ($day = $start; $day <= $end; $day++) {
                    $days[] = $day;
                }
            } else {
                for ($day = $start; $day <= 7; $day++) {
                    $days[] = $day;
                }
                for ($day = 1; $day <= $end; $day++) {
                    $days[] = $day;
                }
            }
            continue;
        }
        if (isset($map[$token])) {
            $days[] = $map[$token];
        }
    }

    return array_values(array_unique($days));
}

/**
 * Extracts one or more time ranges from a string like "10-18 Uhr / 19-22 Uhr".
 *
 * @return array<int, array{open:string, close:string, overnight:bool}>
 */
function extract_time_ranges(string $timePart): array
{
    $timePart = str_replace(['–', '—'], '-', $timePart);
    $timePart = str_replace(['ab '], '', $timePart);
    $timePart = str_replace('Uhr', '', $timePart);
    $timePart = trim($timePart);

    $ranges = [];
    $matches = [];
    if (preg_match_all('/(\d{1,2}(?:[:.]\d{1,2})?|\d{3,4})\s*-\s*(\d{1,2}(?:[:.]\d{1,2})?|\d{3,4})/u', $timePart, $matches, PREG_SET_ORDER)) {
        foreach ($matches as $match) {
            $open = normalize_time_token($match[1]);
            $close = normalize_time_token($match[2]);
            if (!$open || !$close) {
                continue;
            }
            $ranges[] = [
                'open' => $open,
                'close' => $close,
                'overnight' => $close <= $open,
            ];
        }
    }
    return $ranges;
}
