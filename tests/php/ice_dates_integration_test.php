<?php
declare(strict_types=1);
$root = getenv('ICE_DATE_TEST_BACKEND');
require $root . '/db_connect.php';
require $root . '/lib/auth.php';
require $root . '/lib/ice_dates.php';
$checks = 0;
function assertIceDate(bool $condition, string $message): void { global $checks; if (!$condition) throw new RuntimeException($message); $checks++; }
function rejectDate(callable $action, int $status): void {
    try { $action(); throw new RuntimeException('Unexpected acceptance'); }
    catch (IceDateError $error) { assertIceDate($error->getCode() === $status, 'Expected HTTP ' . $status); }
}
$pdo->exec("CREATE TABLE nutzer (id INT PRIMARY KEY, username VARCHAR(100));
CREATE TABLE eisdielen (id INT PRIMARY KEY, name VARCHAR(255), adresse VARCHAR(255),latitude DOUBLE,longitude DOUBLE,place_type VARCHAR(30),status VARCHAR(30),openingHours TEXT,opening_hours_note TEXT,reopening_date DATE,closing_date DATE);
CREATE TABLE checkins (id INT AUTO_INCREMENT PRIMARY KEY,eisdiele_id INT,nutzer_id INT,datum DATETIME);
CREATE TABLE eisdiele_opening_hours (id INT AUTO_INCREMENT PRIMARY KEY,eisdiele_id INT,weekday INT,opens_at TIME,closes_at TIME,overnight INT,sort_order INT);
CREATE TABLE user_profile_images (user_id INT PRIMARY KEY,avatar_path VARCHAR(255));
CREATE TABLE user_api_tokens (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,token_hash CHAR(64),user_agent TEXT,ip_address VARCHAR(50),created_at DATETIME,last_used_at DATETIME,expires_at DATETIME,revoked_at DATETIME);
CREATE TABLE benachrichtigungen (id INT AUTO_INCREMENT PRIMARY KEY,empfaenger_id INT,typ VARCHAR(30),referenz_id INT,text TEXT,zusatzdaten TEXT);
INSERT INTO eisdielen (id,name,adresse,place_type,status) VALUES (1,'Emilia','Markt 12','ice_shop','open'),(2,'Unknown','Markt 13','ice_shop','open'),(3,'Restaurant','Markt 14','restaurant','open');
INSERT INTO user_profile_images VALUES (2,'uploads/user_avatars/test.png');");
for ($user = 1; $user <= 20; $user++) {
    $pdo->prepare('INSERT INTO nutzer VALUES (?, ?)')->execute([$user, 'User ' . $user]);
    $pdo->prepare('INSERT INTO user_api_tokens (user_id,token_hash,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 1 DAY))')->execute([$user, hashAuthToken('date-test-user-' . $user)]);
}
for ($weekday = 1; $weekday <= 7; $weekday++) $pdo->prepare("INSERT INTO eisdiele_opening_hours (eisdiele_id,weekday,opens_at,closes_at,overnight,sort_order) VALUES (1,?,'12:00','20:00',0,0)")->execute([$weekday]);
ensureIceDateSchema($pdo);
function makeDate(PDO $pdo, int $guests = 0, string $time = '+2 days'): array {
    $token = iceDateToken();
    $pdo->prepare('INSERT INTO ice_dates (creator_user_id,shop_id,starts_at,invite_token) VALUES (1,1,?,?)')->execute([(new DateTime($time))->format('Y-m-d H:i:s'), $token]);
    $id = (int)$pdo->lastInsertId();
    $pdo->prepare("INSERT INTO ice_date_participants (date_id,user_id,role,status) VALUES (?,1,'organizer','going')")->execute([$id]);
    for ($user = 2; $user <= $guests + 1; $user++) $pdo->prepare("INSERT INTO ice_date_participants (date_id,user_id,role,status) VALUES (?,?,'participant','invited')")->execute([$id, $user]);
    return ['id' => $id, 'token' => $token];
}
$date = makeDate($pdo, 6);
assertIceDate(iceDateFetchDetail($pdo, $date['id'], null, 2)['participants'][1]['avatar_url'] === 'uploads/user_avatars/test.png', 'Participant avatar paths are additive');
assertIceDate(iceDateFetchDetail($pdo, $date['id'], null, 20) === null, 'Numeric private access remains restricted');
rejectDate(fn() => iceDateRespond($pdo, 0, ['ice_date_id' => $date['id'], 'status' => 'going']), 401);
rejectDate(fn() => iceDateRespond($pdo, 8, ['ice_date_id' => $date['id'], 'status' => 'going']), 403);
rejectDate(fn() => iceDateRespond($pdo, 8, ['ice_date_id' => $date['id'], 'status' => 'going', 'invite_token' => 'wrong']), 404);
rejectDate(fn() => iceDateRespond($pdo, 8, ['ice_date_id' => $date['id'], 'status' => 'invalid', 'invite_token' => $date['token']]), 400);
$detail = iceDateRespond($pdo, 8, ['ice_date_id' => $date['id'], 'status' => 'maybe', 'invite_token' => $date['token']]);
assertIceDate($detail['reserved_count'] === 8 && $detail['free_places'] === 0, 'A link recipient can reserve the last place as maybe');
rejectDate(fn() => iceDateRespond($pdo, 9, ['ice_date_id' => $date['id'], 'status' => 'going', 'invite_token' => $date['token']]), 409);
$notifications = (int)$pdo->query('SELECT COUNT(*) FROM benachrichtigungen')->fetchColumn();
iceDateRespond($pdo, 8, ['ice_date_id' => $date['id'], 'status' => 'maybe']);
assertIceDate((int)$pdo->query('SELECT COUNT(*) FROM benachrichtigungen')->fetchColumn() === $notifications, 'Repeated answers do not notify again');
assertIceDate((int)$pdo->query('SELECT COUNT(*) FROM ice_date_participants WHERE user_id=8')->fetchColumn() === 1, 'An answer is one participant record');
assertIceDate(iceDateRespond($pdo, 2, ['ice_date_id' => $date['id'], 'status' => 'going'])['reserved_count'] === 8, 'An invited user can confirm at capacity');
assertIceDate(iceDateRespond($pdo, 1, ['ice_date_id' => $date['id'], 'status' => 'declined'])['reserved_count'] === 8, 'The organizer always keeps a place');
assertIceDate(iceDateRespond($pdo, 8, ['ice_date_id' => $date['id'], 'status' => 'declined'])['free_places'] === 1, 'A guest decline releases a place');
iceDateRespond($pdo, 9, ['ice_date_id' => $date['id'], 'status' => 'going', 'invite_token' => $date['token']]);
rejectDate(fn() => iceDateRespond($pdo, 8, ['ice_date_id' => $date['id'], 'status' => 'going']), 409);
rejectDate(fn() => iceDateCancel($pdo, 2, $date['id']), 403);
iceDateCancel($pdo, 1, $date['id']);
rejectDate(fn() => iceDateRespond($pdo, 9, ['ice_date_id' => $date['id'], 'status' => 'declined']), 409);
rejectDate(fn() => iceDateCancel($pdo, 1, $date['id']), 409);
$completed = makeDate($pdo);
$pdo->prepare("UPDATE ice_dates SET status='completed' WHERE id=?")->execute([$completed['id']]);
rejectDate(fn() => iceDateRespond($pdo, 2, ['ice_date_id' => $completed['id'], 'invite_token' => $completed['token'], 'status' => 'going']), 409);

// Both connections contend for the same last place while the parent holds the date lock.
$race = makeDate($pdo, 6);
$barrier = '/tmp/ice-date-race-' . getmypid();
$pdo->beginTransaction();
$pdo->query('SELECT id FROM ice_dates WHERE id=' . $race['id'] . ' FOR UPDATE');
$workers = [];
foreach ([8, 9] as $user) {
    $process = proc_open([PHP_BINARY, __DIR__ . '/fixtures/ice-date-rsvp-worker.php', (string)$race['id'], (string)$user, $race['token'], $barrier], [0 => ['pipe','r'], 1 => ['pipe','w'], 2 => ['file','/tmp/ice-date-race.log','a']], $pipes);
    $workers[] = [$process, $pipes];
}
for ($attempt = 0; $attempt < 100 && (!file_exists($barrier . '-8') || !file_exists($barrier . '-9')); $attempt++) usleep(50000);
$bothReady = file_exists($barrier . '-8') && file_exists($barrier . '-9');
$pdo->commit();
assertIceDate($bothReady, 'Both concurrent RSVP workers reached the shared row lock');
$statuses = [];
foreach ($workers as [$process, $pipes]) { $result = json_decode(stream_get_contents($pipes[1]), true); $statuses[] = $result['status'] ?? 0; fclose($pipes[0]); fclose($pipes[1]); proc_close($process); }
sort($statuses);
assertIceDate($statuses === [200,409], 'Only one simultaneous link recipient gets the last place');
assertIceDate(iceDateFetchDetail($pdo, $race['id'], null, 1)['reserved_count'] === 8, 'Concurrency does not exceed eight reservations');

$rows = fetch_opening_hours_rows($pdo, 1);
assertIceDate(iceDateOpenAtStart($rows, ['status'=>'open'], '2026-10-09 18:00:00') === true, 'Appointment hours use the appointment weekday and time');
assertIceDate(iceDateOpenAtStart($rows, ['status'=>'open'], '2026-10-09 21:00:00') === false, 'Closed appointment times are identified');
assertIceDate(iceDateOpenAtStart([], ['status'=>'open'], '2026-10-09 18:00:00') === null, 'Missing hours are unknown');
assertIceDate(iceDateOpenAtStart($rows, ['status'=>'seasonal_closed','reopening_date'=>'2026-10-08'], '2026-10-09 18:00:00') === true, 'Future reopening is respected');
assertIceDate(iceDateOpenAtStart($rows, ['status'=>'open','closing_date'=>'2026-10-08','reopening_date'=>'2026-10-12'], '2026-10-09 18:00:00') === false, 'Seasonal date ranges apply to future dates');
assertIceDate(iceDateOpenAtStart([], ['status'=>'permanent_closed'], '2026-10-09 18:00:00') === false, 'Permanent closure applies without hours');
$overnight = [['weekday'=>7,'opens_at'=>'22:00:00','closes_at'=>'02:00:00','overnight'=>1]];
assertIceDate(iceDateOpenAtStart($overnight, ['status'=>'open'], '2026-10-12 01:00:00') === true, 'Overnight Sunday hours reach Monday');

// Preserve automatic assignment and the two-check-in completion rule.
$visit = makeDate($pdo, 1, 'now');
assertIceDate(iceDateFetchDetail($pdo, $visit['id'], null, 1)['can_checkin'], 'An attending viewer sees check-in in the existing time window');
iceDateRespond($pdo, 2, ['ice_date_id'=>$visit['id'],'status'=>'going']);
foreach ([1,2] as $visitor) {
    $pdo->prepare('INSERT INTO checkins (eisdiele_id,nutzer_id,datum) VALUES (1,?,NOW())')->execute([$visitor]);
    $checkinId = (int)$pdo->lastInsertId();
    $result = iceDateRecordCheckin($pdo, $visitor, 1, $checkinId);
}
assertIceDate($result['status'] === 'completed' && $result['checkin_count'] === 2, 'Existing common check-in completion is retained');
assertIceDate(!$result['can_checkin'], 'Completed dates no longer offer new date check-ins');
$transactionVisit = makeDate($pdo, 1, '+5 minutes');
$pdo->beginTransaction();
$pdo->exec('INSERT INTO checkins (eisdiele_id,nutzer_id,datum) VALUES (1,1,NOW())');
iceDateRecordCheckin($pdo, 1, 1, (int)$pdo->lastInsertId());
assertIceDate($pdo->inTransaction(), 'Reading avatars and date details does not commit the caller check-in transaction');
$pdo->rollBack();
$pdo->exec('RENAME TABLE user_profile_images TO test_profile_images');
assertIceDate(iceDateFetchDetail($pdo, $race['id'], null, 1)['participants'][0]['avatar_url'] === null, 'Avatar-less installations can read dates without a migration');
$pdo->exec('RENAME TABLE test_profile_images TO user_profile_images');

$server = proc_open([PHP_BINARY, '-S', '127.0.0.1:8095', '-t', $root], [0=>['pipe','r'],1=>['file','/tmp/ice-date-http.log','a'],2=>['file','/tmp/ice-date-http.log','a']], $pipes);
try {
    for ($i=0;$i<50;$i++) { $socket=@fsockopen('127.0.0.1',8095); if ($socket) { fclose($socket); break; } usleep(100000); }
    $http = function(string $endpoint, ?int $user, array $payload = [], string $method = 'GET'): array {
        $headers = "Content-Type: application/json\r\n" . ($user ? "Authorization: Bearer date-test-user-$user\r\n" : '');
        $context = stream_context_create(['http'=>['method'=>$method,'header'=>$headers,'content'=>$method==='POST'?json_encode($payload):'','ignore_errors'=>true,'timeout'=>5]]);
        $text = file_get_contents('http://127.0.0.1:8095/api/' . $endpoint, false, $context);
        preg_match('/\s(\d{3})\s/', $http_response_header[0], $match);
        return [(int)$match[1], json_decode($text, true)];
    };
    assertIceDate($http('ice_date_detail.php?token='.$race['token'],null)[0]===200,'Guests can preview token links');
    assertIceDate($http('ice_date_detail.php?id='.$race['id'],null)[0]===401,'Private numeric routes require authentication');
    $own = $http('ice_date_detail.php?token='.$race['token'],1)[1]['ice_date'];
    assertIceDate($own['is_organizer'] && $own['viewer_status']==='going','Token previews recognize the authenticated organizer');
    assertIceDate($http('ice_date_detail.php?id='.$race['id'],20)[0]===404,'A forged numeric ID does not grant private access');
    assertIceDate($http('ice_date_rsvp.php',null,['ice_date_id'=>$race['id'],'status'=>'going'],'POST')[0]===401,'Guest writes are denied');
    assertIceDate($http('ice_date_rsvp.php',1,[],'GET')[0]===405,'GET cannot change attendance');
    $open = makeDate($pdo);
    $joined = $http('ice_date_rsvp.php',20,['ice_date_id'=>$open['id'],'invite_token'=>$open['token'],'status'=>'going','user_id'=>1],'POST');
    assertIceDate($joined[0]===200 && $joined[1]['ice_date']['viewer_status']==='going','A new authenticated link recipient can join');
    assertIceDate((int)$pdo->query('SELECT COUNT(*) FROM ice_date_participants WHERE date_id='.$open['id'].' AND user_id=20')->fetchColumn()===1,'The server derives identity from the bearer token');
    assertIceDate($http('ice_date_rsvp.php',19,['ice_date_id'=>$open['id'],'invite_token'=>'wrong','status'=>'going'],'POST')[0]===404,'Invalid links cannot join');
    $listed = $http('ice_date_list.php',1)[1]['ice_dates'];
    assertIceDate(in_array($date['id'],array_column($listed,'id'),true),'Cancelled dates remain in personal history');
    $future = array_values(array_filter($listed,fn($item)=>$item['status']==='planned'));
    assertIceDate($future[0]['starts_at'] <= $future[count($future)-1]['starts_at'],'Upcoming dates are returned chronologically');
    $start = (new DateTime('+2 days'))->setTime(18,0)->format('Y-m-d H:i:s');
    assertIceDate($http('ice_date_shop.php?shop_id=1&starts_at='.urlencode($start),null)[1]['shop']['is_open_at_start']===true,'Shop API evaluates the selected appointment');
    assertIceDate($http('ice_date_shop.php?shop_id=2&starts_at='.urlencode($start),null)[1]['shop']['is_open_at_start']===null,'Unknown appointment hours are additive');
    $created = $http('ice_date_create.php',1,['shop_id'=>1,'starts_at'=>$start,'participant_user_ids'=>[2,3,3]],'POST');
    assertIceDate($created[0]===200 && $created[1]['ice_date']['reserved_count']===3,'Creation keeps unique direct invitations reserved');
    assertIceDate($http('ice_date_create.php',1,['shop_id'=>1,'starts_at'=>'2020-01-01 12:00:00'],'POST')[0]===400,'Past appointment validation remains server-side');
    assertIceDate($http('ice_date_create.php',1,['shop_id'=>1,'starts_at'=>$start,'participant_user_ids'=>range(2,9)],'POST')[0]===400,'Creation keeps the eight-person limit');
    assertIceDate($http('ice_date_create.php',1,['shop_id'=>3,'starts_at'=>$start],'POST')[0]===404,'The picker and create API still use supported ice shops');
    assertIceDate($http('ice_date_cancel.php',2,['ice_date_id'=>$created[1]['ice_date']['id']],'POST')[0]===403,'Only organizers can cancel over HTTP');
    assertIceDate($http('ice_date_cancel.php',1,['ice_date_id'=>$created[1]['ice_date']['id']],'POST')[0]===200,'Authenticated organizer cancellation succeeds');
} finally { proc_terminate($server); proc_close($server); }
echo "Ice date integration: $checks checks passed\n";
