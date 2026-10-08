<?php
$root = getenv('ICE_ONBOARDING_TEST_ROOT');
if (!$root || !str_starts_with($root, '/tmp/ice-onboarding-test/')) throw new RuntimeException('Isolated test root required');
require_once $root . '/db_connect.php';
if ($pdo->query('SELECT DATABASE()')->fetchColumn() !== 'ice_onboarding_test') throw new RuntimeException('Test database required');
$pdo->exec("CREATE TABLE nutzer (id INT PRIMARY KEY, username VARCHAR(100), invite_code VARCHAR(100), invited_by INT NULL,
    is_verified TINYINT DEFAULT 1, deletion_requested_at DATETIME NULL, instagram_account VARCHAR(255), strava_account VARCHAR(255), current_level INT DEFAULT 1);
CREATE TABLE user_api_tokens (id INT PRIMARY KEY, user_id INT, token_hash CHAR(64), last_used_at DATETIME, expires_at DATETIME, revoked_at DATETIME NULL);
CREATE TABLE user_notification_settings (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, INDEX(user_id), notify_checkin_mention TINYINT DEFAULT 1,
    notify_comment TINYINT DEFAULT 1, notify_comment_participated TINYINT DEFAULT 1, notify_news TINYINT DEFAULT 0, notify_team_challenge TINYINT DEFAULT 1, updated_at DATETIME);
