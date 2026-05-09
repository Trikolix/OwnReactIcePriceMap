<?php

function iceapp_request_id(): string
{
    static $requestId = null;
    if ($requestId === null) {
        try {
            $requestId = bin2hex(random_bytes(8));
        } catch (Throwable $e) {
            $requestId = uniqid('req_', true);
        }
    }

    return $requestId;
}

function iceapp_client_ip(): ?string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $header) {
        if (empty($_SERVER[$header])) {
            continue;
        }

        $value = (string) $_SERVER[$header];
        if ($header === 'HTTP_X_FORWARDED_FOR') {
            $parts = explode(',', $value);
            return trim($parts[0]);
        }

        return trim($value);
    }

    return null;
}

function iceapp_hash_for_log(?string $value): ?string
{
    $value = trim((string) $value);
    if ($value === '') {
        return null;
    }

    return substr(hash('sha256', $value), 0, 16);
}

function iceapp_request_log_context(array $extra = []): array
{
    $context = [
        'request_id' => iceapp_request_id(),
        'method' => $_SERVER['REQUEST_METHOD'] ?? null,
        'uri' => $_SERVER['REQUEST_URI'] ?? ($_SERVER['SCRIPT_NAME'] ?? null),
        'script' => $_SERVER['SCRIPT_NAME'] ?? null,
        'origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
        'host' => $_SERVER['HTTP_HOST'] ?? null,
        'referer' => $_SERVER['HTTP_REFERER'] ?? null,
        'ip_hash' => iceapp_hash_for_log(iceapp_client_ip()),
        'user_agent_hash' => iceapp_hash_for_log($_SERVER['HTTP_USER_AGENT'] ?? null),
    ];

    return array_merge($context, $extra);
}

function iceapp_log_event(string $event, array $context = []): void
{
    $payload = iceapp_request_log_context($context);
    error_log('[iceapp] ' . $event . ' ' . json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}
