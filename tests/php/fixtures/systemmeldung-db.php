<?php
// Copied into an isolated backend directory by the test harness. Never use production credentials.
$pdo = new PDO('mysql:host=127.0.0.1;dbname=ice_system_test;charset=utf8mb4', 'root', 'isolated-test-password', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
$env = [];
