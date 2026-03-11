<?php
require_once __DIR__ . '/bootstrap.php';

const EVENT2026_CONFIRM_PAYPAL = 'ch_helbig@mail.de';
const EVENT2026_CONFIRM_PAYPAL_LINK = 'https://paypal.me/ChristianHelbig451';

function event2026_confirm_send_utf8_mail(string $to, string $subjectText, string $body): bool
{
    $subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "From: Ice-App <noreply@ice-app.de>\r\n";
    $headers .= "Reply-To: noreply@ice-app.de\r\n";
    return @mail($to, $subject, $body, $headers);
}

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $admin = event2026_require_admin($pdo);
    $data = event2026_json_input();
    $registrationId = (int) ($data['registration_id'] ?? 0);
    $addonPurchaseId = (int) ($data['addon_purchase_id'] ?? 0);
    $paidAmount = (float) ($data['paid_amount'] ?? 0);

    if ($registrationId <= 0 && $addonPurchaseId <= 0) {
        throw new InvalidArgumentException('registration_id oder addon_purchase_id fehlt.');
    }

    $pdo->beginTransaction();
    $event = event2026_current_event($pdo, true);
    $eventId = (int) $event['id'];

    if ($registrationId > 0) {
        $paymentStmt = $pdo->prepare("SELECT p.id, p.expected_amount, r.gift_voucher_quantity
            FROM event2026_payments p
            INNER JOIN event2026_registrations r ON r.id = p.registration_id
            WHERE p.registration_id = :registration_id AND r.event_id = :event_id
            LIMIT 1 FOR UPDATE");
        $paymentStmt->execute([
            ':registration_id' => $registrationId,
            ':event_id' => $eventId,
        ]);
        $payment = $paymentStmt->fetch(PDO::FETCH_ASSOC);
        if (!$payment) {
            throw new RuntimeException('Zahlung fuer Registrierung nicht gefunden.');
        }

        $effectivePaid = $paidAmount > 0 ? $paidAmount : (float) $payment['expected_amount'];
        $pdo->prepare("UPDATE event2026_payments
            SET paid_amount = :paid_amount,
                status = 'paid',
                confirmed_by_admin = :admin_id,
                confirmed_at = NOW(),
                updated_at = NOW()
            WHERE id = :payment_id")->execute([
                ':paid_amount' => $effectivePaid,
                ':admin_id' => $admin['user_id'],
                ':payment_id' => (int) $payment['id'],
            ]);
        $pdo->prepare("UPDATE event2026_registrations
            SET payment_status = 'paid', updated_at = NOW()
            WHERE id = :registration_id")->execute([':registration_id' => $registrationId]);
        $pdo->prepare("UPDATE event2026_participant_slots
            SET license_status = 'licensed', updated_at = NOW()
            WHERE registration_id = :registration_id")->execute([':registration_id' => $registrationId]);

        $createdVouchers = event2026_generate_missing_registration_vouchers($pdo, $eventId, $registrationId, (int) ($payment['gift_voucher_quantity'] ?? 0));

        event2026_log_action($pdo, $eventId, $admin['user_id'], 'payment_confirm', 'registration', $registrationId, [
            'paid_amount' => $effectivePaid,
            'created_voucher_count' => count($createdVouchers),
        ]);

        $pdo->commit();

        $owner = event2026_fetch_registration_owner($pdo, $registrationId);
        if ($owner && !empty($owner['email']) && !empty($createdVouchers)) {
            $mailBody = "Hallo {$owner['username']},\n\n";
            $mailBody .= "deine Zahlung fuer die Ice-Tour 2026 wurde bestaetigt.\n";
            $mailBody .= "Deine Geschenk-Codes sind jetzt freigeschaltet:\n";
            foreach ($createdVouchers as $voucher) {
                $mailBody .= "- {$voucher['code']}\n";
            }
            $mailBody .= "\nViele Gruesse\nIce-App Team";
            event2026_confirm_send_utf8_mail($owner['email'], 'Ice-Tour 2026: Gutschein-Codes freigeschaltet', $mailBody);
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Zahlung bestaetigt und Lizenzen freigeschaltet.',
            'created_vouchers' => $createdVouchers,
        ]);
        exit;
    }

    $purchaseStmt = $pdo->prepare("SELECT *
        FROM event2026_addon_purchases
        WHERE id = :id AND event_id = :event_id
        LIMIT 1 FOR UPDATE");
    $purchaseStmt->execute([
        ':id' => $addonPurchaseId,
        ':event_id' => $eventId,
    ]);
    $purchase = $purchaseStmt->fetch(PDO::FETCH_ASSOC);
    if (!$purchase) {
        throw new RuntimeException('Zusatzbestellung nicht gefunden.');
    }

    $effectivePaid = $paidAmount > 0 ? $paidAmount : (float) $purchase['expected_amount'];
    $pdo->prepare("UPDATE event2026_addon_purchases
        SET paid_amount = :paid_amount,
            status = 'paid',
            confirmed_by_admin = :admin_id,
            confirmed_at = NOW(),
            updated_at = NOW()
        WHERE id = :id")->execute([
            ':paid_amount' => $effectivePaid,
            ':admin_id' => $admin['user_id'],
            ':id' => $addonPurchaseId,
        ]);

    $registrationIdForVoucher = $purchase['registration_id'] !== null ? (int) $purchase['registration_id'] : null;
    $createdVouchers = event2026_generate_missing_addon_purchase_vouchers($pdo, $eventId, $registrationIdForVoucher, $addonPurchaseId, (int) $purchase['gift_voucher_quantity']);

    event2026_log_action($pdo, $eventId, $admin['user_id'], 'payment_confirm', 'addon_purchase', $addonPurchaseId, [
        'paid_amount' => $effectivePaid,
        'created_voucher_count' => count($createdVouchers),
    ]);

    $pdo->commit();

    $owner = $purchase['registration_id'] !== null
        ? event2026_fetch_registration_owner($pdo, (int) $purchase['registration_id'])
        : event2026_fetch_addon_purchase_contact($pdo, $addonPurchaseId);
    if ($owner && !empty($owner['email']) && !empty($createdVouchers)) {
        $ownerName = (string) ($owner['username'] ?? $owner['name'] ?? 'Ice-Tour Teilnehmer');
        $mailBody = "Hallo {$ownerName},\n\n";
        $mailBody .= "deine Zusatzbestellung fuer die Ice-Tour 2026 wurde bestaetigt.\n";
        $mailBody .= "Deine Geschenk-Codes sind jetzt freigeschaltet:\n";
        foreach ($createdVouchers as $voucher) {
            $mailBody .= "- {$voucher['code']}\n";
        }
        $mailBody .= "\nViele Gruesse\nIce-App Team";
        event2026_confirm_send_utf8_mail($owner['email'], 'Ice-Tour 2026: Zusatzkauf freigeschaltet', $mailBody);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Zusatzbestellung bestaetigt und Gutschein-Codes freigeschaltet.',
        'created_vouchers' => $createdVouchers,
    ]);
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
