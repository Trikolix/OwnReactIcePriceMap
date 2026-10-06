<?php
declare(strict_types=1);
$root=getenv('ICE_LOYALTY_TEST_BACKEND');
require $root.'/db_connect.php'; require $root.'/lib/shop_operators.php';
$checks=0;
function checkL($condition,string $message): void { global $checks; if (!$condition) throw new RuntimeException($message); $checks++; }
function rejectsL(callable $fn,int $status,string $message): void { try { $fn(); } catch (LoyaltyError $e) { checkL($e->getCode()===$status,$message.' status '.$e->getCode()); return; } throw new RuntimeException($message.' was accepted'); }
$pdo->exec("CREATE TABLE nutzer (id INT PRIMARY KEY,username VARCHAR(100) NOT NULL);
CREATE TABLE eisdielen (id INT PRIMARY KEY,name VARCHAR(255),website VARCHAR(500),status VARCHAR(30),openingHours TEXT,opening_hours_note TEXT,reopening_date DATE,closing_date DATE);
CREATE TABLE eisdiele_opening_hours (id INT AUTO_INCREMENT PRIMARY KEY,eisdiele_id INT,weekday INT,opens_at TIME,closes_at TIME,overnight INT,sort_order INT);
CREATE TABLE user_api_tokens (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,token_hash CHAR(64),user_agent TEXT,ip_address VARCHAR(50),created_at DATETIME,last_used_at DATETIME,expires_at DATETIME,revoked_at DATETIME);
INSERT INTO nutzer VALUES (1,'Admin'),(2,'Betreiber'),(3,'Mitarbeiter'),(4,'Kunde'),(5,'Fremder');
INSERT INTO eisdielen (id,name) VALUES (10,'Pilot Eisdiele'),(20,'Andere Eisdiele');");
$migration=file_get_contents(__DIR__.'/../../backend/Database/migrations/2026-10-06_loyalty_pilot.sql');
$pdo->exec($migration); $pdo->exec($migration);
checkL((int)$pdo->query('SELECT COUNT(*) FROM loyalty_cards')->fetchColumn()===0,'Migration never enrols customers');
checkL((int)$pdo->query('SELECT COUNT(*) FROM loyalty_programs')->fetchColumn()===0,'Migration does not publish programs');
operatorClaim($pdo,2,['shop_id'=>10,'contact'=>'shop@example.invalid','reason'=>'Inhaber']);
rejectsL(fn()=>operatorClaim($pdo,2,['shop_id'=>10,'contact'=>'shop@example.invalid','reason'=>'Inhaber']),409,'Duplicate pending claim');
$claim=(int)$pdo->query('SELECT id FROM shop_operator_claims')->fetchColumn();
rejectsL(fn()=>operatorReview($pdo,2,['claim_id'=>$claim,'approve'=>true,'verified'=>true,'note'=>'Prüfung']),403,'Only admin approves');
rejectsL(fn()=>operatorReview($pdo,1,['claim_id'=>$claim,'approve'=>true,'note'=>'Prüfung']),422,'Approval requires explicit verification');
operatorReview($pdo,1,['claim_id'=>$claim,'approve'=>true,'verified'=>true,'note'=>'Telefonisch persönlich geprüft']);
checkL(loyaltyRole($pdo,10,2)==='operator','Approved verified operator');
checkL(loyaltyRole($pdo,10,1)===null,'Admin cannot stamp without shop membership');
operatorClaim($pdo,5,['shop_id'=>10,'contact'=>'other@example.invalid','reason'=>'Inhaber']);
$otherClaim=(int)$pdo->query('SELECT MAX(id) FROM shop_operator_claims')->fetchColumn();
rejectsL(fn()=>operatorReview($pdo,1,['claim_id'=>$otherClaim,'approve'=>true,'verified'=>true,'note'=>'Prüfung']),409,'Only one active operator');
operatorMembership($pdo,2,'invite_staff',['shop_id'=>10,'username'=>'Mitarbeiter']);
rejectsL(fn()=>loyaltyRequireRole($pdo,10,3),403,'Invitation alone gives no rights');
rejectsL(fn()=>operatorMembership($pdo,5,'accept_invite',['shop_id'=>10]),409,'Stranger cannot accept invitation');
operatorMembership($pdo,3,'accept_invite',['shop_id'=>10]);
checkL(loyaltyRole($pdo,10,3)==='staff','Accepted staff membership');
rejectsL(fn()=>operatorPublishProgram($pdo,3,['shop_id'=>10,'unit'=>'scoop','stamp_target'=>14,'reward'=>'Eine Kugel gratis','current_program_id'=>0]),403,'Staff cannot publish');
$program=operatorPublishProgram($pdo,2,['shop_id'=>10,'unit'=>'scoop','stamp_target'=>14,'reward'=>'Eine Kugel gratis','current_program_id'=>0])['program_id'];
rejectsL(fn()=>operatorPublishProgram($pdo,2,['shop_id'=>10,'unit'=>'scoop','stamp_target'=>14,'reward'=>'Eine Kugel gratis','current_program_id'=>0]),409,'Stale program publication rejected');
$card=loyaltyJoin($pdo,4,$program);
checkL(loyaltyJoin($pdo,4,$program)['id']===$card['id'],'Repeated explicit participation is idempotent');
rejectsL(fn()=>loyaltyIssueCode($pdo,5,$card['id'],'stamp'),403,'Cannot issue code for foreign card');
rejectsL(fn()=>loyaltyIssueCode($pdo,4,$card['id'],'redeem'),409,'Cannot redeem without reward');
$issue=loyaltyIssueCode($pdo,4,$card['id'],'stamp');
checkL(strlen($issue['token'])===64 && strlen($issue['manual_code'])===10,'Server generated scan and manual codes');
$stored=$pdo->query('SELECT * FROM loyalty_codes ORDER BY id DESC LIMIT 1')->fetch();
checkL($stored['token_hash']!==$issue['token'] && $stored['manual_hash']!==$issue['manual_code'],'Only hashed codes stored');
checkL(loyaltyInspectCode($pdo,3,10,'iceapp-loyalty:'.$issue['token'])['card']['id']===$card['id'],'Staff QR preview');
checkL(loyaltyInspectCode($pdo,3,10,$issue['manual_code'])['purpose']==='stamp','Manual code preview');
loyaltyQuery($pdo,"INSERT INTO shop_operator_members (shop_id,user_id,role,state,invited_by) VALUES (20,3,'staff','active',1)");
rejectsL(fn()=>loyaltyInspectCode($pdo,3,20,$issue['token']),403,'A valid code cannot be used at another assigned shop');
rejectsL(fn()=>loyaltyBook($pdo,3,['shop_id'=>10,'code'=>$issue['token'],'purpose'=>'redeem','quantity'=>1,'request_key'=>'wrong-purpose-request-001']),409,'Stamp code cannot authorize redemption');
rejectsL(fn()=>loyaltyInspectCode($pdo,5,10,$issue['token']),403,'Customer cannot confirm purchase');
$payload=['shop_id'=>10,'code'=>$issue['token'],'purpose'=>'stamp','quantity'=>30,'request_key'=>'first-purchase-request-001'];
$result=loyaltyBook($pdo,3,$payload);
checkL($result['card']['stamps']===2 && $result['card']['available_rewards']===2,'Overflow and multiple rewards');
checkL(loyaltyBook($pdo,3,$payload)===$result,'Request replay returns original result');
checkL((int)$pdo->query('SELECT COUNT(*) FROM loyalty_ledger')->fetchColumn()===1,'Replay never duplicates journal');
rejectsL(fn()=>loyaltyBook($pdo,3,array_replace($payload,['request_key'=>'second-purchase-request-001'])),409,'Code can be consumed only once');
rejectsL(fn()=>loyaltyBook($pdo,3,array_replace($payload,['quantity'=>31])),409,'Request key cannot change quantity');
rejectsL(fn()=>loyaltyBook($pdo,3,array_replace($payload,['quantity'=>'30'])),422,'Typed quantity validation');
rejectsL(fn()=>loyaltyBook($pdo,3,array_replace($payload,['quantity'=>51])),422,'Quantity maximum');
$expired=loyaltyIssueCode($pdo,4,$card['id'],'stamp');
$pdo->exec('UPDATE loyalty_codes SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND) WHERE id='.$expired['id']);
rejectsL(fn()=>loyaltyBook($pdo,3,['shop_id'=>10,'code'=>$expired['token'],'purpose'=>'stamp','quantity'=>1,'request_key'=>'expired-purchase-request-001']),409,'Expired code rejected');
$redeem=loyaltyIssueCode($pdo,4,$card['id'],'redeem');
$redeemPayload=['shop_id'=>10,'code'=>$redeem['manual_code'],'purpose'=>'redeem','quantity'=>1,'request_key'=>'redeem-purchase-request-001'];
$redeemed=loyaltyBook($pdo,2,$redeemPayload);
checkL($redeemed['card']['available_rewards']===1 && $redeemed['card']['stamps']===2,'Immediate reward redemption by operator');
checkL(loyaltyBook($pdo,2,$redeemPayload)===$redeemed,'Redemption replay');
$entry=(int)$pdo->query("SELECT id FROM loyalty_ledger WHERE kind='stamp' LIMIT 1")->fetchColumn();
rejectsL(fn()=>loyaltyReverse($pdo,2,['shop_id'=>10,'entry_id'=>$entry,'request_key'=>'reverse-purchase-request-001']),409,'Cannot reverse after prize redemption');
$new=loyaltyIssueCode($pdo,4,$card['id'],'stamp');
$beforeLedger=(int)$pdo->query('SELECT COUNT(*) FROM loyalty_ledger')->fetchColumn();
$pdo->exec("CREATE TRIGGER reject_loyalty_ledger BEFORE INSERT ON loyalty_ledger FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='simulated failure'");
try { loyaltyBook($pdo,3,['shop_id'=>10,'code'=>$new['token'],'purpose'=>'stamp','quantity'=>2,'request_key'=>'rollback-purchase-request-001']); throw new RuntimeException('Failure not triggered'); } catch (PDOException $e) {}
$pdo->exec('DROP TRIGGER reject_loyalty_ledger');
checkL(loyaltyCard($pdo,$card['id'])['total_units']===30,'Transaction failure rolls back stamps');
checkL(loyaltyInspectCode($pdo,3,10,$new['token'])['purpose']==='stamp','Transaction failure leaves code usable');
checkL((int)$pdo->query('SELECT COUNT(*) FROM loyalty_ledger')->fetchColumn()===$beforeLedger,'Transaction failure has no partial journal');
$newPayload=['shop_id'=>10,'code'=>$new['token'],'purpose'=>'stamp','quantity'=>2,'request_key'=>'reversible-purchase-request-001'];
loyaltyBook($pdo,3,$newPayload); $entry=(int)$pdo->query('SELECT MAX(id) FROM loyalty_ledger')->fetchColumn();
rejectsL(fn()=>loyaltyReverse($pdo,3,['shop_id'=>10,'entry_id'=>$entry,'request_key'=>'staff-reverse-request-001']),403,'Staff cannot reverse');
$reversal=['shop_id'=>10,'entry_id'=>$entry,'request_key'=>'owner-reverse-request-001'];
$reversed=loyaltyReverse($pdo,2,$reversal);
checkL($reversed['card']['total_units']===30,'Full compensating reversal');
checkL(loyaltyReverse($pdo,2,$reversal)===$reversed,'Reversal replay');
rejectsL(fn()=>loyaltyReverse($pdo,2,array_replace($reversal,['request_key'=>'owner-reverse-request-002'])),409,'Cannot reverse twice');
// Two separate PHP processes exercise real concurrent InnoDB locking.
function concurrentL(array $payloads): array {
    $processes=[];
    foreach ($payloads as $payload) {
        $pipes=[]; $process=proc_open([PHP_BINARY,__DIR__.'/loyalty_runner.php','3',base64_encode(json_encode($payload))],[1=>['pipe','w'],2=>['pipe','w']],$pipes);
        $processes[]=[$process,$pipes];
    }
    $results=[];
    foreach ($processes as [$process,$pipes]) { $out=stream_get_contents($pipes[1]);$err=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);checkL(proc_close($process)===0,'Concurrent runner: '.$err);$results[]=json_decode($out,true,512,JSON_THROW_ON_ERROR); }
    return $results;
}
$parallel=loyaltyIssueCode($pdo,4,$card['id'],'stamp');
$parallelPayload=['shop_id'=>10,'code'=>$parallel['token'],'purpose'=>'stamp','quantity'=>1,'request_key'=>'parallel-purchase-request-001'];
$parallelResult=concurrentL([$parallelPayload,$parallelPayload]);
checkL($parallelResult[0]===$parallelResult[1] && !isset($parallelResult[0]['error']),'Parallel same-request replay');
checkL(loyaltyCard($pdo,$card['id'])['total_units']===31,'Parallel workers produce one grant');
$rewardA=loyaltyIssueCode($pdo,4,$card['id'],'redeem'); $rewardB=loyaltyIssueCode($pdo,4,$card['id'],'redeem');
$parallelResult=concurrentL([
 ['shop_id'=>10,'code'=>$rewardA['token'],'purpose'=>'redeem','quantity'=>1,'request_key'=>'parallel-redeem-request-001'],
 ['shop_id'=>10,'code'=>$rewardB['token'],'purpose'=>'redeem','quantity'=>1,'request_key'=>'parallel-redeem-request-002']
]);
checkL(count(array_filter($parallelResult,fn($row)=>isset($row['error'])&&$row['error']===409))===1,'Concurrent redemptions cannot spend last reward twice');
checkL(loyaltyCard($pdo,$card['id'])['available_rewards']===0,'Rewards cannot become negative');
$beforeRevoke=loyaltyIssueCode($pdo,4,$card['id'],'stamp');
operatorMembership($pdo,2,'revoke_staff',['shop_id'=>10,'user_id'=>3]);
rejectsL(fn()=>loyaltyBook($pdo,3,['shop_id'=>10,'code'=>$beforeRevoke['token'],'purpose'=>'stamp','quantity'=>1,'request_key'=>'revoked-purchase-request-001']),403,'Revocation between scan and booking');
operatorMembership($pdo,2,'invite_staff',['shop_id'=>10,'username'=>'Mitarbeiter']); operatorMembership($pdo,3,'accept_invite',['shop_id'=>10]);
$purchase=operatorPublishProgram($pdo,2,['shop_id'=>10,'unit'=>'purchase','stamp_target'=>2,'reward'=>'Ein Eis gratis','current_program_id'=>$program])['program_id'];
rejectsL(fn()=>loyaltyIssueCode($pdo,4,$card['id'],'stamp'),409,'Ended card cannot earn more stamps');
rejectsL(fn()=>loyaltyJoin($pdo,5,$program),409,'Ended program disallows new cards');
checkL(loyaltyCard($pdo,$card['id'])['stamp_target']===14,'Old terms frozen');
$purchaseCard=loyaltyJoin($pdo,5,$purchase);
$purchaseCode=loyaltyIssueCode($pdo,5,$purchaseCard['id'],'stamp');
rejectsL(fn()=>loyaltyBook($pdo,3,['shop_id'=>10,'code'=>$purchaseCode['token'],'purpose'=>'stamp','quantity'=>2,'request_key'=>'invalid-multi-purchase-001']),422,'One stamp per purchase');
loyaltyBook($pdo,3,['shop_id'=>10,'code'=>$purchaseCode['token'],'purpose'=>'stamp','quantity'=>1,'request_key'=>'valid-single-purchase-001']);
$purchaseCode=loyaltyIssueCode($pdo,5,$purchaseCard['id'],'stamp');
loyaltyBook($pdo,3,['shop_id'=>10,'code'=>$purchaseCode['token'],'purpose'=>'stamp','quantity'=>1,'request_key'=>'valid-single-purchase-002']);
operatorEndProgram($pdo,2,['shop_id'=>10,'program_id'=>$purchase]);
$purchaseCode=loyaltyIssueCode($pdo,5,$purchaseCard['id'],'redeem');
checkL(loyaltyBook($pdo,3,['shop_id'=>10,'code'=>$purchaseCode['token'],'purpose'=>'redeem','quantity'=>1,'request_key'=>'ended-program-redeem-001'])['card']['available_rewards']===0,'Ended program rewards remain redeemable');
$hours=['days'=>array_map(fn($day)=>['weekday'=>$day,'ranges'=>$day===1?[['open'=>'12:00','close'=>'18:00','overnight'=>false]]:[]],range(1,7)),'note'=>'Feiertage abweichend'];
rejectsL(fn()=>operatorUpdateBusiness($pdo,3,['shop_id'=>10,'website'=>'https://shop.example.invalid','status'=>'open','opening_hours'=>$hours]),403,'Staff cannot change hours');
rejectsL(fn()=>operatorUpdateBusiness($pdo,2,['shop_id'=>10,'website'=>'javascript:alert(1)','status'=>'open','opening_hours'=>$hours]),422,'Unsafe website rejected');
operatorUpdateBusiness($pdo,2,['shop_id'=>10,'website'=>'https://shop.example.invalid','status'=>'open','opening_hours'=>$hours,'name'=>'Hacked name']);
checkL($pdo->query('SELECT name FROM eisdielen WHERE id=10')->fetchColumn()==='Pilot Eisdiele','Operator cannot alter shop identity');
checkL(count(fetch_opening_hours_rows($pdo,10))===1,'Structured opening hours persisted');
$pdo->exec("UPDATE eisdielen SET status='seasonal_closed',reopening_date='2026-12-01',closing_date='2026-11-01' WHERE id=10");
operatorUpdateBusiness($pdo,2,['shop_id'=>10,'website'=>'https://shop.example.invalid','status'=>'seasonal_closed','opening_hours'=>$hours]);
checkL($pdo->query('SELECT reopening_date FROM eisdielen WHERE id=10')->fetchColumn()==='2026-12-01','Editing hours preserves scheduled status dates');
operatorUpdateBusiness($pdo,2,['shop_id'=>10,'website'=>'https://shop.example.invalid','status'=>'open','opening_hours'=>$hours]);
checkL($pdo->query('SELECT reopening_date FROM eisdielen WHERE id=10')->fetchColumn()===null,'Explicit status change clears obsolete schedule');
checkL((int)operatorShop($pdo,2,10)['stats']['customers']===2,'Insights count unique customers');
foreach ([false,true] as $emulated) {
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES,$emulated);
    checkL(shopLoyaltyMetadata($pdo,10,2)['business_permissions']['can_stamp']===true,'Operator permissions for native/emulated PDO');
    checkL(shopLoyaltyMetadata($pdo,10,4)['business_permissions']['can_stamp']===false,'Customer permissions are restricted');
}
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES,false);
rejectsL(fn()=>operatorShop($pdo,2,20),403,'Foreign shop is forbidden');
// HTTP integration: true php://input, auth and method checks.
require_once $root.'/lib/auth.php'; $tokens=[];
foreach ([1,2,3,4,5] as $id) $tokens[$id]=generateAuthToken($pdo,$id)['token'];
$pipes=[]; $server=proc_open([PHP_BINARY,'-S','127.0.0.1:18089','-t',$root],[1=>['file','/tmp/loyalty-http.log','a'],2=>['file','/tmp/loyalty-http.log','a']],$pipes);
function httpL(string $action,?int $user=4,string $method='GET',?array $data=null,string $extra=''): array {
    global $tokens;
    $headers="Content-Type: application/json\r\n".($user!==null?'Authorization: Bearer '.$tokens[$user]."\r\n":'');
    $context=stream_context_create(['http'=>['method'=>$method,'header'=>$headers,'content'=>$data===null?'':json_encode($data),'ignore_errors'=>true]]);
    $body=file_get_contents('http://127.0.0.1:18089/loyalty.php?action='.$action.$extra,false,$context);
    preg_match('/ (\d{3}) /',$http_response_header[0],$match);
    return [(int)$match[1],json_decode($body,true)];
}
try {
    for($i=0;$i<50;$i++) { $socket=@fsockopen('127.0.0.1',18089); if($socket) { fclose($socket);break; } usleep(20000); }
    checkL(httpL('cards',null)[0]===401,'HTTP unauthenticated rejected');
    checkL(httpL('claims',2)[0]===403,'HTTP non-admin rejected');
    checkL(httpL('book')[0]===405,'GET cannot mutate');
    checkL(httpL('cards',4,'POST',[])[0]===405,'POST read action rejected');
    checkL(httpL('cards',4,'DELETE')[0]===405,'DELETE rejected');
    checkL(httpL('card',5,'GET',null,'&card_id='.$card['id'])[0]===403,'HTTP foreign card rejected');
    checkL(httpL('cards',4,'GET',null,'&nutzer_id=5')[1]['cards'][0]['user_id']===4,'Client user ID cannot choose recipient');
    checkL(httpL('book',3,'POST',['shop_id'=>10,'quantity'=>'2'])[0]===422,'HTTP invalid input rejected');
    checkL(httpL('join',5,'POST',['program_id'=>['bad']])[0]===422,'HTTP invalid ID type rejected');
    checkL(httpL('issue_code',4,'POST',['card_id'=>$card['id'],'purpose'=>['stamp']])[0]===422,'HTTP invalid purpose type rejected');
    checkL(httpL('publish_program',2,'POST',['shop_id'=>10,'unit'=>'scoop','stamp_target'=>true,'reward'=>'Eis','current_program_id'=>0])[0]===422,'HTTP invalid program types rejected');
    $context=stream_context_create(['http'=>['method'=>'POST','header'=>'Content-Type: text/plain'."\r\n".'Authorization: Bearer '.$tokens[4],'content'=>'{}','ignore_errors'=>true]]);
    file_get_contents('http://127.0.0.1:18089/loyalty.php?action=join',false,$context);
    checkL(strpos($http_response_header[0],'415')!==false,'Simple cross-origin form content type rejected');
    $codeResult=httpL('code_status',5,'GET',null,'&code_id='.$issue['id']);
    checkL($codeResult[0]===404,'Code status belongs to authenticated card holder');
    $pdo->exec('DELETE FROM nutzer WHERE id=3');
    $historyAfterDeletion=httpL('history',2,'GET',null,'&shop_id=10');
    checkL($historyAfterDeletion[0]===200 && count(array_filter($historyAfterDeletion[1]['history'],fn($row)=>$row['actor']==='Nutzer #3'))>0,'Deleted staff never removes delivery journal entries');
    $pdo->exec("INSERT INTO nutzer VALUES (3,'Mitarbeiter')");
    $pdo->exec('RENAME TABLE loyalty_programs TO loyalty_programs_unmigrated,shop_operator_members TO shop_operator_members_unmigrated');
    checkL(shopLoyaltyMetadata($pdo,10,2)===['loyalty_program'=>null,'business_permissions'=>['operator_role'=>null,'can_manage_loyalty'=>false,'can_stamp'=>false,'can_edit_business'=>false]],'Existing shop metadata works before migration');
    $pdo->exec('RENAME TABLE loyalty_programs_unmigrated TO loyalty_programs,shop_operator_members_unmigrated TO shop_operator_members');
    operatorMembership($pdo,1,'revoke_operator',['shop_id'=>10]);
    checkL(httpL('operator_shop',2,'GET',null,'&shop_id=10')[0]===403,'Admin revocation removes operator');
    checkL(loyaltyRole($pdo,10,3)===null,'Admin revocation removes all staff');
    checkL((int)$pdo->query('SELECT COUNT(*) FROM shop_operator_audit')->fetchColumn()>5,'Management audit retained');
} finally { proc_terminate($server);proc_close($server); }
for($i=0;$i<3;$i++) loyaltyRateLimit($pdo,4,'test-limit',3);
rejectsL(fn()=>loyaltyRateLimit($pdo,4,'test-limit',3),429,'Rate limiting enforced');
echo json_encode(['passed'=>$checks],JSON_PRETTY_PRINT)."\n";
