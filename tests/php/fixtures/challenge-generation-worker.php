<?php
// Match multipart/form-data: PHP receives strings, including the boolean flag.
$_POST = array_map(static fn($value) => is_bool($value) ? ($value ? 'true' : 'false') : (string)$value,
    json_decode($argv[1], true, 512, JSON_THROW_ON_ERROR));
putenv('CHALLENGE_TEST_NOW=' . $argv[2]);
require getenv('CHALLENGE_TEST_BACKEND') . '/api/challenge_generate.php';
