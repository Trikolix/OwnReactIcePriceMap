<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../lib/mail.php';

const EVENT2026_CONTACT_NOTIFY_EMAIL = 'admin@ice-app.de';
const EVENT2026_CONTACT_RATE_LIMIT = 5;
const EVENT2026_CONTACT_RATE_WINDOW_MINUTES = 15;

function event2026_contact_ensure_rate_limit_table(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS rate_limit (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_rate_limit_ip_time (ip_address, timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function event2026_contact_normalize_nullable_string($value, int $maxLength): ?string
{
    $text = trim((string) ($value ?? ''));
    if ($text === '') {
        return null;
    }

    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $maxLength);
    }

    return substr($text, 0, $maxLength);
}

function event2026_contact_text_too_long(string $value, int $maxLength): bool
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value) > $maxLength;
    }

    return strlen($value) > $maxLength;
}

function event2026_contact_log_attempt(PDO $pdo, string $ipAddress): void
{
    $stmt = $pdo->prepare("INSERT INTO rate_limit (ip_address) VALUES (:ip_address)");
    $stmt->execute([':ip_address' => $ipAddress]);
}

function event2026_contact_is_rate_limited(PDO $pdo, string $ipAddress): bool
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM rate_limit
        WHERE ip_address = :ip_address
          AND timestamp > NOW() - INTERVAL " . EVENT2026_CONTACT_RATE_WINDOW_MINUTES . " MINUTE
    ");
    $stmt->execute([':ip_address' => $ipAddress]);
    return (int) $stmt->fetchColumn() >= EVENT2026_CONTACT_RATE_LIMIT;
}

function event2026_contact_sanitize_source_page($value): string
{
    $raw = trim((string) ($value ?? ''));
    if ($raw === '') {
        return 'ice-tour';
    }

    $sanitized = preg_replace('/[^a-z0-9_-]+/i', '-', $raw);
    $sanitized = trim((string) $sanitized, '-');
    if ($sanitized === '') {
        return 'ice-tour';
    }

    if (function_exists('mb_substr')) {
        return mb_substr($sanitized, 0, 64);
    }

    return substr($sanitized, 0, 64);
}

