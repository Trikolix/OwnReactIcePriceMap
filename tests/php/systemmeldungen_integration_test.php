<?php
$root = getenv('ICE_SYSTEM_TEST_BACKEND');
if (!$root || strpos($root, '/tmp/ice-system-test/') !== 0) throw new RuntimeException('Use the isolated Docker test backend');
require_once $root . '/db_connect.php';
$checks = 0;
function checkSystem($condition, string $message): void {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}
function rejectsSystem(callable $fn, int $status, string $message): void {
    try { $fn(); } catch (SystemmeldungException $e) { checkSystem($e->httpStatus === $status, $message); return; }
    throw new RuntimeException($message);
}
checkSystem($pdo->query('SELECT DATABASE()')->fetchColumn() === 'ice_system_test', 'Test database guard');
$pdo->exec('SET FOREIGN_KEY_CHECKS=0');
foreach ($pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $table) $pdo->exec('DROP TABLE `' . $table . '`');
$pdo->exec('SET FOREIGN_KEY_CHECKS=1');
$pdo->exec("CREATE TABLE nutzer (id INT PRIMARY KEY,username VARCHAR(100),email VARCHAR(255));
 CREATE TABLE user_notification_settings (user_id INT PRIMARY KEY,notify_news TINYINT DEFAULT 1);
 CREATE TABLE systemmeldungen (id INT AUTO_INCREMENT PRIMARY KEY,titel VARCHAR(255) NOT NULL,nachricht TEXT NOT NULL,erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE benachrichtigungen (id INT AUTO_INCREMENT PRIMARY KEY,empfaenger_id INT,typ VARCHAR(32),referenz_id INT,text TEXT,zusatzdaten TEXT,ist_gelesen TINYINT DEFAULT 0,erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE user_api_tokens (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,token_hash CHAR(64),expires_at DATETIME,last_used_at DATETIME,revoked_at DATETIME NULL);
 INSERT INTO nutzer VALUES (1,'Admin','admin@example.invalid'),(42,'Member','member@example.invalid'),(43,'Other','other@example.invalid');
 INSERT INTO user_notification_settings VALUES (1,1),(42,1),(43,0);
 INSERT INTO systemmeldungen(titel,nachricht) VALUES ('Legacy','Existing message');");
$pdo->exec("CREATE TABLE systemmeldung_mail_queue (
 id INT AUTO_INCREMENT PRIMARY KEY,systemmeldung_id INT,user_id INT,email VARCHAR(255),subject VARCHAR(180),heading VARCHAR(180),body MEDIUMTEXT,buttons_json TEXT,include_settings_hint TINYINT DEFAULT 1,
 status ENUM('pending','sending','sent','failed') DEFAULT 'pending',attempts INT DEFAULT 0,last_error TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,sent_at DATETIME NULL);
 INSERT INTO systemmeldung_mail_queue(systemmeldung_id,user_id,email,subject,heading,body,status,attempts,include_settings_hint) VALUES
 (1,42,'member@example.invalid','Legacy','Legacy','Existing content','pending',0,0),
 (1,43,'other@example.invalid','Legacy','Legacy','Existing content','sending',3,1),
 (1,1,'admin@example.invalid','Legacy','Legacy','Existing content','failed',1,1);");
function migrateSystem(PDO $pdo): void {
    $delimiter = ';'; $buffer = '';
    foreach (file(__DIR__ . '/../../backend/Database/migrations/2026-10-06_harden_systemmeldungen.sql') as $line) {
        if (preg_match('/^DELIMITER (.+)$/', trim($line), $matches)) { $delimiter = $matches[1]; continue; }
        if (strpos(ltrim($line), '--') === 0) continue;
        $buffer .= $line;
        if (substr(rtrim($buffer), -strlen($delimiter)) === $delimiter) {
            $statement = $pdo->query(substr(rtrim($buffer), 0, -strlen($delimiter)));
            $statement->closeCursor(); $buffer = '';
        }
    }
}
migrateSystem($pdo); migrateSystem($pdo);
checkSystem($pdo->query('SELECT state FROM systemmeldungen WHERE id=1')->fetchColumn() === 'published', 'Legacy messages stay published');
checkSystem((int)$pdo->query('SELECT COUNT(*) FROM benachrichtigungen')->fetchColumn() === 0, 'Migration never republishes messages');
checkSystem($pdo->query('SELECT status FROM systemmeldung_mail_queue WHERE id=2')->fetchColumn()==='uncertain','Legacy in-flight mail is retained as uncertain');
checkSystem($pdo->query('SELECT mail_mode FROM systemmeldung_mail_queue WHERE id=1')->fetchColumn()==='all','Legacy all-mail override retained');
checkSystem($pdo->query('SELECT status FROM systemmeldung_mail_queue WHERE id=3')->fetchColumn()==='retry','Legacy retryable failure retained');
$pdo->exec('DELETE FROM systemmeldung_mail_queue');
require_once $root . '/lib/systemmeldung_worker.php';
foreach (['//evil.invalid', 'javascript:alert(1)', '/\\evil.invalid', "https://example.invalid/\n", 'https://a:b@example.invalid'] as $url) {
    if (strpos($url, "\n") !== false) $url = "https://example.invalid/a\nb";
    rejectsSystem(fn() => systemmeldungUrl($url), 422, 'Unsafe link rejected');
}
rejectsSystem(fn() => systemmeldungForm(['push_web' => 'yes']), 422, 'Boolean validation');
rejectsSystem(fn() => systemmeldungForm(['mail_send_mode' => 'bogus']), 422, 'Invalid mail mode rejected');
rejectsSystem(fn() => systemmeldungForm(['title' => str_repeat('a', 161)]), 422, 'Length validation');
$form = systemmeldungForm(['title' => 'Update', 'message' => '## Hello\n\n**World**', 'email_body' => '![Image](https://example.invalid/a.png)\n[button: Open](https://ice-app.de/map)', 'link_url' => '/map']);
$mail = systemmeldungMailData($form);
$html = iceapp_build_branded_admin_markdown_mail_html($mail['heading'],$mail['body'],$mail['buttons'],true,'https://ice-app.de/account/settings','Ice-App');
checkSystem(strpos($html,'Ice-Tour') === false && strpos($html,'Ice-App') !== false, 'System mail branding');
checkSystem(strpos($html,'<img') !== false && strpos($html,'https://ice-app.de/map') !== false, 'Canonical image/button mail rendering');
checkSystem($mail['buttons'][0]['url'] === 'https://ice-app.de/map', 'Canonical fallback CTA');
$pdo->exec("UPDATE user_notification_settings SET notify_news_push=1,push_enabled_web=1,push_enabled_android=1 WHERE user_id=42;
 INSERT INTO web_push_subscriptions (user_id,endpoint,endpoint_hash,p256dh,auth,subscription_token) VALUES (42,'https://example.invalid/push','webhash','key','auth','subscription-token');
 INSERT INTO mobile_push_devices (user_id,platform,provider,device_token,token_hash) VALUES (42,'android','fcm','fake-device-token','devicehash');");
$form['push_web'] = true; $form['push_android'] = true;
$counts = systemmeldungRecipients($pdo, $form)['counts'];
checkSystem($counts === ['in_app'=>3,'email'=>2,'web'=>1,'android'=>1], 'Recipients honor separate settings');
$draft = systemmeldungSaveDraft($pdo, $form, 1);
checkSystem((int)$pdo->query('SELECT COUNT(*) FROM systemmeldung_mail_queue')->fetchColumn() === 0, 'Saving draft sends nothing');
$input = $form + ['id'=>$draft['systemmeldung_id'],'request_key'=>'test-request-0001','expected_counts'=>$counts];
$result = systemmeldungPublish($pdo, $input, 1);
checkSystem(systemmeldungPublish($pdo, $input, 1) === $result, 'Replay returns original publication');
checkSystem((int)$pdo->query('SELECT COUNT(*) FROM benachrichtigungen')->fetchColumn() === 3, 'No duplicate notifications');
checkSystem((int)$pdo->query('SELECT COUNT(*) FROM systemmeldung_push_queue')->fetchColumn() === 2, 'Both push channels queued');
foreach ([false, true] as $emulated) {
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, $emulated);
    $history = systemmeldungHistory($pdo, 1);
    $published = array_values(array_filter($history['systemmeldungen'], fn($row) => $row['id'] === $result['systemmeldung_id']))[0];
    checkSystem($history['pagination']['total'] === 2 && count($history['systemmeldungen']) === 2, 'Admin history works with native and emulated prepares');
    checkSystem($published['delivery_stats'] == ['email'=>['pending'=>2], 'android'=>['pending'=>1], 'web'=>['pending'=>1], 'in_app'=>['total'=>3,'read'=>0]], 'History separates delivery channels and read totals');
    checkSystem(systemmeldungHistory($pdo, 2)['systemmeldungen'] === [], 'History pagination preserves integer offset binding');
}
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
checkSystem(strpos($pdo->query('SELECT payload_json FROM push_notification_deliveries LIMIT 1')->fetchColumn(), 'World') === false, 'Push payload excludes full app content');
$GLOBALS['__push_infrastructure_schema_initialized']=true;
checkSystem(fetchPendingWebPushPayloads($pdo,'subscription-token')===[],'Unclaimed web jobs are not exposed to pull');
$pdo->exec("UPDATE push_notification_deliveries SET status='pending' WHERE channel='web'");
checkSystem(count(fetchPendingWebPushPayloads($pdo,'subscription-token'))===1,'Eligible web delivery can be pulled');
$pdo->exec('UPDATE web_push_subscriptions SET invalidated_at=NOW() WHERE user_id=42');
checkSystem(fetchPendingWebPushPayloads($pdo,'subscription-token')===[],'Revoked subscription cannot pull payloads');
$pdo->exec('UPDATE web_push_subscriptions SET invalidated_at=NULL WHERE user_id=42');
$pdo->exec('UPDATE user_notification_settings SET notify_news_push=0 WHERE user_id=42');
checkSystem(fetchPendingWebPushPayloads($pdo,'subscription-token')===[],'Web pull rechecks news-push consent');
$pdo->exec("UPDATE user_notification_settings SET notify_news_push=1 WHERE user_id=42; UPDATE push_notification_deliveries SET status='queued' WHERE channel='web'");
$bad = $input; $bad['title'] = 'Changed';
rejectsSystem(fn() => systemmeldungPublish($pdo,$bad,1),409,'Request key cannot change content');
$changed = $form + ['request_key'=>'test-request-0002','expected_counts'=>['in_app'=>999,'email'=>2,'web'=>1,'android'=>1]];
rejectsSystem(fn() => systemmeldungPublish($pdo,$changed,1),409,'Changed recipients require confirmation');
// Force a failure after parent and queue insertion; the entire publication must roll back.
$pdo->exec("CREATE TRIGGER system_test_failure BEFORE INSERT ON benachrichtigungen FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Injected failure'");
$before = (int)$pdo->query('SELECT COUNT(*) FROM systemmeldungen')->fetchColumn();
try { systemmeldungPublish($pdo,$form+['request_key'=>'test-request-0003','expected_counts'=>$counts],1); throw new RuntimeException('Expected transaction failure'); }
catch (PDOException $e) { checkSystem((int)$pdo->query('SELECT COUNT(*) FROM systemmeldungen')->fetchColumn()===$before,'Publication rolls back all inserts'); }
$pdo->exec('DROP TRIGGER system_test_failure');
$emailBefore = $pdo->query('SELECT body FROM systemmeldung_mail_queue ORDER BY id LIMIT 1')->fetchColumn();
systemmeldungCorrect($pdo,['id'=>$result['systemmeldung_id'],'title'=>'Corrected','message'=>'App correction','link_url'=>'/map','link_label'=>'Map'],1);
checkSystem($pdo->query('SELECT body FROM systemmeldung_mail_queue ORDER BY id LIMIT 1')->fetchColumn()===$emailBefore,'App correction preserves mail snapshot');
$stored=$pdo->query('SELECT * FROM systemmeldungen WHERE id='.(int)$result['systemmeldung_id'])->fetch(PDO::FETCH_ASSOC);
$storedMail=systemmeldungMailData(systemmeldungRowForm($stored));
checkSystem($storedMail['subject']==='Ice-App: Update' && $storedMail['heading']==='Update' && $storedMail['buttons'][0]['url']==='https://ice-app.de/map','Published preview preserves original mail defaults and CTA');
rejectsSystem(fn()=>systemmeldungCorrect($pdo,['id'=>$result['systemmeldung_id'],'title'=>'Corrected','message'=>'App correction','email_body'=>'new mail'],1),409,'Published email changes rejected');
$pdo->exec('UPDATE user_notification_settings SET notify_news=0,push_enabled_web=0,push_enabled_android=0 WHERE user_id=42');
$transports = 0;
$worker = processSystemDeliveryQueue($pdo,100,3,function() use (&$transports) {$transports++;return ['status'=>200,'body'=>'','headers'=>[]];});
checkSystem($worker['skipped']===3 && $transports===1,'Consent rechecked before delivery');
// Forced-all retains its intentional override, while ordinary opt-outs are respected.
$all=$form; $all['mail_send_mode']='all'; $all['push_web']=false; $all['push_android']=false;
rejectsSystem(fn()=>systemmeldungPublish($pdo,$all+['request_key'=>'test-request-0004','expected_counts'=>systemmeldungRecipients($pdo,$all)['counts']],1),422,'All-mail confirmation required');
$allResult=systemmeldungPublish($pdo,$all+['request_key'=>'test-request-0004','expected_counts'=>systemmeldungRecipients($pdo,$all)['counts'],'force_mail_all_confirmed'=>true,'force_mail_all_confirm_text'=>'EMAIL AN ALLE'],1);
$attempts=0;
processSystemDeliveryQueue($pdo,100,3,function() use (&$attempts) {$attempts++;return ['status'=>503,'body'=>'Temporary failure','headers'=>['Retry-After: 120']];});
checkSystem($attempts===3,'All-mail override includes opted-out users');
checkSystem((int)$pdo->query("SELECT MIN(TIMESTAMPDIFF(SECOND,NOW(),next_attempt_at)) FROM systemmeldung_mail_queue WHERE status='retry'")->fetchColumn()>=118,'Retry delay honors Retry-After');
checkSystem(processSystemDeliveryQueue($pdo,100,3,function(){throw new RuntimeException('Should not run');})['processed']===0,'No immediate retry');
$pdo->exec("UPDATE systemmeldung_mail_queue SET next_attempt_at=NOW() WHERE status='retry'");
processSystemDeliveryQueue($pdo,100,3,function(){throw new RuntimeException('Transport outcome unknown');});
checkSystem((int)$pdo->query("SELECT COUNT(*) FROM systemmeldung_mail_queue WHERE status='uncertain'")->fetchColumn()===3,'Unclear outcomes are visible');
checkSystem(processSystemDeliveryQueue($pdo,100,3,function(){throw new RuntimeException('Should not retry');})['processed']===0,'Unclear outcomes are never blindly retried');
$fresh=systemmeldungPublish($pdo,$all+['request_key'=>'test-request-0005','expected_counts'=>systemmeldungRecipients($pdo,$all)['counts'],'force_mail_all_confirmed'=>true,'force_mail_all_confirm_text'=>'EMAIL AN ALLE'],1);
$claim=systemmeldungClaim($pdo,'systemmeldung_mail_queue',3);
$pdo->prepare("UPDATE systemmeldung_mail_queue SET lease_until=DATE_SUB(NOW(),INTERVAL 1 SECOND),attempts=3 WHERE id=?")->execute([$claim['id']]);
systemmeldungClaim($pdo,'systemmeldung_mail_queue',3);
$late=$pdo->prepare("UPDATE systemmeldung_mail_queue SET status='accepted' WHERE id=? AND status='sending' AND lease_token=?");
$late->execute([$claim['id'],$claim['lease_token']]);
checkSystem($late->rowCount()===0,'Expired worker cannot overwrite a newer outcome');
systemmeldungWithdraw($pdo,$fresh['systemmeldung_id'],1);
checkSystem((int)$pdo->query("SELECT COUNT(*) FROM systemmeldung_mail_queue WHERE status='cancelled'")->fetchColumn()>=1,'Withdrawal stops pending jobs');
checkSystem($pdo->query('SELECT COUNT(*) FROM systemmeldung_audit')->fetchColumn()>0,'Audit trail retained');
checkSystem(pushFcmInvalidatesToken(['error'=>['status'=>'INVALID_ARGUMENT','details'=>[['@type'=>'type.googleapis.com/google.rpc.BadRequest']]]])===false,'Malformed payload does not invalidate token');
checkSystem(pushFcmInvalidatesToken(['error'=>['details'=>[['@type'=>'type.googleapis.com/google.firebase.fcm.v1.FcmError','errorCode'=>'UNREGISTERED']]]])===true,'Unregistered FCM token recognized');
$exhausted=systemmeldungPublish($pdo,$all+['request_key'=>'test-request-0006','expected_counts'=>systemmeldungRecipients($pdo,$all)['counts'],'force_mail_all_confirmed'=>true,'force_mail_all_confirm_text'=>'EMAIL AN ALLE'],1);
for($round=0;$round<3;$round++) {
    $pdo->prepare('UPDATE systemmeldung_mail_queue SET next_attempt_at=NOW() WHERE systemmeldung_id=?')->execute([$exhausted['systemmeldung_id']]);
    processSystemDeliveryQueue($pdo,100,3,fn()=>['status'=>503,'body'=>'Temporary outage','headers'=>[]]);
}
checkSystem((int)$pdo->query("SELECT COUNT(*) FROM systemmeldung_mail_queue WHERE systemmeldung_id=".$exhausted['systemmeldung_id']." AND status='failed' AND attempts=3")->fetchColumn()===3,'Retry exhaustion remains visible');
checkSystem(processSystemDeliveryQueue($pdo,100,3,fn()=>['status'=>200,'body'=>'','headers'=>[]])['processed']===0,'Attempt limit prevents further delivery');
$permanent=systemmeldungPublish($pdo,$all+['request_key'=>'test-request-0007','expected_counts'=>systemmeldungRecipients($pdo,$all)['counts'],'force_mail_all_confirmed'=>true,'force_mail_all_confirm_text'=>'EMAIL AN ALLE'],1);
processSystemDeliveryQueue($pdo,100,3,fn()=>['status'=>400,'body'=>'Permanent rejection','headers'=>[]]);
checkSystem((int)$pdo->query("SELECT COUNT(*) FROM systemmeldung_mail_queue WHERE systemmeldung_id=".$permanent['systemmeldung_id']." AND status='failed' AND attempts=1")->fetchColumn()===3,'Permanent failure records actual attempts');
$pdo->exec('UPDATE user_notification_settings SET notify_news_push=1,push_enabled_web=1,push_enabled_android=1 WHERE user_id=42');
$pushForm=$form;$pushForm['mail_send_mode']='none';
$pushMessage=systemmeldungPublish($pdo,$pushForm+['request_key'=>'test-request-0008','expected_counts'=>systemmeldungRecipients($pdo,$pushForm)['counts']],1);
$pdo->exec('UPDATE mobile_push_devices SET invalidated_at=NOW() WHERE user_id=42');
$pushResult=processSystemDeliveryQueue($pdo,100,3,fn()=>['status'=>200,'body'=>'','headers'=>[]]);
checkSystem($pushResult['accepted']===1&&$pushResult['skipped']===1,'Revoked Android device is skipped before transport');
systemmeldungWithdraw($pdo,$pushMessage['systemmeldung_id'],1);
checkSystem(fetchPendingWebPushPayloads($pdo,'subscription-token')===[],'Withdrawal cancels web pull including accepted signals');
// Concurrent requests share the same publication and concurrent workers claim each job once.
$parallel=$form; $parallel['push_web']=false; $parallel['push_android']=false;
$parallel += ['request_key'=>'test-request-parallel','expected_counts'=>systemmeldungRecipients($pdo,$parallel)['counts']];
$processes=[];
for($i=0;$i<2;$i++) {
    $pipes=[]; $process=proc_open([PHP_BINARY,__DIR__.'/systemmeldung_runner.php','publish',base64_encode(json_encode($parallel))],[1=>['pipe','w'],2=>['pipe','w']],$pipes);
    $processes[]=[$process,$pipes];
}
$publishedResults=[];
foreach($processes as [$process,$pipes]) { $out=stream_get_contents($pipes[1]);$err=stream_get_contents($pipes[2]);foreach($pipes as $pipe)fclose($pipe);checkSystem(proc_close($process)===0,'Concurrent publish completes: '.$err);$publishedResults[]=json_decode($out,true); }
checkSystem($publishedResults[0]===$publishedResults[1],'Concurrent publications return identical result');
$pdo->exec("UPDATE systemmeldung_mail_queue SET status='cancelled' WHERE status='sending'");
$log=tempnam(sys_get_temp_dir(),'system-worker');$processes=[];
for($i=0;$i<2;$i++) {$pipes=[];$process=proc_open([PHP_BINARY,__DIR__.'/systemmeldung_runner.php','worker',$log],[1=>['pipe','w'],2=>['pipe','w']],$pipes);$processes[]=[$process,$pipes];}
foreach($processes as [$process,$pipes]) {$err=stream_get_contents($pipes[2]);foreach($pipes as $pipe)fclose($pipe);checkSystem(proc_close($process)===0,'Concurrent worker completes: '.$err);}
$lines=file($log,FILE_IGNORE_NEW_LINES);unlink($log);
checkSystem(count($lines)>0 && count($lines)===count(array_unique($lines)),'Parallel workers never send the same job twice');

// Exercise actual HTTP endpoints against the isolated database.
foreach([1,42,43] as $user) $pdo->prepare('INSERT INTO user_api_tokens(user_id,token_hash,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 1 DAY))')->execute([$user,hash('sha256','test-token-'.$user)]);
$serverPipes=[];$server=proc_open([PHP_BINARY,'-d','sendmail_path=/bin/false','-S','127.0.0.1:8123','-t',$root],[1=>['file','/tmp/system-http.log','a'],2=>['file','/tmp/system-http.log','a']],$serverPipes);
try {
    for($i=0;$i<40;$i++) { $socket=@fsockopen('127.0.0.1',8123);if($socket){fclose($socket);break;}usleep(50000); }
    function requestSystem(string $path,string $method='GET',?array $body=null,?int $user=null,string $contentType='application/json'): array {
        $headers=['Content-Type: '.$contentType];if($user)$headers[]='Authorization: Bearer test-token-'.$user;
        $context=stream_context_create(['http'=>['method'=>$method,'header'=>implode("\r\n",$headers),'content'=>$body===null?'':json_encode($body),'ignore_errors'=>true]]);
        $raw=file_get_contents('http://127.0.0.1:8123/'.$path,false,$context);
        preg_match('/\s(\d{3})\s/',$http_response_header[0],$match);
        return [(int)$match[1],json_decode($raw,true)];
    }
    checkSystem(requestSystem('systemmeldung.php?action=list')[0]===401,'Admin API rejects anonymous requests');
    checkSystem(requestSystem('systemmeldung.php?action=list','GET',null,42)[0]===403,'Admin API rejects ordinary users');
    [$historyCode,$historyResponse]=requestSystem('systemmeldung.php?action=list&page=1','GET',null,1);
    checkSystem($historyCode===200 && $historyResponse['status']==='success' && isset($historyResponse['pagination'],$historyResponse['systemmeldungen'][0]['delivery_stats']),'Authenticated admin history returns content and pagination');
    checkSystem(requestSystem('systemmeldung.php?action=delete&id=1','GET',null,1)[0]===405,'GET deletion rejected');
    checkSystem(requestSystem('systemmeldung.php?action=save_draft','POST',[],1,'text/plain')[0]===415,'Simple cross-origin POST rejected');
    checkSystem(requestSystem('benachrichtigungen.php?action=list&nutzer_id=43','GET',null,42)[0]===403,'Foreign user-id rejected');
    checkSystem(requestSystem('benachrichtigungen.php?action=list')[0]===401,'Notification API rejects anonymous requests');
    checkSystem(requestSystem('Skripte/cron_send_systemmeldung_mails.php')[0]===404,'Cron worker rejects HTTP');
    checkSystem(requestSystem('systemmeldung.php?action=get&id='.$fresh['systemmeldung_id'],'GET',null,42)[0]===404,'Withdrawn message cannot be resurrected');
    $pdo->exec("INSERT INTO benachrichtigungen(empfaenger_id,typ,referenz_id,text) SELECT 42,'systemmeldung',1,'Extra' FROM information_schema.columns LIMIT 70");
    [$code,$list]=requestSystem('benachrichtigungen.php?action=list','GET',null,42);
    checkSystem($code===200 && count($list['notifications'])===50 && $list['unread_total']>50 && $list['next_cursor']!==null,'Unread count is independent of pagination');
    [$code,$next]=requestSystem('benachrichtigungen.php?action=list&before_id='.$list['next_cursor'],'GET',null,42);
    checkSystem($code===200 && !array_intersect(array_column($list['notifications'],'id'),array_column($next['notifications'],'id')),'Pagination has no overlap');
    $foreign=$pdo->query('SELECT id FROM benachrichtigungen WHERE empfaenger_id=43 LIMIT 1')->fetchColumn();
    checkSystem(requestSystem('benachrichtigungen.php?action=markAsRead','POST',['id'=>(int)$foreign],42)[0]===404,'Foreign notification cannot be modified');
    [$code,$get]=requestSystem('systemmeldung.php?action=get&id='.$result['systemmeldung_id'],'GET',null,42);
    checkSystem($code===200 && isset($get['systemmeldung']['notification_id']) && !isset($get['systemmeldung']['email_body']),'Recipient read returns only app content and owned notification');
    checkSystem(requestSystem('benachrichtigungen.php?action=markAsRead','POST',['id'=>(int)$get['systemmeldung']['notification_id']],42)[0]===200,'Owned notification can be marked read');
    checkSystem(requestSystem('systemmeldung.php?action=test_email','POST',$form,42)[0]===403,'Test mail is admin-only');
    $pdo->exec('RENAME TABLE systemmeldung_push_queue TO system_test_missing_push_queue');
    try {
        [$code,$missing]=requestSystem('systemmeldung.php?action=list&page=1','GET',null,1);
        checkSystem($code===503 && $missing['code']==='SYSTEMMELDUNG_SCHEMA_OUTDATED' && $missing['migration']==='2026-10-06_harden_systemmeldungen.sql','Missing queue returns actionable migration error for admin');
        checkSystem(strpos(json_encode($missing),'SQLSTATE')===false && strpos(json_encode($missing),'system_test_missing_push_queue')===false,'Migration error never exposes raw database diagnostics');
        checkSystem(requestSystem('systemmeldung.php?action=list','GET',null,42)[0]===403,'Missing schema does not bypass admin authorization');
    } finally { $pdo->exec('RENAME TABLE system_test_missing_push_queue TO systemmeldung_push_queue'); }
    $pdo->exec('ALTER TABLE systemmeldungen RENAME COLUMN erstellt_am TO system_test_created');
    try {
        [$code,$missingColumn]=requestSystem('systemmeldung.php?action=list&page=1','GET',null,1);
        checkSystem($code===503 && $missingColumn['code']==='SYSTEMMELDUNG_SCHEMA_OUTDATED','Missing history column returns migration error');
    } finally { $pdo->exec('ALTER TABLE systemmeldungen RENAME COLUMN system_test_created TO erstellt_am'); }
    $pdo->exec('ALTER TABLE systemmeldungen RENAME COLUMN state TO system_test_state');
    try {
        [$code,$recipientSchema]=requestSystem('systemmeldung.php?action=get&id='.$result['systemmeldung_id'],'GET',null,42);
        checkSystem($code===503 && !isset($recipientSchema['migration']) && strpos($recipientSchema['message'],'2026-10-06')===false,'Recipients receive no admin migration details');
    } finally { $pdo->exec('ALTER TABLE systemmeldungen RENAME COLUMN system_test_state TO state'); }
    checkSystem(requestSystem('systemmeldung.php?action=list&page=1','GET',null,1)[0]===200,'History recovers after schema restoration');
} finally {proc_terminate($server);proc_close($server);}
echo "Systemmeldungen: {$checks} integration checks passed\n";
