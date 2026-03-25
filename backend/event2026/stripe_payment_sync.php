<?php
require_once __DIR__ . '/bootstrap.php';

function event2026_apply_paid_stripe_session(PDO $pdo, array $session, array $logContext = []): array
{
    $metadata = is_array($session['metadata'] ?? null) ? $session['metadata'] : [];
    $eventKind = (string) ($metadata['event_kind'] ?? '');
    $amountTotal = (int) ($session['amount_total'] ?? 0);
    $paidAmount = round($amountTotal / 100, 2);
    $sessionId = (string) ($session['id'] ?? '');

    if (($session['payment_status'] ?? '') !== 'paid') {
        return [
            'status' => 'ignored',
            'reason' => 'payment_not_paid',
            'payment_status' => (string) ($session['payment_status'] ?? ''),
            'stripe_session_id' => $sessionId,
        ];
    }

    if ($eventKind === 'registration') {
        $registrationId = (int) ($metadata['registration_id'] ?? 0);
        $paymentRef = (string) ($metadata['payment_reference_code'] ?? '');
        if ($registrationId <= 0 || $paymentRef === '') {
            throw new RuntimeException('Metadata für Registrierung unvollständig.');
        }

        $stmt = $pdo->prepare("SELECT
                r.id,
                r.event_id,
                r.payment_reference_code,
                r.gift_voucher_quantity,
                r.payment_status,
                p.id AS payment_id,
                p.status AS payment_status_detail
            FROM event2026_registrations r
            INNER JOIN event2026_payments p ON p.registration_id = r.id
            WHERE r.id = :registration_id
              AND r.payment_reference_code = :payment_reference_code
            LIMIT 1
            FOR UPDATE");
        $stmt->execute([
            ':registration_id' => $registrationId,
            ':payment_reference_code' => $paymentRef,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new RuntimeException('Registrierung für Stripe-Sync nicht gefunden.');
        }

        $alreadyPaid = (($row['payment_status_detail'] ?? '') === 'paid');
        if (!$alreadyPaid) {
            $pdo->prepare("UPDATE event2026_payments
                SET paid_amount = :paid_amount,
                    method = 'stripe_checkout',
                    status = 'paid',
                    confirmed_at = NOW(),
                    updated_at = NOW()
                WHERE id = :id")->execute([
                    ':paid_amount' => $paidAmount,
                    ':id' => (int) $row['payment_id'],
                ]);
            $pdo->prepare("UPDATE event2026_registrations
                SET payment_status = 'paid', updated_at = NOW()
                WHERE id = :registration_id")->execute([
                    ':registration_id' => $registrationId,
                ]);
            $pdo->prepare("UPDATE event2026_participant_slots
                SET license_status = 'licensed', updated_at = NOW()
                WHERE registration_id = :registration_id")->execute([
                    ':registration_id' => $registrationId,
                ]);
        }

        $createdVouchers = event2026_generate_missing_registration_vouchers(
            $pdo,
            (int) $row['event_id'],
            $registrationId,
            (int) ($row['gift_voucher_quantity'] ?? 0)
        );

        event2026_log_action(
            $pdo,
            (int) $row['event_id'],
            null,
            'payment_confirm_stripe',
            'registration',
            $registrationId,
            array_merge($logContext, [
                'stripe_session_id' => $sessionId,
                'paid_amount' => $paidAmount,
                'created_voucher_count' => count($createdVouchers),
                'already_paid' => $alreadyPaid,
            ])
        );

        return [
            'status' => 'success',
            'entity_type' => 'registration',
            'entity_id' => $registrationId,
            'already_paid' => $alreadyPaid,
            'paid_amount' => $paidAmount,
            'created_voucher_count' => count($createdVouchers),
            'stripe_session_id' => $sessionId,
        ];
    }

    if ($eventKind === 'addon_purchase') {
        $addonPurchaseId = (int) ($metadata['addon_purchase_id'] ?? 0);
        $paymentRef = (string) ($metadata['payment_reference_code'] ?? '');
        if ($addonPurchaseId <= 0 || $paymentRef === '') {
            throw new RuntimeException('Metadata für Zusatzbestellung unvollständig.');
        }

        $stmt = $pdo->prepare("SELECT *
            FROM event2026_addon_purchases
            WHERE id = :id
              AND payment_reference_code = :payment_reference_code
            LIMIT 1
            FOR UPDATE");
        $stmt->execute([
            ':id' => $addonPurchaseId,
            ':payment_reference_code' => $paymentRef,
        ]);
        $purchase = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$purchase) {
            throw new RuntimeException('Zusatzbestellung für Stripe-Sync nicht gefunden.');
        }

        $alreadyPaid = (($purchase['status'] ?? '') === 'paid');
        if (!$alreadyPaid) {
            $pdo->prepare("UPDATE event2026_addon_purchases
                SET paid_amount = :paid_amount,
                    payment_method = 'stripe_checkout',
                    status = 'paid',
                    confirmed_at = NOW(),
                    updated_at = NOW()
                WHERE id = :id")->execute([
                    ':paid_amount' => $paidAmount,
                    ':id' => $addonPurchaseId,
                ]);
        }

        $registrationId = $purchase['registration_id'] !== null ? (int) $purchase['registration_id'] : null;
        $createdVouchers = event2026_generate_missing_addon_purchase_vouchers(
            $pdo,
            (int) $purchase['event_id'],
            $registrationId,
            $addonPurchaseId,
            (int) ($purchase['gift_voucher_quantity'] ?? 0)
        );

        event2026_log_action(
            $pdo,
            (int) $purchase['event_id'],
            null,
            'payment_confirm_stripe',
            'addon_purchase',
            $addonPurchaseId,
            array_merge($logContext, [
                'stripe_session_id' => $sessionId,
                'paid_amount' => $paidAmount,
                'created_voucher_count' => count($createdVouchers),
                'already_paid' => $alreadyPaid,
            ])
        );

        return [
            'status' => 'success',
            'entity_type' => 'addon_purchase',
            'entity_id' => $addonPurchaseId,
            'already_paid' => $alreadyPaid,
            'paid_amount' => $paidAmount,
            'created_voucher_count' => count($createdVouchers),
            'stripe_session_id' => $sessionId,
        ];
    }

    return [
        'status' => 'ignored',
        'reason' => 'unsupported_event_kind',
        'event_kind' => $eventKind,
        'stripe_session_id' => $sessionId,
    ];
}
