<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../lib/mail.php';

const EVENT2026_REMINDER_KIND_REGISTRATION_PAYMENT_14D = 'registration_payment_14d';
const EVENT2026_REMINDER_KIND_REGISTRATION_PAYMENT_PRE_EVENT = 'registration_payment_pre_event';
const EVENT2026_REMINDER_KIND_VOUCHER_UNUSED_7D = 'voucher_unused_7d';
const EVENT2026_REMINDER_KIND_VOUCHER_UNUSED_PRE_EVENT = 'voucher_unused_pre_event';
const EVENT2026_REMINDER_KIND_MANUAL_REGISTRATION_PAYMENT = 'manual_registration_payment';
const EVENT2026_REMINDER_KIND_MANUAL_UNUSED_VOUCHER = 'manual_unused_voucher';

function event2026_app_base_url(): string
{
    return 'https://ice-app.de';
}

function event2026_reminder_is_payment_kind(string $kind): bool
{
    return in_array($kind, [
        EVENT2026_REMINDER_KIND_REGISTRATION_PAYMENT_14D,
        EVENT2026_REMINDER_KIND_REGISTRATION_PAYMENT_PRE_EVENT,
        EVENT2026_REMINDER_KIND_MANUAL_REGISTRATION_PAYMENT,
    ], true);
}

function event2026_reminder_is_voucher_kind(string $kind): bool
{
    return in_array($kind, [
        EVENT2026_REMINDER_KIND_VOUCHER_UNUSED_7D,
        EVENT2026_REMINDER_KIND_VOUCHER_UNUSED_PRE_EVENT,
        EVENT2026_REMINDER_KIND_MANUAL_UNUSED_VOUCHER,
    ], true);
}

function event2026_automatic_reminder_kinds(): array
{
    return [
        EVENT2026_REMINDER_KIND_REGISTRATION_PAYMENT_14D,
        EVENT2026_REMINDER_KIND_REGISTRATION_PAYMENT_PRE_EVENT,
        EVENT2026_REMINDER_KIND_VOUCHER_UNUSED_7D,
        EVENT2026_REMINDER_KIND_VOUCHER_UNUSED_PRE_EVENT,
    ];
}

function event2026_reminder_group_for_kind(string $kind): ?string
{
    if (event2026_reminder_is_payment_kind($kind)) {
        return 'payment';
    }
    if (event2026_reminder_is_voucher_kind($kind)) {
        return 'voucher';
    }
    return null;
}

function event2026_format_event_date_de(?string $value): string
{
    if (!$value) {
        return '16. Mai 2026';
    }

    try {
        $date = new DateTimeImmutable($value);
    } catch (Throwable $e) {
        return (string) $value;
    }

    $months = [
        1 => 'Januar',
        2 => 'Februar',
        3 => 'Maerz',
        4 => 'April',
        5 => 'Mai',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'August',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Dezember',
    ];

    $month = $months[(int) $date->format('n')] ?? $date->format('m');
    return $date->format('j.') . ' ' . $month . ' ' . $date->format('Y');
}

function event2026_calculate_pre_event_trigger_date(?string $eventDate): ?string
{
    if (!$eventDate) {
        return null;
    }

    try {
        return (new DateTimeImmutable($eventDate))->modify('-7 days')->format('Y-m-d');
    } catch (Throwable $e) {
        return null;
    }
}

function event2026_safe_email(?string $email): ?string
{
    $normalized = trim((string) $email);
    if ($normalized === '' || !filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
        return null;
    }
    return $normalized;
}

