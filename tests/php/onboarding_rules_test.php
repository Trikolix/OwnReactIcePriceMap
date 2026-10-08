<?php
require_once __DIR__ . '/../../backend/lib/onboarding_rules.php';
function checkOnboarding(bool $value, string $message): void {
    if (!$value) throw new RuntimeException($message);
    echo "PASS $message\n";
}
$complete = ['avatar' => true, 'app_installed' => true, 'push_active' => true, 'checkins' => 5,
    'invite_shared' => true, 'social_account' => true, 'created_shops_with_checkin' => 1,
    'reviews' => 1, 'completed_challenges' => 1, 'routes' => 1, 'foreign_likes' => 10];
checkOnboarding(!in_array(false, onboardingStages($complete)[1], true), 'All six starter prerequisites allow completion');
checkOnboarding(!in_array(false, onboardingStages($complete)[2], true), 'All six expert prerequisites allow completion');
foreach (['avatar', 'app_installed', 'push_active', 'checkins', 'invite_shared', 'social_account'] as $field) {
    $incomplete = $complete; $incomplete[$field] = false;
    checkOnboarding(in_array(false, onboardingStages($incomplete)[1], true), "Missing $field prevents starter award");
}
foreach (['created_shops_with_checkin', 'reviews', 'completed_challenges', 'routes', 'foreign_likes'] as $field) {
    $incomplete = $complete; $incomplete[$field] = $field === 'foreign_likes' ? 9 : 0;
    checkOnboarding(in_array(false, onboardingStages($incomplete)[2], true), "Missing $field prevents expert award");
}
$incomplete = $complete; $incomplete['checkins'] = 4;
checkOnboarding(!onboardingStages($incomplete)[2]['checkins'], 'Four check-ins do not satisfy the five-check-in requirement');
$complete['invite_shared'] = false; $complete['invited_count'] = 1;
checkOnboarding(onboardingStages($complete)[1]['invitation'], 'A verified invitation also completes the invitation step');
$complete['invited_count'] = 0; $complete['invited_pending_count'] = 1;
checkOnboarding(!onboardingStages($complete)[1]['invitation'], 'An unverified invitation alone does not complete the step');
