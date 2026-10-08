<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=ice_onboarding_test;charset=utf8mb4', 'root', 'isolated-onboarding-password', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
$env = [];
