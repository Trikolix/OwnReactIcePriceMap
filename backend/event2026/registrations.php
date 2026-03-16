<?php
require_once __DIR__ . '/bootstrap.php';

const EVENT2026_PAYMENT_CONTACT = 'admin@ice-app.de';
const EVENT2026_ENTRY_FEE = 15.0;
const EVENT2026_ADMIN_NOTIFY_EMAIL = 'admin@ice-app.de';

function event2026_send_utf8_mail(string $to, string $subjectText, string $body): bool
{
    $subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "From: Ice-App <noreply@ice-app.de>\r\n";
    $headers .= "Reply-To: noreply@ice-app.de\r\n";

    return @mail($to, $subject, $body, $headers);
}

function event2026_generate_invite_code(int $length = 10): string
{
    return bin2hex(random_bytes((int) max(1, floor($length / 2))));
}

function event2026_create_account_for_registration(PDO $pdo, array $accountData, bool $newsletterOptIn = false): array
{
    $username = trim((string) ($accountData['username'] ?? ''));
    $email = trim((string) ($accountData['email'] ?? ''));
    $password = (string) ($accountData['password'] ?? '');
    $acceptedTerms = !empty($accountData['acceptedTerms']);

    if (!$acceptedTerms) {
        throw new InvalidArgumentException('Bitte AGB/Datenschutz/Community-Richtlinien akzeptieren.');
    }

    $usernameRegex = '/^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/';
    if (!preg_match($usernameRegex, $username)) {
        throw new InvalidArgumentException('Benutzername: 3-20 Zeichen, nur Buchstaben, Zahlen, _ und -, muss mit Buchstabe beginnen.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Ungültige E-Mail-Adresse für den neuen Account.');
    }

    if (strlen($password) < 6) {
        throw new InvalidArgumentException('Passwort zu kurz (mind. 6 Zeichen).');
    }

    $existsStmt = $pdo->prepare("SELECT id FROM nutzer WHERE username = :username OR email = :email LIMIT 1");
    $existsStmt->execute([
        ':username' => $username,
        ':email' => $email,
    ]);
    if ($existsStmt->fetch()) {
        throw new InvalidArgumentException('Benutzername oder E-Mail ist bereits vergeben.');
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $verifyToken = bin2hex(random_bytes(32));
    $inviteCode = event2026_generate_invite_code();

    $insertUser = $pdo->prepare("INSERT INTO nutzer (username, email, password_hash, verification_token, invite_code)
        VALUES (:username, :email, :password_hash, :verify_token, :invite_code)");
    $insertUser->execute([
        ':username' => $username,
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':verify_token' => $verifyToken,
        ':invite_code' => $inviteCode,
    ]);
    $userId = (int) $pdo->lastInsertId();

    $notifyStmt = $pdo->prepare("INSERT INTO user_notification_settings (user_id, notify_checkin_mention, notify_comment, notify_comment_participated, notify_news)
        VALUES (:user_id, 1, 1, 1, :notify_news)");
    $notifyStmt->execute([
        ':user_id' => $userId,
        ':notify_news' => $newsletterOptIn ? 1 : 0,
    ]);

    $verifyUrl = 'https://ice-app.de/#/verify?token=' . urlencode($verifyToken);
    $mailBody = "Hallo {$username},\n\n";
    $mailBody .= "dein Ice-App Account für die Ice-Tour 2026 wurde erstellt.\n";
    $mailBody .= "Bitte bestätige deine E-Mail-Adresse über diesen Link:\n{$verifyUrl}\n\n";
    $mailBody .= "Viele Grüße\nIce-App Team";

    $mailSent = event2026_send_utf8_mail($email, 'Bestätige deine Registrierung für die Ice-App', $mailBody);

    return [
        'user_id' => $userId,
        'username' => $username,
        'email' => $email,
        'verification_url' => $verifyUrl,
        'verification_mail_sent' => $mailSent,
    ];
}

function event2026_payment_instruction_text(): string
{
    return 'Bitte schließe die Zahlung über Stripe im Event-Portal ab. Bei Fragen melde dich bitte an ' . EVENT2026_PAYMENT_CONTACT . '.';
}

function event2026_amount_breakdown(float $donationAmount, int $giftVoucherQuantity, bool $voucherRedeemed): array
{
    $entryFeeAmount = EVENT2026_ENTRY_FEE;
    $giftVoucherPurchaseAmount = $giftVoucherQuantity * EVENT2026_ENTRY_FEE;
    $voucherDiscountAmount = $voucherRedeemed ? EVENT2026_ENTRY_FEE : 0.0;
    $expectedAmount = max(0, $entryFeeAmount + $giftVoucherPurchaseAmount + $donationAmount - $voucherDiscountAmount);

    return [
        'entry_fee_amount' => $entryFeeAmount,
        'gift_voucher_purchase_amount' => $giftVoucherPurchaseAmount,
        'voucher_discount_amount' => $voucherDiscountAmount,
        'donation_amount' => $donationAmount,
        'expected_amount' => $expectedAmount,
    ];
}

function event2026_team_name_suggestions(PDO $pdo, int $eventId, int $limit = 8): array
{
    $stmt = $pdo->prepare("SELECT
            TRIM(team_name) AS team_name,
            COUNT(*) AS registrations_count,
            MAX(created_at) AS last_registered_at
        FROM event2026_registrations
        WHERE event_id = :event_id
          AND team_name IS NOT NULL
          AND TRIM(team_name) <> ''
        GROUP BY TRIM(team_name)
        ORDER BY registrations_count DESC, last_registered_at DESC, team_name ASC
        LIMIT {$limit}");
    $stmt->execute([
        ':event_id' => $eventId,
    ]);

    return array_values(array_filter(array_map(static function (array $row): ?string {
        $teamName = trim((string) ($row['team_name'] ?? ''));
        return $teamName !== '' ? $teamName : null;
    }, $stmt->fetchAll(PDO::FETCH_ASSOC))));
}

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $event = event2026_current_event($pdo);
        $legal = event2026_active_legal($pdo, (int) $event['id']);
        $reservedCount = event2026_reserved_count($pdo, (int) $event['id']);
        $auth = authenticateRequest($pdo);
        $accountEmail = null;
        $hasRegistration = false;
        $existingRegistration = null;
        if ($auth) {
            $accountEmail = event2026_fetch_user_email($pdo, (int) $auth['user_id']);
            $regStmt = $pdo->prepare("SELECT
                    r.id,
                    r.payment_reference_code,
                    r.payment_status,
                    r.entry_fee_amount,
                    r.gift_voucher_quantity,
                    r.gift_voucher_purchase_amount,
                    r.donation_amount,
                    r.voucher_discount_amount,
                    p.expected_amount,
                    p.paid_amount,
                    p.status AS payment_status_detail,
                    s.clothing_interest,
                    s.jersey_size,
                    s.bib_size
                FROM event2026_registrations r
                LEFT JOIN event2026_payments p ON p.registration_id = r.id
                LEFT JOIN event2026_participant_slots s ON s.registration_id = r.id
                WHERE r.event_id = :event_id AND r.registered_by_user_id = :user_id
                ORDER BY r.created_at DESC
                LIMIT 1");
            $regStmt->execute([
                ':event_id' => (int) $event['id'],
                ':user_id' => (int) $auth['user_id'],
            ]);
            $registrationRow = $regStmt->fetch(PDO::FETCH_ASSOC);
            $hasRegistration = $registrationRow !== false;
            if ($registrationRow) {
                $existingRegistration = [
                    'id' => (int) $registrationRow['id'],
                    'payment_reference_code' => (string) $registrationRow['payment_reference_code'],
                    'payment_status' => (string) ($registrationRow['payment_status_detail'] ?: $registrationRow['payment_status']),
                    'entry_fee_amount' => (float) ($registrationRow['entry_fee_amount'] ?? 0),
                    'gift_voucher_quantity' => (int) ($registrationRow['gift_voucher_quantity'] ?? 0),
                    'gift_voucher_purchase_amount' => (float) ($registrationRow['gift_voucher_purchase_amount'] ?? 0),
                    'donation_amount' => (float) ($registrationRow['donation_amount'] ?? 0),
                    'voucher_discount_amount' => (float) ($registrationRow['voucher_discount_amount'] ?? 0),
                    'expected_amount' => $registrationRow['expected_amount'] !== null ? (float) $registrationRow['expected_amount'] : null,
                    'paid_amount' => $registrationRow['paid_amount'] !== null ? (float) $registrationRow['paid_amount'] : null,
                    'clothing_interest' => event2026_normalize_clothing_interest($registrationRow['clothing_interest'] ?? ''),
                    'clothing_interest_label' => event2026_clothing_interest_label($registrationRow['clothing_interest'] ?? ''),
                    'jersey_size' => $registrationRow['jersey_size'] ?: null,
                    'bib_size' => $registrationRow['bib_size'] ?: null,
                ];
            }
        }

        echo json_encode([
            'status' => 'success',
            'event' => [
                'id' => (int) $event['id'],
                'slug' => $event['slug'],
                'name' => $event['name'],
                'event_date' => $event['event_date'],
                'event_status' => $event['status'],
                'max_participants' => (int) $event['max_participants'],
                'reserved_slots' => $reservedCount,
                'available_slots' => max(0, (int) $event['max_participants'] - $reservedCount),
                'min_participants_for_go' => (int) $event['min_participants_for_go'],
                'cancellation_deadline' => $event['cancellation_deadline'],
            ],
            'voucher_value' => EVENT2026_ENTRY_FEE,
            'payment_instruction' => event2026_payment_instruction_text(),
            'routes' => array_values(array_map(static function (array $route): array {
                return [
                    'key' => $route['key'],
                    'label' => $route['label'],
                    'short_label' => $route['short_label'],
                    'distance_km' => $route['distance_km'],
                    'elevation_m' => $route['elevation_m'],
                    'stops' => $route['stops'],
                    'route_type' => $route['route_type'],
                    'pace_enabled' => $route['pace_enabled'],
                    'start_mode' => $route['start_mode'],
                ];
            }, event2026_route_catalog())),
            'clothing_options' => [
                ['value' => 'none', 'label' => 'Kein Interesse'],
                ['value' => 'jersey_interest', 'label' => 'Trikot-Interesse', 'display_price' => 75],
                ['value' => 'kit_interest', 'label' => 'Set-Interesse', 'display_price' => 175],
            ],
            'legal' => [
                'id' => (int) $legal['id'],
                'version' => $legal['version'],
                'content_md' => $legal['content_md'],
            ],
            'account' => [
                'username' => $auth ? (string) $auth['username'] : null,
                'email' => $accountEmail,
                'has_registration' => $hasRegistration,
            ],
            'existing_registration' => $existingRegistration,
            'team_name_suggestions' => event2026_team_name_suggestions($pdo, (int) $event['id']),
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Methode nicht erlaubt.']);
        exit;
    }

    $data = event2026_json_input();
    $participant = is_array($data['participant'] ?? null) ? $data['participant'] : null;
    if (!$participant) {
        throw new InvalidArgumentException('Teilnehmerdaten fehlen.');
    }

    if (empty($data['acceptLegal'])) {
        throw new InvalidArgumentException('Die Teilnahmebedingungen müssen akzeptiert werden.');
    }

    $paymentMethod = (string) ($data['paymentMethodPreference'] ?? 'stripe_checkout');
    if (!in_array($paymentMethod, ['paypal_friends', 'bank_transfer', 'stripe_checkout'], true)) {
        throw new InvalidArgumentException('Ungültige Zahlungsmethode.');
    }

    $newsletterOptIn = !empty($data['newsletter']);
    $registrationNote = trim((string) ($data['registrationNote'] ?? ''));
    $donationAmount = max(0, round((float) ($data['donationAmount'] ?? 0), 2));
    $giftVoucherQuantity = max(0, min(20, (int) ($data['giftVoucherQuantity'] ?? 0)));
    $voucherCode = strtoupper(trim((string) ($data['voucherCode'] ?? '')));
    if (strlen($registrationNote) > 220) {
        throw new InvalidArgumentException('Bemerkung ist zu lang (max. 220 Zeichen).');
    }

    $pdo->beginTransaction();

    $authRecord = authenticateRequest($pdo);
    $auth = null;
    $accountCreationInfo = null;

    if ($authRecord) {
        $auth = [
            'user_id' => (int) $authRecord['user_id'],
            'username' => (string) $authRecord['username'],
        ];
    } else {
        $accountPayload = is_array($data['account'] ?? null) ? $data['account'] : null;
        if (!$accountPayload) {
            throw new InvalidArgumentException('Ohne Login muss im Event-Flow zuerst ein Ice-App Account erstellt werden.');
        }

        $accountCreationInfo = event2026_create_account_for_registration($pdo, $accountPayload, $newsletterOptIn);
        $auth = [
            'user_id' => (int) $accountCreationInfo['user_id'],
            'username' => (string) $accountCreationInfo['username'],
        ];
    }

    $accountEmail = event2026_fetch_user_email($pdo, $auth['user_id']);
    $event = event2026_current_event($pdo, true);
    $eventId = (int) $event['id'];

    if (!in_array($event['status'], ['open', 'confirmed'], true)) {
        http_response_code(409);
        throw new RuntimeException('Die Registrierung ist aktuell nicht geöffnet.');
    }

    $alreadyRegisteredStmt = $pdo->prepare("SELECT COUNT(*) FROM event2026_registrations WHERE event_id = :event_id AND registered_by_user_id = :user_id");
    $alreadyRegisteredStmt->execute([
        ':event_id' => $eventId,
        ':user_id' => $auth['user_id'],
    ]);
    if ((int) $alreadyRegisteredStmt->fetchColumn() > 0) {
        throw new InvalidArgumentException('Dieser Account ist bereits für das Event registriert.');
    }

    $slotForUser = event2026_get_slot_for_user($pdo, $eventId, $auth['user_id']);
    if ($slotForUser) {
        throw new InvalidArgumentException('Dieser Account besitzt bereits einen Starterplatz für das Event.');
    }

    $legal = event2026_active_legal($pdo, $eventId);
    $legalVersionId = (int) $legal['id'];
    if (!empty($data['legalVersion']) && $data['legalVersion'] !== $legal['version']) {
        throw new InvalidArgumentException('Die Teilnahmebedingungen wurden aktualisiert. Bitte Seite neu laden.');
    }

    $fullName = trim((string) ($participant['name'] ?? ''));
    $email = trim((string) ($participant['email'] ?? $accountEmail ?? ''));
    $routeKey = event2026_normalize_route_key((string) ($participant['routeKey'] ?? ''));
    $distance = event2026_route_distance($routeKey);
    $routeDefinition = event2026_route_definition($routeKey);
    $paceGroup = event2026_normalize_pace_group($routeKey, (string) ($participant['paceGroup'] ?? ''));
    $womenWaveOptIn = event2026_route_supports_pace($routeKey) && !empty($participant['womenWaveOptIn']) ? 1 : 0;
    $publicNameConsent = array_key_exists('publicNameConsent', $participant) ? (!empty($participant['publicNameConsent']) ? 1 : 0) : 1;
    $clothingInterest = event2026_normalize_clothing_interest((string) ($data['clothingInterest'] ?? ''));
    $jerseyInterest = $clothingInterest !== 'none' ? 1 : 0;
    $jerseySize = trim((string) ($data['jerseySize'] ?? ''));
    $bibSize = trim((string) ($data['bibSize'] ?? ''));

    if ($fullName === '' || $email === '') {
        throw new InvalidArgumentException('Name und E-Mail sind erforderlich.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Die E-Mail-Adresse ist ungültig.');
    }
    if (!in_array($paceGroup, event2026_allowed_pace_groups($routeKey), true)) {
        throw new InvalidArgumentException('Ungültige Selbsteinschätzung der Geschwindigkeit.');
    }
    if ($jerseyInterest && $jerseySize === '') {
        throw new InvalidArgumentException('Bitte gib eine Trikotgröße an, wenn Interesse besteht.');
    }
    if ($clothingInterest === 'kit_interest' && $bibSize === '') {
        throw new InvalidArgumentException('Bitte gib eine Hosengröße an, wenn Set-Interesse besteht.');
    }

    $voucherRow = null;
    if ($voucherCode !== '') {
        $voucherRow = event2026_load_gift_voucher($pdo, $eventId, $voucherCode, true);
        $voucherState = event2026_gift_voucher_status($voucherRow);
        if ($voucherState['state'] !== 'valid') {
            throw new InvalidArgumentException($voucherState['message']);
        }
    }

    $reservedCount = event2026_reserved_count($pdo, $eventId);
    $additionalReservedSlots = 1 + $giftVoucherQuantity - ($voucherRow !== null ? 1 : 0);
    if (($reservedCount + $additionalReservedSlots) > (int) $event['max_participants']) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode([
            'status' => 'sold_out',
            'message' => 'Nicht genügend freie Startplätze verfügbar.',
            'reserved_slots' => $reservedCount,
            'max_participants' => (int) $event['max_participants'],
            'available_slots' => max(0, (int) $event['max_participants'] - $reservedCount),
        ]);
        exit;
    }

    $breakdown = event2026_amount_breakdown($donationAmount, $giftVoucherQuantity, $voucherRow !== null);
    $isAutoPaid = ((float) $breakdown['expected_amount']) <= 0.0;
    $registrationPaymentStatus = $isAutoPaid ? 'paid' : 'pending';
    $slotLicenseStatus = $isAutoPaid ? 'licensed' : 'pending_payment';
    $paymentStatus = $isAutoPaid ? 'paid' : 'pending';

    $registrationStmt = $pdo->prepare("INSERT INTO event2026_registrations (
        event_id,
        registered_by_user_id,
        team_name,
        payment_reference_code,
        entry_fee_amount,
        gift_voucher_quantity,
        gift_voucher_purchase_amount,
        donation_amount,
        voucher_discount_amount,
        payment_status,
        notes
    ) VALUES (
        :event_id,
        :registered_by_user_id,
        :team_name,
        :payment_reference_code,
        :entry_fee_amount,
        :gift_voucher_quantity,
        :gift_voucher_purchase_amount,
        :donation_amount,
        :voucher_discount_amount,
        :payment_status,
        :notes
    )");

    $paymentRef = sprintf('ICE26-R%s', strtoupper(bin2hex(random_bytes(4))));
    $registrationStmt->execute([
        ':event_id' => $eventId,
        ':registered_by_user_id' => $auth['user_id'],
        ':team_name' => trim((string) ($data['teamName'] ?? '')) ?: null,
        ':payment_reference_code' => $paymentRef,
        ':entry_fee_amount' => $breakdown['entry_fee_amount'],
        ':gift_voucher_quantity' => $giftVoucherQuantity,
        ':gift_voucher_purchase_amount' => $breakdown['gift_voucher_purchase_amount'],
        ':donation_amount' => $breakdown['donation_amount'],
        ':voucher_discount_amount' => $breakdown['voucher_discount_amount'],
        ':payment_status' => $registrationPaymentStatus,
        ':notes' => $registrationNote !== '' ? $registrationNote : null,
    ]);
    $registrationId = (int) $pdo->lastInsertId();
    $registrationAccessToken = event2026_create_registration_access_token($pdo, $registrationId);

    $slotStmt = $pdo->prepare("INSERT INTO event2026_participant_slots (
        registration_id,
        event_id,
        user_id,
        full_name,
        email,
        route_key,
        distance_km,
        pace_group,
        women_wave_opt_in,
        public_name_consent,
        jersey_interest,
        clothing_interest,
        jersey_size,
        bib_size,
        license_status,
        legal_version_id,
        legal_accepted_at,
        legal_ip_hash,
        legal_user_agent_hash
    ) VALUES (
        :registration_id,
        :event_id,
        :user_id,
        :full_name,
        :email,
        :route_key,
        :distance_km,
        :pace_group,
        :women_wave_opt_in,
        :public_name_consent,
        :jersey_interest,
        :clothing_interest,
        :jersey_size,
        :bib_size,
        :license_status,
        :legal_version_id,
        NOW(),
        :legal_ip_hash,
        :legal_user_agent_hash
    )");

    $legalAuditStmt = $pdo->prepare("INSERT INTO event2026_legal_acceptances (
        slot_id,
        legal_version_id,
        accepted_at,
        ip_hash,
        user_agent_hash
    ) VALUES (:slot_id, :legal_version_id, NOW(), :ip_hash, :user_agent_hash)");

    $paymentStmt = $pdo->prepare("INSERT INTO event2026_payments (
        registration_id,
        method,
        expected_amount,
        paid_amount,
        status,
        confirmed_at
    ) VALUES (:registration_id, :method, :expected_amount, :paid_amount, :status, :confirmed_at)");

    $ipHash = event2026_hash_nullable($_SERVER['REMOTE_ADDR'] ?? null);
    $uaHash = event2026_hash_nullable($_SERVER['HTTP_USER_AGENT'] ?? null);

    $slotStmt->execute([
        ':registration_id' => $registrationId,
        ':event_id' => $eventId,
        ':user_id' => $auth['user_id'],
        ':full_name' => $fullName,
        ':email' => $email,
        ':route_key' => $routeKey,
        ':distance_km' => $distance,
        ':pace_group' => $paceGroup,
        ':women_wave_opt_in' => $womenWaveOptIn,
        ':public_name_consent' => $publicNameConsent,
        ':jersey_interest' => $jerseyInterest,
        ':clothing_interest' => $clothingInterest,
        ':jersey_size' => $jerseyInterest ? $jerseySize : null,
        ':bib_size' => $clothingInterest === 'kit_interest' ? $bibSize : null,
        ':license_status' => $slotLicenseStatus,
        ':legal_version_id' => $legalVersionId,
        ':legal_ip_hash' => $ipHash,
        ':legal_user_agent_hash' => $uaHash,
    ]);
    $slotId = (int) $pdo->lastInsertId();

    $legalAuditStmt->execute([
        ':slot_id' => $slotId,
        ':legal_version_id' => $legalVersionId,
        ':ip_hash' => $ipHash,
        ':user_agent_hash' => $uaHash,
    ]);

    $paymentStmt->execute([
        ':registration_id' => $registrationId,
        ':method' => $paymentMethod,
        ':expected_amount' => $breakdown['expected_amount'],
        ':paid_amount' => 0,
        ':status' => $paymentStatus,
        ':confirmed_at' => $isAutoPaid ? date('Y-m-d H:i:s') : null,
    ]);

    if ($voucherRow) {
        $redeemStmt = $pdo->prepare("UPDATE event2026_gift_vouchers
            SET redeemed_by_registration_id = :registration_id,
                redeemed_by_slot_id = :slot_id,
                status = 'redeemed',
                redeemed_at = NOW()
            WHERE id = :id
              AND status = 'open'");
        $redeemStmt->execute([
            ':registration_id' => $registrationId,
            ':slot_id' => $slotId,
            ':id' => (int) $voucherRow['id'],
        ]);
        if ($redeemStmt->rowCount() !== 1) {
            throw new RuntimeException('Der Gutschein konnte nicht mehr eingelöst werden. Bitte erneut versuchen.');
        }
    }

    event2026_log_action($pdo, $eventId, $auth['user_id'], 'registration_create', 'registration', $registrationId, [
        'gift_voucher_quantity' => $giftVoucherQuantity,
        'voucher_redeemed' => $voucherRow !== null,
        'payment_method' => $paymentMethod,
        'expected_amount' => $breakdown['expected_amount'],
        'donation_amount' => $breakdown['donation_amount'],
        'account_created_in_flow' => $accountCreationInfo !== null,
    ]);

    $pdo->commit();

    $reservedAfter = event2026_reserved_count($pdo, $eventId);
    $mailSent = false;
    if ($accountEmail) {
        $appBaseUrl = 'https://ice-app.de/#';
        $salutationName = $fullName !== '' ? $fullName : $auth['username'];
        $mailBody = "Hallo {$salutationName},\n\n";
        $mailBody .= "vielen Dank für deine Anmeldung zur Ice-Tour 2026.\n";
        $mailBody .= "Wir freuen uns sehr, dich am 16. Mai 2026 als Starterin bzw. Starter begrüßen zu dürfen.\n\n";
        $mailBody .= "Kaufzusammenfassung:\n";
        $mailBody .= "- Gewählte Strecke: {$routeDefinition['label']}\n";
        if (trim((string) ($data['teamName'] ?? '')) !== '') {
            $mailBody .= "- Team / Verein: " . trim((string) ($data['teamName'] ?? '')) . "\n";
        }
        $mailBody .= "- Eigene Startgebühr: " . number_format($breakdown['entry_fee_amount'], 2, ',', '.') . " EUR\n";
        if ($giftVoucherQuantity > 0) {
            $mailBody .= "- Zusätzliche Gutschein-Codes: " . number_format($breakdown['gift_voucher_purchase_amount'], 2, ',', '.') . " EUR\n";
        }
        if ($voucherRow) {
            $mailBody .= "- Eingelöster Gutschein: -" . number_format($breakdown['voucher_discount_amount'], 2, ',', '.') . " EUR\n";
        }
        if ($donationAmount > 0) {
            $mailBody .= "- Zusätzlicher Betrag: " . number_format($donationAmount, 2, ',', '.') . " EUR\n";
        }
        $mailBody .= "- Gesamtbetrag: " . number_format($breakdown['expected_amount'], 2, ',', '.') . " EUR\n\n";
        if ($isAutoPaid) {
            $mailBody .= "Deine Zahlung ist bereits vollständig erledigt.\n\n";
            $mailBody .= "Deine Anmeldung und Zahlungsbestätigung findest du jederzeit hier:\n";
            $mailBody .= "{$appBaseUrl}/event-me\n\n";
        } else {
            $mailBody .= "Deine Anmeldung und eine eventuell noch ausstehende Zahlung findest du jederzeit hier:\n{$appBaseUrl}/event-me\n\n";
        }
        if ($voucherRow) {
            $mailBody .= "Der Gutschein-Code {$voucherCode} wurde für diese Anmeldung erfolgreich eingelöst.\n\n";
        }
        if ($accountCreationInfo !== null && !empty($accountCreationInfo['verification_url'])) {
            $mailBody .= "Wichtig: Dein Ice-App Account wurde gerade neu erstellt. Bitte bestätige ihn über diesen Link, um die Account-Erstellung abzuschließen:\n";
            $mailBody .= $accountCreationInfo['verification_url'] . "\n\n";
        }
        
        $mailBody .= "Wir freuen uns schon darauf, dich bei der Ice-Tour begrüßen zu dürfen. Bis dahin kannst du in der {$appBaseUrl} schon aktiv werden:\n";
        $mailBody .= "- Profilbild hochladen\n";
        $mailBody .= "- Ein Probe-Eis einchecken\n";
        $mailBody .= "- Bei der aktuellen Geburtstagsaktion mitmachen\n";
        $mailBody .= "- Bei der laufenden Foto-Challenge abstimmen und tolle Preise gewinnen\n\n";
        $mailBody .= "Viele Grüße\nIce-App Team";
        $mailSent = event2026_send_utf8_mail($accountEmail, 'Ice-Tour 2026: Deine Anmeldung und Zahlungsinfos', $mailBody);
    }

    $adminMailBody = "Neue Event-Registrierung eingegangen.\n\n";
    $adminMailBody .= "Registrierung: #{$registrationId}\n";
    $adminMailBody .= "Referenzcode: {$paymentRef}\n";
    $adminMailBody .= "Angelegt von User: {$auth['username']} (#{$auth['user_id']})\n";
    $adminMailBody .= "Teilnehmer: {$fullName}\n";
    $adminMailBody .= "Route: {$routeDefinition['label']}\n";
    $adminMailBody .= "Eigene Startgebühr: " . number_format($breakdown['entry_fee_amount'], 2, ',', '.') . " EUR\n";
    $adminMailBody .= "Gutschein-Käufe: " . number_format($breakdown['gift_voucher_purchase_amount'], 2, ',', '.') . " EUR\n";
    $adminMailBody .= "Gutschein-Abzug: -" . number_format($breakdown['voucher_discount_amount'], 2, ',', '.') . " EUR\n";
    $adminMailBody .= "Zusätzlicher Betrag: " . number_format($donationAmount, 2, ',', '.') . " EUR\n";
    $adminMailBody .= "Gesamt: " . number_format($breakdown['expected_amount'], 2, ',', '.') . " EUR\n";
    $adminMailBody .= "Zahlungsmethode: {$paymentMethod}\n";
    $adminMailBody .= "Newsletter: " . ($newsletterOptIn ? 'Ja' : 'Nein') . "\n";
    $adminMailBody .= "Bemerkung: " . ($registrationNote !== '' ? $registrationNote : '-') . "\n";
    event2026_send_utf8_mail(EVENT2026_ADMIN_NOTIFY_EMAIL, 'Neue Ice-Tour Registrierung #' . $registrationId, $adminMailBody);

    echo json_encode([
        'status' => 'success',
        'message' => $isAutoPaid
            ? 'Anmeldung erfolgreich gespeichert. Dein Gutschein deckt den Gesamtbetrag ab.'
            : 'Anmeldung erfolgreich gespeichert. Bitte Zahlung manuell abschließen.',
        'registration_id' => $registrationId,
        'registration_summary_access_token' => $registrationAccessToken['token'],
        'registration_summary_access_token_expires_at' => $registrationAccessToken['expires_at'],
        'payment_reference_code' => $paymentRef,
        'payment_instruction' => $isAutoPaid
            ? 'Keine Zahlung erforderlich. Dein Gutschein deckt den Gesamtbetrag vollständig ab.'
            : event2026_payment_instruction_text(),
        'payment_expected_amount' => $breakdown['expected_amount'],
        'payment_breakdown' => $breakdown,
        'gift_voucher_quantity' => $giftVoucherQuantity,
        'gift_vouchers_pending_activation' => $giftVoucherQuantity > 0,
        'notification_mail_sent' => $mailSent,
        'account_created_in_flow' => $accountCreationInfo !== null,
        'account_verification_mail_sent' => $accountCreationInfo['verification_mail_sent'] ?? null,
        'participant_slot' => [
            'slot_id' => $slotId,
            'full_name' => $fullName,
            'email' => $email,
            'route_key' => $routeKey,
            'route_label' => $routeDefinition['label'],
            'distance_km' => $distance,
            'clothing_interest' => $clothingInterest,
            'clothing_interest_label' => event2026_clothing_interest_label($clothingInterest),
            'jersey_size' => $jerseyInterest ? $jerseySize : null,
            'bib_size' => $clothingInterest === 'kit_interest' ? $bibSize : null,
        ],
        'voucher_redemption' => $voucherRow ? [
            'code' => $voucherCode,
            'discount_amount' => $breakdown['voucher_discount_amount'],
        ] : null,
        'event' => [
            'reserved_slots' => $reservedAfter,
            'max_participants' => (int) $event['max_participants'],
            'available_slots' => max(0, (int) $event['max_participants'] - $reservedAfter),
        ],
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
