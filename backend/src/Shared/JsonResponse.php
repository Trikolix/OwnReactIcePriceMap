<?php

function json_success(array $payload = [], int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['status' => 'success'], $payload), JSON_UNESCAPED_UNICODE);
}

function json_error(string $message, int $statusCode = 400, array $payload = []): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['status' => 'error', 'message' => $message], $payload), JSON_UNESCAPED_UNICODE);
}
