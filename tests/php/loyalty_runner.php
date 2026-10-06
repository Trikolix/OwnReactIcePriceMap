<?php
require getenv('ICE_LOYALTY_TEST_BACKEND').'/db_connect.php';
require getenv('ICE_LOYALTY_TEST_BACKEND').'/lib/shop_operators.php';
try { echo json_encode(loyaltyBook($pdo, (int)$argv[1], json_decode(base64_decode($argv[2]),true))); }
catch (LoyaltyError $e) { echo json_encode(['error'=>$e->getCode(),'message'=>$e->getMessage()]); }
