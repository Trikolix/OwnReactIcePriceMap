<?php
require_once __DIR__ . '/reminders.php';

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $admin = event2026_require_admin($pdo);
    $data = event2026_json_input();
    $scope = trim((string) ($data['scope'] ?? ''));
    $entityType = trim((string) ($data['entity_type'] ?? ''));
    $entityId = (int) ($data['entity_id'] ?? 0);

    if (!in_array($scope, ['registration_payment', 'unused_vouchers'], true)) {
        throw new InvalidArgumentException('Ungueltiger Reminder-Bereich.');
    }

    $event = event2026_current_event($pdo);
    $results = [];
    $sentCount = 0;
    $failedCount = 0;

    if ($scope === 'registration_payment') {
        if ($entityId > 0) {
            $candidate = event2026_find_manual_payment_candidate_by_registration($pdo, $event, $entityId);
            if (!$candidate) {
                throw new RuntimeException('Keine offene Registrierung fuer diesen Reminder gefunden.');
            }
            $sent = event2026_send_registration_payment_reminder(
                $pdo,
                $event,
                $candidate,
                EVENT2026_REMINDER_KIND_MANUAL_REGISTRATION_PAYMENT,
                'admin_manual',
                (int) $admin['user_id']
            );
            $results[] = [
                'scope' => $scope,
                'entity_type' => 'registration',
                'entity_id' => $entityId,
                'sent' => $sent,
                'recipient_email' => $candidate['recipient']['email'] ?? null,
            ];
            $sent ? $sentCount++ : $failedCount++;
        } else {
            $run = event2026_run_reminder_kind(
                $pdo,
                $event,
                EVENT2026_REMINDER_KIND_MANUAL_REGISTRATION_PAYMENT,
                false,
                true,
                (int) $admin['user_id'],
                'admin_manual'
            );
            $results[] = $run;
            $sentCount += (int) $run['sent_count'];
            $failedCount += (int) $run['failed_count'];
        }
    }

    if ($scope === 'unused_vouchers') {
        if ($entityId > 0) {
            if (!in_array($entityType, ['registration', 'addon_purchase'], true)) {
                throw new InvalidArgumentException('entity_type fehlt oder ist ungueltig.');
            }
            $candidate = event2026_find_manual_unused_voucher_candidate($pdo, $event, $entityType, $entityId);
            if (!$candidate) {
                throw new RuntimeException('Keine ungenutzten Gutscheine fuer diesen Reminder gefunden.');
            }
            $sent = event2026_send_unused_voucher_reminder(
                $pdo,
                $event,
                $candidate,
                EVENT2026_REMINDER_KIND_MANUAL_UNUSED_VOUCHER,
                'admin_manual',
                (int) $admin['user_id']
            );
            $results[] = [
                'scope' => $scope,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'sent' => $sent,
                'recipient_email' => $candidate['recipient']['email'] ?? null,
            ];
            $sent ? $sentCount++ : $failedCount++;
        } else {
            $run = event2026_run_reminder_kind(
                $pdo,
                $event,
                EVENT2026_REMINDER_KIND_MANUAL_UNUSED_VOUCHER,
                false,
                true,
                (int) $admin['user_id'],
                'admin_manual'
            );
            $results[] = $run;
            $sentCount += (int) $run['sent_count'];
            $failedCount += (int) $run['failed_count'];
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => $sentCount > 0
            ? "Reminder gesendet: {$sentCount}"
            : 'Es wurden keine Reminder gesendet.',
        'summary' => [
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
        ],
        'results' => $results,
    ]);
} catch (Throwable $e) {
    if (http_response_code() < 400) {
        http_response_code(400);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
