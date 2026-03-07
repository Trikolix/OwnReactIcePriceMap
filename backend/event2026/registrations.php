<?php
require_once __DIR__ . '/bootstrap.php';

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
        'verification_mail_sent' => $mailSent,
    ];
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
        if ($auth) {
            $accountEmail = event2026_fetch_user_email($pdo, (int) $auth['user_id']);
            $regStmt = $pdo->prepare("SELECT COUNT(*) FROM event2026_registrations WHERE event_id = :event_id AND registered_by_user_id = :user_id");
            $regStmt->execute([
                ':event_id' => (int) $event['id'],
                ':user_id' => (int) $auth['user_id'],
            ]);
            $hasRegistration = (int) $regStmt->fetchColumn() > 0;
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
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Methode nicht erlaubt.']);
        exit;
    }

    $data = event2026_json_input();
    $participants = $data['participants'] ?? null;

    if (!is_array($participants) || count($participants) < 1) {
        throw new InvalidArgumentException('Mindestens ein Teilnehmer ist erforderlich.');
    }

    if (count($participants) > 20) {
        throw new InvalidArgumentException('Pro Registrierung sind maximal 20 Teilnehmer erlaubt.');
    }

    if (empty($data['acceptLegal'])) {
        throw new InvalidArgumentException('Die Teilnahmebedingungen müssen akzeptiert werden.');
    }

    $paymentMethod = (string) ($data['paymentMethodPreference'] ?? 'paypal_friends');
    if (!in_array($paymentMethod, ['paypal_friends', 'bank_transfer'], true)) {
        throw new InvalidArgumentException('Ungültige Zahlungsmethode.');
    }

    $newsletterOptIn = !empty($data['newsletter']);
    $registrationNote = trim((string) ($data['registrationNote'] ?? ''));
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

    $legal = event2026_active_legal($pdo, $eventId);
    $legalVersionId = (int) $legal['id'];

    if (!empty($data['legalVersion']) && $data['legalVersion'] !== $legal['version']) {
        throw new InvalidArgumentException('Die Teilnahmebedingungen wurden aktualisiert. Bitte Seite neu laden.');
    }

    $reservedCount = event2026_reserved_count($pdo, $eventId);
    $requestedSlots = count($participants);

    if (($reservedCount + $requestedSlots) > (int) $event['max_participants']) {
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

    $registrationStmt = $pdo->prepare("INSERT INTO event2026_registrations (
        event_id,
        registered_by_user_id,
        team_name,
        payment_reference_code,
        payment_status,
        notes
    ) VALUES (:event_id, :registered_by_user_id, :team_name, :payment_reference_code, 'pending', :notes)");

    $paymentRef = sprintf('ICE26-R%s', strtoupper(bin2hex(random_bytes(4))));

    $registrationStmt->execute([
        ':event_id' => $eventId,
        ':registered_by_user_id' => $auth['user_id'],
        ':team_name' => trim((string) ($data['teamName'] ?? '')) ?: null,
        ':payment_reference_code' => $paymentRef,
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
        distance_km,
        pace_group,
        women_wave_opt_in,
        public_name_consent,
        jersey_interest,
        jersey_size,
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
        :distance_km,
        :pace_group,
        :women_wave_opt_in,
        :public_name_consent,
        :jersey_interest,
        :jersey_size,
        'pending_payment',
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
        status
    ) VALUES (:registration_id, :method, :expected_amount, 0, 'pending')");

    $ipHash = event2026_hash_nullable($_SERVER['REMOTE_ADDR'] ?? null);
    $uaHash = event2026_hash_nullable($_SERVER['HTTP_USER_AGENT'] ?? null);

    $slotResults = [];
    $appBaseUrl = 'https://ice-app.de/#';
    $mailInviteLinks = [];

    foreach ($participants as $index => $participant) {
        $fullName = trim((string) ($participant['name'] ?? ''));
        $email = trim((string) ($participant['email'] ?? ''));
        if ($index === 0 && $accountEmail) {
            $email = $accountEmail;
        }
        $distance = (int) ($participant['distance'] ?? 140);
        $paceGroup = trim((string) ($participant['paceGroup'] ?? '24_27'));
        $womenWaveOptIn = !empty($participant['womenWaveOptIn']) ? 1 : 0;
        $publicNameConsent = array_key_exists('publicNameConsent', $participant) ? (!empty($participant['publicNameConsent']) ? 1 : 0) : 1;
        $jerseyInterest = !empty($participant['jerseyInterest']) ? 1 : 0;
        $jerseySize = trim((string) ($participant['jerseySize'] ?? ''));

        if ($fullName === '' || $email === '') {
            throw new InvalidArgumentException('Für alle Teilnehmer sind Name und E-Mail erforderlich.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Mindestens eine E-Mail-Adresse ist ungültig.');
        }

        if (!in_array($distance, [140, 175], true)) {
            throw new InvalidArgumentException('Ungültige Distanz gewählt.');
        }

        $allowedPaceGroups = ['unter_24', '24_27', '27_30', 'ueber_30'];
        if (!in_array($paceGroup, $allowedPaceGroups, true)) {
            throw new InvalidArgumentException('Ungültige Selbsteinschätzung der Geschwindigkeit.');
        }

        if ($jerseyInterest && $jerseySize === '') {
            throw new InvalidArgumentException('Bitte gib eine Trikotgröße an, wenn Interesse besteht.');
        }

        $slotStmt->execute([
            ':registration_id' => $registrationId,
            ':event_id' => $eventId,
            ':user_id' => $index === 0 ? $auth['user_id'] : null,
            ':full_name' => $fullName,
            ':email' => $email,
            ':distance_km' => $distance,
            ':pace_group' => $paceGroup,
            ':women_wave_opt_in' => $womenWaveOptIn,
            ':public_name_consent' => $publicNameConsent,
            ':jersey_interest' => $jerseyInterest,
            ':jersey_size' => $jerseyInterest ? $jerseySize : null,
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

        $invitePayload = null;
        if ($index > 0) {
            $invite = event2026_create_invite_token($pdo, $slotId);
            $invitePayload = [
                'status' => 'created',
                'token' => $invite['token'],
                'expires_at' => $invite['expires_at'],
            ];
            $mailInviteLinks[] = [
                'full_name' => $fullName,
                'link' => $appBaseUrl . '/event-invite/' . $invite['token'],
            ];
        }

        $slotResults[] = [
            'slot_id' => $slotId,
            'full_name' => $fullName,
            'email' => $email,
            'claim_token_status' => $invitePayload,
        ];
    }

    $expectedAmount = count($participants) * EVENT2026_ENTRY_FEE;
    $paymentStmt->execute([
        ':registration_id' => $registrationId,
        ':method' => $paymentMethod,
        ':expected_amount' => $expectedAmount,
    ]);

    event2026_log_action($pdo, $eventId, $auth['user_id'], 'registration_create', 'registration', $registrationId, [
        'participants' => count($participants),
        'payment_method' => $paymentMethod,
        'expected_amount' => $expectedAmount,
        'account_created_in_flow' => $accountCreationInfo !== null,
    ]);

    $pdo->commit();

    $reservedAfter = event2026_reserved_count($pdo, $eventId);

    $mailSent = false;
    if ($accountEmail) {
        $mailBody = "Hallo {$auth['username']},\n\n";
        $mailBody .= "deine Anmeldung zur Ice-Tour 2026 wurde gespeichert.\n\n";
        $mailBody .= "Registrierung: #{$registrationId}\n";
        $mailBody .= "Referenzcode: {$paymentRef}\n";
        $mailBody .= "Erwarteter Betrag: " . number_format($expectedAmount, 2, ',', '.') . " EUR\n";
        $mailBody .= "Zahlungsmethode: {$paymentMethod}\n\n";
        $mailBody .= "Bitte zahle mit dem Referenzcode im Betreff/Verwendungszweck.\n";
        $mailBody .= "Die Freigabe erfolgt nach Prüfung.\n\n";
        if ($mailInviteLinks) {
            $mailBody .= "Invite-Links für weitere Starterplätze:\n";
            foreach ($mailInviteLinks as $inviteRow) {
                $mailBody .= "- {$inviteRow['full_name']}: {$inviteRow['link']}\n";
            }
            $mailBody .= "\n";
        }
        $mailBody .= "Dein Dashboard: {$appBaseUrl}/event-me\n\n";
        $mailBody .= "Viele Grüße\nIce-App Team";
        $mailSent = event2026_send_utf8_mail($accountEmail, 'Ice-Tour 2026: Deine Anmeldung und Zahlungsinfos', $mailBody);
    }

    $participantNames = implode(', ', array_map(static function (array $slot): string {
        return (string) ($slot['full_name'] ?? '');
    }, $slotResults));

    $adminMailBody = "Neue Event-Registrierung eingegangen.\n\n";
    $adminMailBody .= "Registrierung: #{$registrationId}\n";
    $adminMailBody .= "Referenzcode: {$paymentRef}\n";
    $adminMailBody .= "Angelegt von User: {$auth['username']} (#{$auth['user_id']})\n";
    $adminMailBody .= "Team: " . (trim((string) ($data['teamName'] ?? '')) ?: '-') . "\n";
    $adminMailBody .= "Teilnehmer (" . count($participants) . "): {$participantNames}\n";
    $adminMailBody .= "Erwarteter Betrag: " . number_format($expectedAmount, 2, ',', '.') . " EUR\n";
    $adminMailBody .= "Zahlungsmethode: {$paymentMethod}\n";
    $adminMailBody .= "Newsletter: " . ($newsletterOptIn ? 'Ja' : 'Nein') . "\n";
    $adminMailBody .= "Bemerkung: " . ($registrationNote !== '' ? $registrationNote : '-') . "\n";
    $adminMailBody .= "\nZeit: " . (new DateTimeImmutable('now'))->format('Y-m-d H:i:s') . "\n";
    event2026_send_utf8_mail(EVENT2026_ADMIN_NOTIFY_EMAIL, 'Neue Ice-Tour Registrierung #' . $registrationId, $adminMailBody);

    echo json_encode([
        'status' => 'success',
        'message' => 'Anmeldung erfolgreich gespeichert. Bitte Zahlung manuell abschließen.',
        'registration_id' => $registrationId,
        'registration_summary_access_token' => $registrationAccessToken['token'],
        'registration_summary_access_token_expires_at' => $registrationAccessToken['expires_at'],
        'payment_reference_code' => $paymentRef,
        'payment_instruction' => 'Bitte per PayPal Freunde oder Überweisung mit dem Referenzcode zahlen. Finale Freigabe erfolgt nach Prüfung.',
        'payment_expected_amount' => $expectedAmount,
        'notification_mail_sent' => $mailSent,
        'account_created_in_flow' => $accountCreationInfo !== null,
        'account_verification_mail_sent' => $accountCreationInfo['verification_mail_sent'] ?? null,
        'participant_slots' => $slotResults,
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