function event2026_fetch_primary_registration_slot(PDO $pdo, int $registrationId): ?array
{
    $slotStmt = $pdo->prepare("SELECT id, full_name, email, user_id
        FROM event2026_participant_slots
        WHERE registration_id = :registration_id
        ORDER BY id ASC
        LIMIT 1");
    $slotStmt->execute([':registration_id' => $registrationId]);
    $slot = $slotStmt->fetch(PDO::FETCH_ASSOC);
    return $slot ?: null;
}

function event2026_fetch_registration_reminder_contact(PDO $pdo, int $registrationId): ?array
{
    $slot = event2026_fetch_primary_registration_slot($pdo, $registrationId);
    $slotName = trim((string) ($slot['full_name'] ?? ''));
    $slotEmail = event2026_safe_email($slot['email'] ?? null);
    $owner = event2026_fetch_registration_owner($pdo, $registrationId);
    $ownerEmail = event2026_safe_email($owner['email'] ?? null);
    if ($owner && $ownerEmail) {
        $ownerName = $slotName !== '' ? $slotName : trim((string) ($owner['username'] ?? ''));
        return [
            'email' => $ownerEmail,
            'name' => $ownerName !== '' ? $ownerName : 'Ice-Tour Teilnehmer',
            'user_id' => $owner['registered_by_user_id'] !== null ? (int) $owner['registered_by_user_id'] : null,
            'source' => $slotName !== '' ? 'slot+account' : 'account',
        ];
    }

    if (!$slot || !$slotEmail) {
        return null;
    }

    return [
        'email' => $slotEmail,
        'name' => $slotName !== '' ? $slotName : 'Ice-Tour Teilnehmer',
        'user_id' => $slot['user_id'] !== null ? (int) $slot['user_id'] : null,
        'source' => 'slot',
    ];
}

function event2026_fetch_addon_purchase_reminder_contact(PDO $pdo, int $addonPurchaseId): ?array
{
    $purchaseStmt = $pdo->prepare("SELECT registration_id FROM event2026_addon_purchases WHERE id = :id LIMIT 1");
    $purchaseStmt->execute([':id' => $addonPurchaseId]);
    $purchase = $purchaseStmt->fetch(PDO::FETCH_ASSOC);
    $contact = event2026_fetch_addon_purchase_contact($pdo, $addonPurchaseId);
    if (!$contact) {
        return null;
    }

    $email = event2026_safe_email($contact['email'] ?? null);
    if (!$email) {
        return null;
    }

    $name = '';
    $registrationId = $purchase && $purchase['registration_id'] !== null ? (int) $purchase['registration_id'] : 0;
    if ($registrationId > 0) {
        $registrationContact = event2026_fetch_registration_reminder_contact($pdo, $registrationId);
        $name = trim((string) ($registrationContact['name'] ?? ''));
    }
    if ($name === '') {
        $name = trim((string) ($contact['name'] ?? $contact['username'] ?? ''));
    }

    return [
        'email' => $email,
        'name' => $name !== '' ? $name : 'Ice-Tour Teilnehmer',
        'user_id' => $contact['user_id'] !== null ? (int) $contact['user_id'] : null,
        'source' => $registrationId > 0 && $name !== trim((string) ($contact['name'] ?? $contact['username'] ?? '')) ? 'registration+purchase' : 'purchase',
    ];
}

function event2026_reminder_mail_already_sent(PDO $pdo, int $eventId, string $entityType, int $entityId, string $reminderKind): bool
{
    $stmt = $pdo->prepare("SELECT id
        FROM event2026_reminder_mail_log
        WHERE event_id = :event_id
          AND entity_type = :entity_type
          AND entity_id = :entity_id
          AND reminder_kind = :reminder_kind
        LIMIT 1");
    $stmt->execute([
        ':event_id' => $eventId,
        ':entity_type' => $entityType,
        ':entity_id' => $entityId,
        ':reminder_kind' => $reminderKind,
    ]);

    return (bool) $stmt->fetchColumn();
}

function event2026_log_reminder_mail(
    PDO $pdo,
    int $eventId,
    string $entityType,
    int $entityId,
    string $recipientEmail,
    string $reminderKind,
    string $triggerSource,
    ?int $sentByUserId,
    string $mailSubject,
    ?array $meta = null
): void {
    $stmt = $pdo->prepare("INSERT INTO event2026_reminder_mail_log (
            event_id,
            entity_type,
            entity_id,
            recipient_email,
            reminder_kind,
            trigger_source,
            sent_by_user_id,
            mail_subject,
            meta_json
        ) VALUES (
            :event_id,
            :entity_type,
            :entity_id,
            :recipient_email,
            :reminder_kind,
            :trigger_source,
            :sent_by_user_id,
            :mail_subject,
            :meta_json
        )");
    $stmt->execute([
        ':event_id' => $eventId,
        ':entity_type' => $entityType,
        ':entity_id' => $entityId,
        ':recipient_email' => $recipientEmail,
        ':reminder_kind' => $reminderKind,
        ':trigger_source' => $triggerSource,
        ':sent_by_user_id' => $sentByUserId,
        ':mail_subject' => $mailSubject,
        ':meta_json' => $meta ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null,
    ]);
}

function event2026_build_registration_payment_reminder_candidates(PDO $pdo, array $event): array
{
    $eventId = (int) ($event['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT
            r.id,
            r.created_at,
            r.payment_reference_code,
            r.entry_fee_amount,
            r.gift_voucher_quantity,
            r.gift_voucher_purchase_amount,
            r.donation_amount,
            r.voucher_discount_amount,
            r.payment_status,
            p.expected_amount,
            p.paid_amount,
            p.status AS payment_status_detail
        FROM event2026_registrations r
        LEFT JOIN event2026_payments p ON p.registration_id = r.id
        WHERE r.event_id = :event_id
        ORDER BY r.created_at ASC, r.id ASC");
    $stmt->execute([':event_id' => $eventId]);

    $candidates = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $status = (string) ($row['payment_status_detail'] ?: $row['payment_status']);
        if (in_array($status, ['paid', 'cancelled'], true)) {
            continue;
        }

        $expectedAmount = $row['expected_amount'] !== null
            ? (float) $row['expected_amount']
            : max(
                0,
                (float) ($row['entry_fee_amount'] ?? 0)
                + (float) ($row['gift_voucher_purchase_amount'] ?? 0)
                + (float) ($row['donation_amount'] ?? 0)
                - (float) ($row['voucher_discount_amount'] ?? 0)
            );
        $paidAmount = (float) ($row['paid_amount'] ?? 0);
        $outstandingAmount = round(max(0, $expectedAmount - $paidAmount), 2);
        if ($outstandingAmount <= 0) {
            continue;
        }

        $contact = event2026_fetch_registration_reminder_contact($pdo, (int) $row['id']);
        if (!$contact) {
            continue;
        }

        $createdAt = (string) ($row['created_at'] ?? '');
        try {
            $createdDate = new DateTimeImmutable($createdAt);
        } catch (Throwable $e) {
            continue;
        }

        $candidates[] = [
            'entity_type' => 'registration',
            'entity_id' => (int) $row['id'],
            'recipient' => $contact,
            'registration_id' => (int) $row['id'],
            'payment_reference_code' => (string) $row['payment_reference_code'],
            'created_at' => $createdDate->format('Y-m-d H:i:s'),
            'created_at_date' => $createdDate->format('Y-m-d'),
            'expected_amount' => round($expectedAmount, 2),
            'paid_amount' => round($paidAmount, 2),
            'outstanding_amount' => $outstandingAmount,
            'gift_voucher_quantity' => (int) ($row['gift_voucher_quantity'] ?? 0),
            'status' => $status,
        ];
    }

    return $candidates;
}

function event2026_filter_registration_payment_candidates(
    PDO $pdo,
    array $event,
    string $reminderKind,
    bool $allowAlreadySent = false
): array {
    if (!event2026_reminder_is_payment_kind($reminderKind)) {
        throw new InvalidArgumentException('Ungueltiger Zahlungs-Reminder-Typ.');
    }

    $eventId = (int) ($event['id'] ?? 0);
    $today = new DateTimeImmutable('today');
    $preEventTriggerDate = event2026_calculate_pre_event_trigger_date($event['event_date'] ?? null);
    $eventDate = !empty($event['event_date']) ? new DateTimeImmutable((string) $event['event_date']) : null;
    $result = [];

    foreach (event2026_build_registration_payment_reminder_candidates($pdo, $event) as $candidate) {
        $matchesKind = false;
        if ($reminderKind === EVENT2026_REMINDER_KIND_MANUAL_REGISTRATION_PAYMENT) {
            $matchesKind = true;
        } elseif ($reminderKind === EVENT2026_REMINDER_KIND_REGISTRATION_PAYMENT_14D) {
            $createdDate = new DateTimeImmutable($candidate['created_at_date']);
            $matchesKind = $createdDate <= $today->modify('-14 days');
        } elseif ($reminderKind === EVENT2026_REMINDER_KIND_REGISTRATION_PAYMENT_PRE_EVENT) {
            $matchesKind = $preEventTriggerDate !== null
                && $today->format('Y-m-d') >= $preEventTriggerDate
                && ($eventDate === null || $today <= $eventDate);
        }

        if (!$matchesKind) {
            continue;
        }
        if (
            !$allowAlreadySent
            && event2026_reminder_mail_already_sent($pdo, $eventId, 'registration', (int) $candidate['entity_id'], $reminderKind)
        ) {
            continue;
        }

        $result[] = $candidate;
    }

    return $result;
}

function event2026_build_unused_voucher_reminder_candidates(PDO $pdo, array $event): array
{
    $eventId = (int) ($event['id'] ?? 0);

    $registrationStmt = $pdo->prepare("SELECT
            r.id,
            r.payment_reference_code,
            r.payment_status,
            p.status AS payment_status_detail,
            COUNT(v.id) AS open_voucher_count,
            MIN(v.created_at) AS oldest_open_voucher_at,
            GROUP_CONCAT(v.code_value ORDER BY v.id SEPARATOR '\n') AS open_codes
        FROM event2026_registrations r
        INNER JOIN event2026_gift_vouchers v
            ON v.event_id = r.event_id
           AND v.purchased_by_registration_id = r.id
           AND v.status = 'open'
           AND v.purchased_by_addon_purchase_id IS NULL
        LEFT JOIN event2026_payments p ON p.registration_id = r.id
        WHERE r.event_id = :event_id
        GROUP BY r.id, r.payment_reference_code, r.payment_status, p.status
        ORDER BY oldest_open_voucher_at ASC, r.id ASC");
    $registrationStmt->execute([':event_id' => $eventId]);

    $addonStmt = $pdo->prepare("SELECT
            ap.id,
            ap.registration_id,
            ap.payment_reference_code,
            ap.status,
            COUNT(v.id) AS open_voucher_count,
            MIN(v.created_at) AS oldest_open_voucher_at,
            GROUP_CONCAT(v.code_value ORDER BY v.id SEPARATOR '\n') AS open_codes
        FROM event2026_addon_purchases ap
        INNER JOIN event2026_gift_vouchers v
            ON v.event_id = ap.event_id
           AND v.purchased_by_addon_purchase_id = ap.id
           AND v.status = 'open'
        WHERE ap.event_id = :event_id
        GROUP BY ap.id, ap.registration_id, ap.payment_reference_code, ap.status
        ORDER BY oldest_open_voucher_at ASC, ap.id ASC");
    $addonStmt->execute([':event_id' => $eventId]);

    $candidates = [];

    foreach ($registrationStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $status = (string) ($row['payment_status_detail'] ?: $row['payment_status']);
        if ($status !== 'paid') {
            continue;
        }

        $contact = event2026_fetch_registration_reminder_contact($pdo, (int) $row['id']);
        if (!$contact) {
            continue;
        }

        $oldest = trim((string) ($row['oldest_open_voucher_at'] ?? ''));
        if ($oldest === '') {
            continue;
        }

        try {
            $oldestDate = new DateTimeImmutable($oldest);
        } catch (Throwable $e) {
            continue;
        }

        $codes = array_values(array_filter(array_map('trim', explode("\n", (string) ($row['open_codes'] ?? '')))));
        $candidates[] = [
            'entity_type' => 'registration',
            'entity_id' => (int) $row['id'],
            'recipient' => $contact,
            'registration_id' => (int) $row['id'],
            'payment_reference_code' => (string) $row['payment_reference_code'],
            'open_voucher_count' => (int) $row['open_voucher_count'],
            'oldest_open_voucher_at' => $oldestDate->format('Y-m-d H:i:s'),
            'oldest_open_voucher_date' => $oldestDate->format('Y-m-d'),
            'open_codes' => $codes,
        ];
    }

    foreach ($addonStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if ((string) ($row['status'] ?? '') !== 'paid') {
            continue;
        }

        $contact = event2026_fetch_addon_purchase_reminder_contact($pdo, (int) $row['id']);
        if (!$contact) {
            continue;
        }

        $oldest = trim((string) ($row['oldest_open_voucher_at'] ?? ''));
        if ($oldest === '') {
            continue;
        }

        try {
            $oldestDate = new DateTimeImmutable($oldest);
        } catch (Throwable $e) {
            continue;
        }

        $codes = array_values(array_filter(array_map('trim', explode("\n", (string) ($row['open_codes'] ?? '')))));
        $candidates[] = [
            'entity_type' => 'addon_purchase',
            'entity_id' => (int) $row['id'],
            'registration_id' => $row['registration_id'] !== null ? (int) $row['registration_id'] : null,
            'recipient' => $contact,
            'payment_reference_code' => (string) $row['payment_reference_code'],
            'open_voucher_count' => (int) $row['open_voucher_count'],
            'oldest_open_voucher_at' => $oldestDate->format('Y-m-d H:i:s'),
            'oldest_open_voucher_date' => $oldestDate->format('Y-m-d'),
            'open_codes' => $codes,
        ];
    }

    return $candidates;
}

function event2026_filter_unused_voucher_candidates(
    PDO $pdo,
    array $event,
    string $reminderKind,
    bool $allowAlreadySent = false
): array {
    if (!event2026_reminder_is_voucher_kind($reminderKind)) {
        throw new InvalidArgumentException('Ungueltiger Gutschein-Reminder-Typ.');
    }

    $eventId = (int) ($event['id'] ?? 0);
    $today = new DateTimeImmutable('today');
    $preEventTriggerDate = event2026_calculate_pre_event_trigger_date($event['event_date'] ?? null);
    $eventDate = !empty($event['event_date']) ? new DateTimeImmutable((string) $event['event_date']) : null;
    $result = [];

    foreach (event2026_build_unused_voucher_reminder_candidates($pdo, $event) as $candidate) {
        $matchesKind = false;
        if ($reminderKind === EVENT2026_REMINDER_KIND_MANUAL_UNUSED_VOUCHER) {
            $matchesKind = true;
        } elseif ($reminderKind === EVENT2026_REMINDER_KIND_VOUCHER_UNUSED_7D) {
            $oldestDate = new DateTimeImmutable($candidate['oldest_open_voucher_date']);
            $matchesKind = $oldestDate <= $today->modify('-7 days');
        } elseif ($reminderKind === EVENT2026_REMINDER_KIND_VOUCHER_UNUSED_PRE_EVENT) {
            $matchesKind = $preEventTriggerDate !== null
                && $today->format('Y-m-d') >= $preEventTriggerDate
                && ($eventDate === null || $today <= $eventDate);
        }

        if (!$matchesKind) {
            continue;
        }
        if (
            !$allowAlreadySent
            && event2026_reminder_mail_already_sent($pdo, $eventId, (string) $candidate['entity_type'], (int) $candidate['entity_id'], $reminderKind)
        ) {
            continue;
        }

        $result[] = $candidate;
    }

    return $result;
}

function event2026_send_registration_payment_reminder(
    PDO $pdo,
    array $event,
    array $candidate,
    string $reminderKind,
    string $triggerSource = 'cron',
    ?int $sentByUserId = null
): bool {
    $recipientEmail = event2026_safe_email($candidate['recipient']['email'] ?? null);
    if (!$recipientEmail) {
        return false;
    }

    $recipientName = trim((string) ($candidate['recipient']['name'] ?? 'Ice-Tour Teilnehmer'));
    if ($recipientName === '') {
        $recipientName = 'Ice-Tour Teilnehmer';
    }

    $eventDateLabel = event2026_format_event_date_de($event['event_date'] ?? null);
    $subject = $reminderKind === EVENT2026_REMINDER_KIND_REGISTRATION_PAYMENT_PRE_EVENT
        ? 'Ice-Tour 2026: Zahlung vor dem Event bitte abschliessen'
        : 'Ice-Tour 2026: Erinnerung an deine offene Zahlung';

    $body = "Hallo {$recipientName},\n\n";
    $body .= "zu deiner Anmeldung für die Ice-Tour 2026 ist noch eine Zahlung offen.\n\n";
    $body .= "Event-Datum: {$eventDateLabel}\n";
    $body .= "Referenzcode: " . (string) $candidate['payment_reference_code'] . "\n";
    $body .= "Offener Betrag: " . number_format((float) $candidate['outstanding_amount'], 2, ',', '.') . " EUR\n\n";
    $body .= "Deine Anmeldung und den aktuellen Zahlungsstatus findest du jederzeit hier:\n";
    $body .= event2026_app_base_url() . "/event-me\n\n";
    $body .= "Falls du bereits bezahlt hast, kannst du diese Nachricht ignorieren.\n\n";
    $body .= "Viele Gruesse\nIce-App Team";

    if (!iceapp_send_utf8_text_mail($recipientEmail, $subject, $body)) {
        return false;
    }

    event2026_log_reminder_mail(
        $pdo,
        (int) $event['id'],
        'registration',
        (int) $candidate['entity_id'],
        $recipientEmail,
        $reminderKind,
        $triggerSource,
        $sentByUserId,
        $subject,
        [
            'outstanding_amount' => (float) $candidate['outstanding_amount'],
            'payment_reference_code' => (string) $candidate['payment_reference_code'],
        ]
    );

    return true;
}

function event2026_send_unused_voucher_reminder(
    PDO $pdo,
    array $event,
    array $candidate,
    string $reminderKind,
    string $triggerSource = 'cron',
    ?int $sentByUserId = null
): bool {
    $recipientEmail = event2026_safe_email($candidate['recipient']['email'] ?? null);
    if (!$recipientEmail) {
        return false;
    }

    $recipientName = trim((string) ($candidate['recipient']['name'] ?? 'Ice-Tour Teilnehmer'));
    if ($recipientName === '') {
        $recipientName = 'Ice-Tour Teilnehmer';
    }

    $eventDateLabel = event2026_format_event_date_de($event['event_date'] ?? null);
    $subject = $reminderKind === EVENT2026_REMINDER_KIND_VOUCHER_UNUSED_PRE_EVENT
        ? 'Ice-Tour 2026: Deine Gutschein-Codes vor dem Event'
        : 'Ice-Tour 2026: Deine Gutschein-Codes sind noch ungenutzt';

    $body = "Hallo {$recipientName},\n\n";
    $body .= "du hast aktuell noch ungenutzte Gutschein-Codes für die Ice-Tour 2026.\n\n";
    $body .= "Event-Datum: {$eventDateLabel}\n";
    $body .= "Referenzcode: " . (string) $candidate['payment_reference_code'] . "\n";
    $body .= "Offene Codes: " . (int) $candidate['open_voucher_count'] . "\n";
    if (!empty($candidate['open_codes'])) {
        $body .= "Codes:\n";
        foreach ($candidate['open_codes'] as $code) {
            $body .= "- {$code}\n";
        }
        $body .= "\n";
    }
    $body .= "Falls du sie verschenken oder selbst nutzen willst, findest du den aktuellen Stand ebenfalls im Event-Bereich:\n";
    $body .= event2026_app_base_url() . "/event-me\n\n";
    $body .= "Viele Gruesse\nIce-App Team";

    if (!iceapp_send_utf8_text_mail($recipientEmail, $subject, $body)) {
        return false;
    }

    event2026_log_reminder_mail(
        $pdo,
        (int) $event['id'],
        (string) $candidate['entity_type'],
        (int) $candidate['entity_id'],
        $recipientEmail,
        $reminderKind,
        $triggerSource,
        $sentByUserId,
        $subject,
        [
            'open_voucher_count' => (int) $candidate['open_voucher_count'],
            'payment_reference_code' => (string) $candidate['payment_reference_code'],
        ]
    );

    return true;
}

function event2026_run_reminder_kind(
    PDO $pdo,
    array $event,
    string $reminderKind,
    bool $dryRun = false,
    bool $allowAlreadySent = false,
    ?int $sentByUserId = null,
    string $triggerSource = 'cron'
): array {
    if (event2026_reminder_is_payment_kind($reminderKind)) {
        $candidates = event2026_filter_registration_payment_candidates($pdo, $event, $reminderKind, $allowAlreadySent);
    } elseif (event2026_reminder_is_voucher_kind($reminderKind)) {
        $candidates = event2026_filter_unused_voucher_candidates($pdo, $event, $reminderKind, $allowAlreadySent);
    } else {
        throw new InvalidArgumentException('Unbekannter Reminder-Typ.');
    }

    $result = [
        'kind' => $reminderKind,
        'candidate_count' => count($candidates),
        'sent_count' => 0,
        'failed_count' => 0,
        'dry_run' => $dryRun,
        'candidates' => array_map(static function (array $candidate): array {
            return [
                'entity_type' => (string) $candidate['entity_type'],
                'entity_id' => (int) $candidate['entity_id'],
                'recipient_email' => (string) ($candidate['recipient']['email'] ?? ''),
                'recipient_name' => (string) ($candidate['recipient']['name'] ?? ''),
                'payment_reference_code' => (string) ($candidate['payment_reference_code'] ?? ''),
                'outstanding_amount' => isset($candidate['outstanding_amount']) ? (float) $candidate['outstanding_amount'] : null,
                'open_voucher_count' => isset($candidate['open_voucher_count']) ? (int) $candidate['open_voucher_count'] : null,
            ];
        }, $candidates),
    ];

    if ($dryRun) {
        return $result;
    }

    foreach ($candidates as $candidate) {
        $sent = event2026_reminder_is_payment_kind($reminderKind)
            ? event2026_send_registration_payment_reminder($pdo, $event, $candidate, $reminderKind, $triggerSource, $sentByUserId)
            : event2026_send_unused_voucher_reminder($pdo, $event, $candidate, $reminderKind, $triggerSource, $sentByUserId);

        if ($sent) {
            $result['sent_count']++;
        } else {
            $result['failed_count']++;
        }
    }

    return $result;
}

function event2026_find_manual_payment_candidate_by_registration(PDO $pdo, array $event, int $registrationId): ?array
{
    foreach (event2026_filter_registration_payment_candidates($pdo, $event, EVENT2026_REMINDER_KIND_MANUAL_REGISTRATION_PAYMENT, true) as $candidate) {
        if ((int) $candidate['entity_id'] === $registrationId) {
            return $candidate;
        }
    }
    return null;
}

function event2026_find_manual_unused_voucher_candidate(PDO $pdo, array $event, string $entityType, int $entityId): ?array
{
    foreach (event2026_filter_unused_voucher_candidates($pdo, $event, EVENT2026_REMINDER_KIND_MANUAL_UNUSED_VOUCHER, true) as $candidate) {
        if ((string) $candidate['entity_type'] === $entityType && (int) $candidate['entity_id'] === $entityId) {
            return $candidate;
        }
    }
    return null;
}

function event2026_fetch_reminder_overview_map(PDO $pdo, int $eventId): array
{
    $stmt = $pdo->prepare("SELECT entity_type, entity_id, reminder_kind, trigger_source, sent_at
        FROM event2026_reminder_mail_log
        WHERE event_id = :event_id
        ORDER BY sent_at DESC, id DESC");
    $stmt->execute([':event_id' => $eventId]);

    $map = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $group = event2026_reminder_group_for_kind((string) ($row['reminder_kind'] ?? ''));
        if (!$group) {
            continue;
        }

        $key = (string) $row['entity_type'] . ':' . (int) $row['entity_id'];
        if (!isset($map[$key])) {
            $map[$key] = [];
        }
        if (!isset($map[$key][$group])) {
            $map[$key][$group] = [
                'count' => 0,
                'last_sent_at' => null,
                'last_kind' => null,
                'last_trigger_source' => null,
            ];
        }

        $map[$key][$group]['count']++;
        if ($map[$key][$group]['last_sent_at'] === null) {
            $map[$key][$group]['last_sent_at'] = $row['sent_at'];
            $map[$key][$group]['last_kind'] = $row['reminder_kind'];
            $map[$key][$group]['last_trigger_source'] = $row['trigger_source'];
        }
    }

    return $map;
}