function event2026_contact_store_request(
    PDO $pdo,
    int $eventId,
    ?int $submittedByUserId,
    string $sourcePage,
    string $name,
    string $email,
    ?string $organisation,
    ?string $phone,
    string $message,
    string $status,
    ?string $ipHash,
    ?string $userAgentHash,
    int $spamScore,
    int $isFlagged
): int {
    $stmt = $pdo->prepare("
        INSERT INTO event2026_contact_requests (
            event_id,
            submitted_by_user_id,
            source_page,
            name,
            email,
            organisation,
            phone,
            message,
            status,
            ip_hash,
            user_agent_hash,
            spam_score,
            is_flagged
        ) VALUES (
            :event_id,
            :submitted_by_user_id,
            :source_page,
            :name,
            :email,
            :organisation,
            :phone,
            :message,
            :status,
            :ip_hash,
            :user_agent_hash,
            :spam_score,
            :is_flagged
        )
    ");
    $stmt->execute([
        ':event_id' => $eventId,
        ':submitted_by_user_id' => $submittedByUserId,
        ':source_page' => $sourcePage,
        ':name' => $name,
        ':email' => $email,
        ':organisation' => $organisation,
        ':phone' => $phone,
        ':message' => $message,
        ':status' => $status,
        ':ip_hash' => $ipHash,
        ':user_agent_hash' => $userAgentHash,
        ':spam_score' => $spamScore,
        ':is_flagged' => $isFlagged,
    ]);

    return (int) $pdo->lastInsertId();
}

try {
    event2026_ensure_schema($pdo);
    event2026_contact_ensure_rate_limit_table($pdo);
    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $auth = authenticateRequest($pdo);
    $submittedByUserId = $auth ? (int) $auth['user_id'] : null;

    $data = event2026_json_input();
    $name = trim((string) ($data['name'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $organisationRaw = trim((string) ($data['organisation'] ?? ''));
    $phoneRaw = trim((string) ($data['phone'] ?? ''));
    $message = trim((string) ($data['message'] ?? ''));
    $sourcePage = event2026_contact_sanitize_source_page($data['sourcePage'] ?? 'ice-tour');
    $website = trim((string) ($data['website'] ?? ''));
    $privacyAccepted = !empty($data['privacyAccepted']);

    $clientIp = getClientIpAddress() ?? ($_SERVER['REMOTE_ADDR'] ?? '');
    $ipHash = event2026_hash_optional($clientIp);
    $userAgentHash = event2026_hash_optional(getClientUserAgent());

    if ($clientIp !== '') {
        if (event2026_contact_is_rate_limited($pdo, $clientIp)) {
            event2026_log_action($pdo, $eventId, $submittedByUserId, 'contact_request_rate_limited', 'event', $eventId, [
                'source_page' => $sourcePage,
                'ip_hash' => $ipHash,
            ]);
            http_response_code(429);
            echo json_encode([
                'status' => 'error',
                'message' => 'Zu viele Anfragen in kurzer Zeit. Bitte versuche es in einigen Minuten erneut.',
            ]);
            exit;
        }

        event2026_contact_log_attempt($pdo, $clientIp);
    }

    if ($website !== '') {
        $requestId = event2026_contact_store_request(
            $pdo,
            $eventId,
            $submittedByUserId,
            $sourcePage,
            event2026_contact_normalize_nullable_string($name, 120) ?? '',
            event2026_contact_normalize_nullable_string($email, 190) ?? '',
            $organisation,
            $phone,
            event2026_contact_normalize_nullable_string($message, 4000) ?? '',
            'archived',
            $ipHash,
            $userAgentHash,
            100,
            1
        );

        event2026_log_action($pdo, $eventId, $submittedByUserId, 'contact_request_flagged', 'contact_request', $requestId, [
            'reason' => 'honeypot',
            'source_page' => $sourcePage,
        ]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Vielen Dank. Deine Anfrage wurde übermittelt.',
            'request_id' => $requestId,
        ]);
        exit;
    }

    $fieldErrors = [];
    if ($name === '') {
        $fieldErrors['name'] = 'Bitte gib deinen Namen an.';
    } elseif (event2026_contact_text_too_long($name, 120)) {
        $fieldErrors['name'] = 'Der Name ist zu lang.';
    }

    if ($email === '') {
        $fieldErrors['email'] = 'Bitte gib deine E-Mail-Adresse an.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $fieldErrors['email'] = 'Bitte gib eine gültige E-Mail-Adresse an.';
    } elseif (event2026_contact_text_too_long($email, 190)) {
        $fieldErrors['email'] = 'Die E-Mail-Adresse ist zu lang.';
    }

    if ($message === '') {
        $fieldErrors['message'] = 'Bitte beschreibe dein Anliegen.';
    } elseif (event2026_contact_text_too_long($message, 4000)) {
        $fieldErrors['message'] = 'Die Nachricht ist zu lang.';
    }

    if (!$privacyAccepted) {
        $fieldErrors['privacyAccepted'] = 'Bitte bestätige den Datenschutz-Hinweis.';
    }

    if ($organisationRaw !== '' && event2026_contact_text_too_long($organisationRaw, 160)) {
        $fieldErrors['organisation'] = 'Die Organisationsangabe ist zu lang.';
    }

    if ($phoneRaw !== '' && event2026_contact_text_too_long($phoneRaw, 40)) {
        $fieldErrors['phone'] = 'Die Telefonnummer ist zu lang.';
    }

    if ($fieldErrors) {
        event2026_log_action($pdo, $eventId, $submittedByUserId, 'contact_request_validation_failed', 'event', $eventId, [
            'source_page' => $sourcePage,
            'ip_hash' => $ipHash,
            'fields' => array_keys($fieldErrors),
        ]);

        http_response_code(422);
        echo json_encode([
            'status' => 'error',
            'message' => 'Bitte prüfe deine Angaben.',
            'field_errors' => $fieldErrors,
        ]);
        exit;
    }

    $organisation = event2026_contact_normalize_nullable_string($organisationRaw, 160);
    $phone = event2026_contact_normalize_nullable_string($phoneRaw, 40);

    $requestId = event2026_contact_store_request(
        $pdo,
        $eventId,
        $submittedByUserId,
        $sourcePage,
        $name,
        $email,
        $organisation,
        $phone,
        $message,
        'new',
        $ipHash,
        $userAgentHash,
        0,
        0
    );

    event2026_log_action($pdo, $eventId, $submittedByUserId, 'contact_request_create', 'contact_request', $requestId, [
        'source_page' => $sourcePage,
        'email' => $email,
        'organisation' => $organisation,
    ]);

    $mailBody = "Neue Kontaktanfrage zur Ice-Tour\n\n";
    $mailBody .= "Anfrage-ID: #{$requestId}\n";
    $mailBody .= "Quelle: {$sourcePage}\n";
    $mailBody .= "Name: {$name}\n";
    $mailBody .= "E-Mail: {$email}\n";
    if ($organisation) {
        $mailBody .= "Organisation: {$organisation}\n";
    }
    if ($phone) {
        $mailBody .= "Telefon: {$phone}\n";
    }
    $mailBody .= "\nNachricht:\n{$message}\n";
    iceapp_send_utf8_text_mail(EVENT2026_CONTACT_NOTIFY_EMAIL, 'Ice-Tour 2026: Neue Kontaktanfrage', $mailBody);

    echo json_encode([
        'status' => 'success',
        'message' => 'Vielen Dank. Deine Anfrage ist angekommen und wir melden uns per E-Mail zurück.',
        'request_id' => $requestId,
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
