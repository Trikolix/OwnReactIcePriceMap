<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/stripe_client.php';

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $payload = file_get_contents('php://input');
    $signature = (string) ($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');
    $webhookSecret = event2026_stripe_webhook_secret();

    if (!event2026_stripe_verify_signature($payload ?: '', $signature, $webhookSecret)) {
        http_response_code(400);
        throw new RuntimeException('Ungültige Stripe-Signatur.');
    }

    $event = json_decode($payload ?: '', true);
    if (!is_array($event)) {
        http_response_code(400);
        throw new RuntimeException('Ungültiges Stripe-Event.');
    }

    $type = (string) ($event['type'] ?? '');
    if ($type !== 'checkout.session.completed') {
        echo json_encode(['status' => 'success', 'ignored' => true, 'event_type' => $type]);
        exit;
    }

    $session = $event['data']['object'] ?? null;
    if (!is_array($session)) {
        throw new RuntimeException('Stripe Session-Daten fehlen.');
    }

    $metadata = is_array($session['metadata'] ?? null) ? $session['metadata'] : [];
    $eventKind = (string) ($metadata['event_kind'] ?? '');
    $amountTotal = (int) ($session['amount_total'] ?? 0);
    $paidAmount = round($amountTotal / 100, 2);

    if (($session['payment_status'] ?? '') !== 'paid') {
        echo json_encode(['status' => 'success', 'ignored' => true, 'reason' => 'payment_not_paid']);
        exit;
    }

    $pdo->beginTransaction();

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
            throw new RuntimeException('Registrierung für Webhook nicht gefunden.');
        }

        if (($row['payment_status_detail'] ?? '') !== 'paid') {
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
            [
                'stripe_session_id' => (string) ($session['id'] ?? ''),
                'stripe_event_id' => (string) ($event['id'] ?? ''),
                'paid_amount' => $paidAmount,
                'created_voucher_count' => count($createdVouchers),
            ]
        );
    } elseif ($eventKind === 'addon_purchase') {
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
            throw new RuntimeException('Zusatzbestellung für Webhook nicht gefunden.');
        }

        if (($purchase['status'] ?? '') !== 'paid') {
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
            [
                'stripe_session_id' => (string) ($session['id'] ?? ''),
                'stripe_event_id' => (string) ($event['id'] ?? ''),
                'paid_amount' => $paidAmount,
                'created_voucher_count' => count($createdVouchers),
            ]
        );
    } else {
        $pdo->rollBack();
        echo json_encode(['status' => 'success', 'ignored' => true, 'reason' => 'unsupported_event_kind']);
        exit;
    }

    $pdo->commit();

    echo json_encode(['status' => 'success']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (http_response_code() < 400) {
        http_response_code(400);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
