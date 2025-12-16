<?php
header('Content-Type: application/json');
echo json_encode([
    'server' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? null,
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
    ],
    'getallheaders' => function_exists('getallheaders') ? getallheaders() : null,
    'apache_request_headers' => function_exists('apache_request_headers') ? apache_request_headers() : null,
]);