CREATE TABLE awards (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) UNIQUE, category VARCHAR(100));
CREATE TABLE award_levels (id INT AUTO_INCREMENT PRIMARY KEY, award_id INT, level INT, threshold INT, icon_path VARCHAR(255), title_de VARCHAR(100), description_de TEXT, ep INT, UNIQUE(award_id, level));
CREATE TABLE user_awards (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, award_id INT, level INT, awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE checkins (id INT PRIMARY KEY, nutzer_id INT, eisdiele_id INT, context_type VARCHAR(32));
CREATE TABLE eisdielen (id INT PRIMARY KEY, user_id INT, place_type VARCHAR(32));
CREATE TABLE bewertungen (id INT PRIMARY KEY, nutzer_id INT);
CREATE TABLE challenges (id INT PRIMARY KEY, nutzer_id INT, completed TINYINT);
CREATE TABLE routen (id INT PRIMARY KEY, nutzer_id INT);
CREATE TABLE kommentare (id INT PRIMARY KEY, nutzer_id INT);
CREATE TABLE bilder (id INT PRIMARY KEY, checkin_id INT);
CREATE TABLE preise (id INT PRIMARY KEY, gemeldet_von INT, is_reward_eligible TINYINT);
CREATE TABLE level_system (level INT PRIMARY KEY, ep_min INT, level_name VARCHAR(100));
CREATE TABLE benachrichtigungen (id INT AUTO_INCREMENT PRIMARY KEY, empfaenger_id INT, typ VARCHAR(32), referenz_id INT, text TEXT, zusatzdaten TEXT);
CREATE TABLE systemmeldungen (id INT PRIMARY KEY, state VARCHAR(32));
INSERT INTO nutzer(id, username, invite_code, instagram_account) VALUES (1, 'Admin', 'admin', ''), (42, 'Mia', 'mia-code', ''), (43, 'Jonas', 'jonas-code', '');
INSERT INTO user_notification_settings(user_id, notify_comment, notify_news) VALUES (42, 0, 0), (43, 1, 0);
INSERT INTO awards VALUES (77, 'existing_unrelated_award', 'Preserve');
INSERT INTO level_system VALUES (1,0,'Eisfreund'),(2,100,'Eisentdecker');");
foreach ([1,42,43] as $id) $pdo->prepare('INSERT INTO user_api_tokens VALUES (?, ?, ?, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), NULL)')->execute([$id, $id, hash('sha256', 'token-' . $id)]);
require_once $root . '/lib/onboarding.php';
$checks = 0;
function verifyOnboarding(bool $value, string $message): void {
    global $checks; if (!$value) throw new RuntimeException($message); $checks++; echo "PASS $message\n";
}
$server = proc_open([PHP_BINARY, '-S', '127.0.0.1:18098', '-t', dirname($root)], [0=>['pipe','r'],1=>['file','/tmp/ice-onboarding-test/server.log','a'],2=>['file','/tmp/ice-onboarding-test/server.log','a']], $pipes);
function apiOnboarding(string $path, string $method = 'GET', ?array $body = null, ?int $user = 42): array {
    $headers = "Content-Type: application/json\r\n" . ($user ? "Authorization: Bearer token-$user\r\n" : '');
    $context = stream_context_create(['http' => ['method' => $method, 'header' => $headers, 'content' => $body === null ? '' : json_encode($body), 'ignore_errors' => true]]);
    $response = file_get_contents('http://127.0.0.1:18098/backend/' . $path, false, $context);
    preg_match('/\s(\d{3})\s/', $http_response_header[0] ?? '', $match);
    $json = json_decode($response, true);
    if (!is_array($json)) throw new RuntimeException('Invalid endpoint response: ' . $response);
    return ['status' => (int)($match[1] ?? 0), 'json' => $json];
}
usleep(200000);
try {
    verifyOnboarding(apiOnboarding('api/onboarding.php', 'GET', null, null)['status'] === 401, 'Onboarding requires authentication');
    $progress = apiOnboarding('api/onboarding.php')['json']['data'];
    verifyOnboarding($progress['invite_code'] === 'mia-code' && $progress['stats']['checkins'] === 0, 'Onboarding loads the authenticated user');
    verifyOnboarding($progress['award_id'] !== 77 && $pdo->query('SELECT code FROM awards WHERE id=77')->fetchColumn() === 'existing_unrelated_award', 'Award seed preserves an occupied remote award ID');
    verifyOnboarding(apiOnboarding('api/claim_onboarding_award.php', 'POST', ['level'=>1,'user_id'=>43,'completed'=>true])['json']['new_awards'] === [], 'Claim ignores invented completion and foreign user IDs');
    verifyOnboarding(apiOnboarding('api/claim_onboarding_award.php','POST',['level'=>999])['status'] === 422, 'Unknown award levels are rejected');
    apiOnboarding('api/update_user_notification_settings.php','POST',['show_onboarding_checklist'=>0]);
    $settings = apiOnboarding('api/get_user_notification_settings.php')['json'];
    verifyOnboarding($settings['show_onboarding_checklist'] === 0 && $settings['notify_comment'] === 0 && $settings['notify_news'] === 0, 'Hiding onboarding preserves notification preferences');
    verifyOnboarding((int)$pdo->query('SELECT COUNT(*) FROM user_notification_settings WHERE user_id=42')->fetchColumn() === 1, 'Saving updates the existing row without requiring a unique user index');
    apiOnboarding('api/update_user_notification_settings.php','POST',['show_onboarding_checklist'=>1]);
    verifyOnboarding(apiOnboarding('api/onboarding.php')['json']['data']['visible'] === true, 'Re-enabling onboarding remains visible on the next API read');
    $pdo->exec('INSERT INTO user_notification_settings(user_id, show_onboarding_checklist, notify_comment, notify_news) VALUES (42,0,0,0)');
    apiOnboarding('api/update_user_notification_settings.php','POST',['show_onboarding_checklist'=>1]);
    verifyOnboarding((int)$pdo->query('SELECT COUNT(*) FROM user_notification_settings WHERE user_id=42 AND show_onboarding_checklist=0')->fetchColumn() === 0, 'Existing duplicate rows cannot retain a stale onboarding visibility');
    verifyOnboarding((int)$pdo->query('SELECT COUNT(*) FROM user_notification_settings WHERE user_id=42')->fetchColumn() === 2, 'Saving with existing duplicates does not create more rows');
    apiOnboarding('api/update_user_notification_settings.php','POST',['notify_like'=>1],43);
    verifyOnboarding(apiOnboarding('api/get_user_notification_settings.php','GET',null,43)['json']['notify_like'] === 1, 'Newly enabled like preferences are saved explicitly');
    apiOnboarding('api/update_user_notification_settings.php','POST',['show_onboarding_checklist'=>0],1);
    verifyOnboarding(apiOnboarding('api/onboarding.php','GET',null,1)['json']['data']['visible'] === false, 'A user without settings can save a first partial preference');
    verifyOnboarding(apiOnboarding('api/update_user_notification_settings.php','POST',['user_id'=>43,'notify_news'=>1])['status'] === 403, 'Preferences cannot be changed for another user');
    $subscription = ['endpoint'=>'https://push.invalid/first','keys'=>['p256dh'=>'key','auth'=>'auth']];
    verifyOnboarding(apiOnboarding('api/push/web-subscriptions/index.php','POST',['subscription'=>$subscription])['status'] === 409, 'Background sync cannot enable account-wide opt-out');
    $first = apiOnboarding('api/push/web-subscriptions/index.php','POST',['subscription'=>$subscription,'activate'=>true])['json']['subscription_token'];
    $subscription['endpoint'] = 'https://push.invalid/second';
    $second = apiOnboarding('api/push/web-subscriptions/index.php','POST',['subscription'=>$subscription,'activate'=>true])['json']['subscription_token'];
    $devices = apiOnboarding('api/push/web-subscriptions/index.php?devices=1&endpoint='.urlencode('https://push.invalid/first'))['json']['devices'];
    verifyOnboarding(count($devices) === 2 && !isset($devices[0]['subscription_token']), 'Device overview is owner-scoped and does not expose bearer tokens');
    verifyOnboarding(array_sum(array_column($devices,'is_current')) === 1, 'Device overview identifies the current browser');
    verifyOnboarding(apiOnboarding('api/push/web-subscriptions/index.php?devices=1','GET',null,43)['json']['devices'] === [], 'Other users cannot list these devices');
    apiOnboarding('api/push/web-subscriptions/index.php','DELETE',[]);
    verifyOnboarding(count(apiOnboarding('api/push/web-subscriptions/index.php?devices=1')['json']['devices']) === 2, 'Deleting without an endpoint does not disable all devices');
    apiOnboarding('api/push/web-subscriptions/index.php','DELETE',['endpoint'=>'https://push.invalid/first']);
    verifyOnboarding(count(apiOnboarding('api/push/web-subscriptions/index.php?devices=1')['json']['devices']) === 1, 'A device can be disabled without disabling the other browser');
    verifyOnboarding(apiOnboarding('api/push/web-subscriptions/index.php?check=1&subscription_token='.$first)['json']['revoked'], 'Revocation remains visible to startup repair');
    $revokedSubscription = $subscription;
    $revokedSubscription['endpoint'] = 'https://push.invalid/first';
    verifyOnboarding(apiOnboarding('api/push/web-subscriptions/index.php','POST',['subscription'=>$revokedSubscription])['status'] === 409, 'Background sync cannot reactivate a remotely revoked device');
    verifyOnboarding(apiOnboarding('api/push/web-subscriptions/index.php','POST',['renewal'=>true,'previous_subscription_token'=>$first,'subscription'=>$subscription],null)['status'] === 403, 'Revoked devices cannot renew in the background');
    $subscription['endpoint'] = 'https://push.invalid/renewed';
    $renewed = apiOnboarding('api/push/web-subscriptions/index.php','POST',['renewal'=>true,'previous_subscription_token'=>$second,'subscription'=>$subscription],null);
    verifyOnboarding($renewed['status'] === 200 && $renewed['json']['subscription_token'] === $second, 'An active worker renews without losing its device identity or queued deliveries');
    verifyOnboarding(apiOnboarding('api/push/send-test.php','POST',[])['status'] === 403, 'Test push remains restricted to the admin');
    apiOnboarding('api/push/web-subscriptions/index.php','DELETE',['endpoint'=>'https://push.invalid/renewed','all_devices'=>true]);
    verifyOnboarding(apiOnboarding('api/push/web-subscriptions/index.php?devices=1')['json']['devices'] === [], 'Explicit all-device revocation works even with a current endpoint');
    apiOnboarding('api/push/web-subscriptions/index.php','POST',['subscription'=>$subscription,'activate'=>true]);
    $pdo->exec("INSERT INTO user_profile_images(user_id,avatar_path) VALUES (42,'avatar.png'); UPDATE nutzer SET instagram_account='mia' WHERE id=42;
        INSERT INTO eisdielen VALUES (7,42,'kiosk'); INSERT INTO checkins VALUES (1,42,7,'ice_shop');");
    apiOnboarding('api/onboarding.php','POST',['action'=>'app_installed']);
    apiOnboarding('api/onboarding.php','POST',['action'=>'invite_shared']);
    $award = apiOnboarding('api/claim_onboarding_award.php','POST',['level'=>1]);
    verifyOnboarding(count($award['json']['new_awards'] ?? []) === 1, 'Eligible starter receives the seeded award');
    verifyOnboarding(apiOnboarding('api/claim_onboarding_award.php','POST',['level'=>1])['json']['new_awards'] === [], 'Repeated claims do not duplicate awards or EP');
    verifyOnboarding(!apiOnboarding('api/onboarding.php')['json']['data']['stages'][2]['shop'], 'Other place types do not satisfy the ice-shop requirement');
    $pdo->exec("UPDATE eisdielen SET place_type='ice_shop' WHERE id=7; INSERT INTO checkins VALUES (2,42,7,'ice_shop'),(3,42,7,'ice_shop'),(4,42,7,'ice_shop'),(5,42,7,'ice_shop');
        INSERT INTO bewertungen VALUES (1,42); INSERT INTO challenges VALUES (1,42,1); INSERT INTO routen VALUES (1,42);");
    for ($i=10; $i<20; $i++) { $pdo->exec("INSERT INTO checkins VALUES ($i,43,7,'ice_shop'); INSERT INTO likes(user_id,entity_type,entity_id) VALUES (42,'checkin',$i)"); }
    $pdo->exec("INSERT INTO likes(user_id,entity_type,entity_id) VALUES (42,'checkin',1),(42,'checkin',99999)");
    verifyOnboarding(apiOnboarding('api/onboarding.php')['json']['data']['stats']['foreign_likes'] === 10, 'Only existing contributions by other users count as foreign likes');
    $workers=[];
    for ($i=0; $i<2; $i++) { $pipes=[]; $process=proc_open([PHP_BINARY,__DIR__.'/fixtures/onboarding-claim-worker.php'],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes); $workers[]=[$process,$pipes]; }
    $granted=0;
    foreach ($workers as [$process,$pipes]) { $out=stream_get_contents($pipes[1]); $err=stream_get_contents($pipes[2]); if (proc_close($process)!==0) throw new RuntimeException($err); $granted+=(int)$out; }
    verifyOnboarding($granted === 1 && (int)$pdo->query('SELECT COUNT(*) FROM user_awards WHERE user_id=42 AND level=2')->fetchColumn() === 1, 'Concurrent expert claims grant the award exactly once');
    verifyOnboarding(buildNotificationDeeplink(['typ'=>'like','referenz_id'=>1,'zusatzdaten'=>['entity_type'=>'checkin','entity_id'=>1]]) === '/dashboard/target?type=checkin&id=1', 'Notification routing for check-ins without public places is preserved');
    verifyOnboarding(!pushFcmInvalidatesToken(['error'=>['status'=>'INVALID_ARGUMENT']]), 'A payload error does not invalidate a valid Android device');
    // A withdrawn system message must never escape via the new retry path.
    $device = $pdo->query('SELECT * FROM web_push_subscriptions WHERE invalidated_at IS NULL LIMIT 1')->fetch();
    $pdo->exec("INSERT INTO systemmeldungen VALUES (100,'draft'); INSERT INTO benachrichtigungen(id,empfaenger_id,typ,referenz_id,text) VALUES (100,42,'systemmeldung',100,'withdrawn')");
    $pdo->prepare("INSERT INTO push_notification_deliveries(notification_id,user_id,channel,subscription_token,payload_json) VALUES (100,42,'web',?,?)")->execute([$device['subscription_token'],json_encode(['body'=>'withdrawn'])]);
    verifyOnboarding(fetchPendingWebPushPayloads($pdo,$device['subscription_token']) === [], 'Retry delivery preserves the published-system-message filter');
    $pdo->exec("INSERT INTO benachrichtigungen(id,empfaenger_id,typ,referenz_id,text) VALUES (101,42,'like',1,'new like')");
    $delivery = $pdo->prepare("INSERT INTO push_notification_deliveries(notification_id,user_id,channel,subscription_token,payload_json)
        VALUES (101,42,'web',?,?)");
    $delivery->execute([$device['subscription_token'],json_encode(['body'=>'new like'])]);
    $deliveryId = $pdo->lastInsertId();
    verifyOnboarding(count(fetchPendingWebPushPayloads($pdo,$device['subscription_token'])) === 1, 'A fresh delivery is pulled');
    verifyOnboarding(fetchPendingWebPushPayloads($pdo,$device['subscription_token']) === [], 'Immediate repeat pulls are throttled');
    $pdo->exec("UPDATE push_notification_deliveries SET pulled_at=DATE_SUB(NOW(),INTERVAL 3 MINUTE) WHERE id=$deliveryId");
    verifyOnboarding(count(fetchPendingWebPushPayloads($pdo,$device['subscription_token'])) === 1, 'A delivery without a shown acknowledgement can be retried');
    $pdo->exec("UPDATE push_notification_deliveries SET shown_at=NOW(),pulled_at=NULL WHERE id=$deliveryId");
    verifyOnboarding(fetchPendingWebPushPayloads($pdo,$device['subscription_token']) === [], 'Acknowledged notifications are not delivered again');
    $pdo->exec("UPDATE push_notification_deliveries SET shown_at=NULL,created_at=DATE_SUB(NOW(),INTERVAL 15 DAY) WHERE id=$deliveryId");
    verifyOnboarding(fetchPendingWebPushPayloads($pdo,$device['subscription_token']) === [], 'Expired pending deliveries do not flood returning users');
    echo "PASS $checks isolated integration checks\n";
} finally { proc_terminate($server); proc_close($server); }
