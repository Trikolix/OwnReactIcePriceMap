<?php

function apiJson(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function apiMethod(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        apiJson(['status' => 'error', 'message' => 'HTTP-Methode nicht erlaubt.'], 405);
    }
}

function apiInput(): array
{
    apiMethod('POST');
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
        apiJson(['status' => 'error', 'message' => 'JSON erforderlich.'], 415);
    }
    $raw = file_get_contents('php://input', false, null, 0, 524289);
    if (strlen($raw) > 524288) apiJson(['status' => 'error', 'message' => 'Anfrage zu groß.'], 413);
    $input = json_decode($raw, true);
    if (!is_array($input) || substr(ltrim($raw), 0, 1) !== '{' || json_last_error() !== JSON_ERROR_NONE) {
        apiJson(['status' => 'error', 'message' => 'Ungültiges JSON.'], 400);
    }
    return $input;
}
