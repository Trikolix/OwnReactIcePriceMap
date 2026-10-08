<?php
$root = getenv('ICE_ONBOARDING_TEST_ROOT');
if (!$root || !str_starts_with($root, '/tmp/ice-onboarding-test/')) throw new RuntimeException('Isolated test root required');
require_once $root . '/lib/onboarding.php';
echo count(claimOnboardingAward($pdo, 42, 2)['awards']);
