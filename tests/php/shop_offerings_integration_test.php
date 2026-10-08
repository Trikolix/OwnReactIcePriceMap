<?php
declare(strict_types=1);
$root = getenv('ICE_OFFERING_TEST_BACKEND');
require $root . '/db_connect.php';
require $root . '/lib/auth.php';
require $root . '/lib/shop_operators.php';
$checks = 0;
function checkOffer($condition, string $message): void { global $checks; if (!$condition) throw new RuntimeException($message); $checks++; }
function offerReject(callable $fn, int $status): void {
    try { $fn(); throw new RuntimeException('Request accepted unexpectedly'); }
    catch (ShopOfferingError | LoyaltyError $e) { checkOffer($e->getCode() === $status, 'Expected rejection ' . $status); }
}
$pdo->exec("CREATE TABLE nutzer (id INT PRIMARY KEY, username VARCHAR(100));
CREATE TABLE eisdielen (id INT PRIMARY KEY, name VARCHAR(255), website VARCHAR(255),status VARCHAR(30),openingHours TEXT,opening_hours_note TEXT,reopening_date DATE,closing_date DATE);
CREATE TABLE checkins (id INT AUTO_INCREMENT PRIMARY KEY,eisdiele_id INT,nutzer_id INT,typ VARCHAR(20),datum DATETIME);
CREATE TABLE preise (id INT AUTO_INCREMENT PRIMARY KEY,eisdiele_id INT,typ VARCHAR(20),preis DECIMAL(5,2),gemeldet_am DATETIME);
CREATE TABLE eisdiele_change_requests (id INT AUTO_INCREMENT PRIMARY KEY,status VARCHAR(20));
CREATE TABLE eisdiele_opening_hours (id INT AUTO_INCREMENT PRIMARY KEY,eisdiele_id INT,weekday INT,opens_at TIME,closes_at TIME,overnight INT,sort_order INT);
CREATE TABLE user_api_tokens (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,token_hash CHAR(64),user_agent TEXT,ip_address VARCHAR(50),created_at DATETIME,last_used_at DATETIME,expires_at DATETIME,revoked_at DATETIME);
INSERT INTO nutzer VALUES (1,'Admin'),(2,'Operator'),(3,'Staff'),(4,'Visitor'),(5,'Other'),(6,'Revoked');
INSERT INTO eisdielen (id,name,status) VALUES (10,'Soft ice','open'),(20,'Restaurant','open');");
$pdo->exec(file_get_contents(__DIR__.'/../../backend/Database/migrations/2026-10-06_loyalty_pilot.sql'));
$migration=file_get_contents(__DIR__.'/../../backend/Database/migrations/2026-10-07_shop_ice_offerings.sql');
$pdo->exec($migration); $pdo->exec($migration);
$pdo->exec("INSERT INTO shop_operator_members (shop_id,user_id,role,state,invited_by) VALUES (10,2,'operator','active',1),(10,3,'staff','active',2),(20,6,'operator','revoked',1)");
for ($i=0;$i<10;$i++) offeringQuery($pdo,"INSERT INTO checkins (eisdiele_id,nutzer_id,typ,datum) VALUES (10,?,'Softeis','2020-01-01 12:00:00')",[2+$i%4]);
$resolved=getShopIceOfferings($pdo,10,4);
checkOffer($resolved['kugel']['source']==='inferred' && $resolved['softeis']['checkin_count']===10,'SQL uses all-time threshold and counts');
offeringQuery($pdo,"INSERT INTO preise (eisdiele_id,typ,preis,gemeldet_am) VALUES (10,'kugel',2.5,'2020-01-02')");
checkOffer(getShopIceOfferings($pdo,10)['kugel']['source']==='observed','A valid old price prevents automatic absence');
reportShopIceOfferings($pdo,4,['shop_id'=>20,'states'=>['kugel'=>'not_offered']]);
reportShopIceOfferings($pdo,4,['shop_id'=>20,'states'=>['kugel'=>'not_offered']]);
checkOffer(getShopIceOfferings($pdo,20)['kugel']['state']==='unknown','A repeated vote is still one user');
reportShopIceOfferings($pdo,5,['shop_id'=>20,'states'=>['kugel'=>'not_offered']]);
checkOffer(getShopIceOfferings($pdo,20)['kugel']['state']==='not_offered','Two distinct users confirm absence');
reportShopIceOfferings($pdo,4,['shop_id'=>20,'states'=>['kugel'=>'offered']]);
checkOffer(getShopIceOfferings($pdo,20)['kugel']['source']==='conflict','Changing a vote creates a visible conflict');
reportShopIceOfferings($pdo,4,['shop_id'=>20,'states'=>['kugel'=>'unknown']]);
checkOffer(getShopIceOfferings($pdo,20)['kugel']['state']==='unknown','Withdrawing a vote removes quorum');
$report=offeringQuery($pdo,"SELECT * FROM shop_ice_offering_reports WHERE shop_id=20 AND user_id=5")->fetch(PDO::FETCH_ASSOC);
offerReject(fn()=>reviewShopOfferingReport($pdo,4,['report_id'=>$report['id'],'decision'=>'approve','updated_at'=>$report['updated_at']]),403);
offerReject(fn()=>reviewShopOfferingReport($pdo,1,['report_id'=>$report['id'],'decision'=>'approve','updated_at'=>'stale']),409);
reviewShopOfferingReport($pdo,1,['report_id'=>$report['id'],'decision'=>'approve','updated_at'=>$report['updated_at']]);
checkOffer(getShopIceOfferings($pdo,20)['kugel']['source']==='admin','One real admin approval takes effect');
offerReject(fn()=>listShopOfferingReports($pdo,3,'pending'),403);
offeringQuery($pdo,"INSERT INTO checkins (eisdiele_id,nutzer_id,typ,datum) VALUES (20,4,'Kugel',DATE_ADD(NOW(), INTERVAL 1 SECOND))");
checkOffer(getShopIceOfferings($pdo,20)['kugel']['state']==='offered','A new SQL observation reopens approved absence');
$hours=['days'=>array_map(fn($day)=>['weekday'=>$day,'ranges'=>[]],range(1,7))];
$business=['shop_id'=>10,'website'=>'','status'=>'open','opening_hours'=>$hours,'ice_offerings'=>['kugel'=>'not_offered','softeis'=>'offered','eisbecher'=>'unknown']];
offerReject(fn()=>operatorUpdateBusiness($pdo,3,$business),403);
offerReject(fn()=>operatorUpdateBusiness($pdo,4,$business),403);
offerReject(fn()=>operatorUpdateBusiness($pdo,6,array_replace($business,['shop_id'=>20])),403);
operatorUpdateBusiness($pdo,2,$business);
checkOffer(getShopIceOfferings($pdo,10)['kugel']['source']==='operator','Verified active operator overrides historical price');
offeringQuery($pdo,"INSERT INTO preise (eisdiele_id,typ,preis,gemeldet_am) VALUES (10,'kugel',3,DATE_ADD(NOW(), INTERVAL 1 SECOND))");
checkOffer(getShopIceOfferings($pdo,10)['kugel']['discrepancy'],'New prices flag an operator discrepancy');
operatorUpdateBusiness($pdo,2,$business);
checkOffer(getShopIceOfferings($pdo,10)['kugel']['discrepancy'],'Saving unchanged declarations does not dismiss counterexamples');
unset($business['ice_offerings']); operatorUpdateBusiness($pdo,2,$business);
checkOffer(getShopIceOfferings($pdo,10)['kugel']['source']==='operator','Old business clients preserve offering declarations');
$business['ice_offerings']=['kugel'=>'unknown']; operatorUpdateBusiness($pdo,2,$business);
checkOffer(getShopIceOfferings($pdo,10)['kugel']['source']==='observed','Operators can withdraw an explicit offering declaration');
$business['ice_offerings']=['kugel'=>'not_offered']; operatorUpdateBusiness($pdo,2,$business);
$pdo->exec("UPDATE shop_operator_members SET state='revoked' WHERE user_id=2");
checkOffer(getShopIceOfferings($pdo,10)['kugel']['source']==='observed','Revoked operator declarations lose precedence');
offerReject(fn()=>reportShopIceOfferings($pdo,0,['shop_id'=>10,'states'=>['kugel'=>'offered']]),401);
offerReject(fn()=>reportShopIceOfferings($pdo,4,['shop_id'=>999,'states'=>['kugel'=>'offered']]),404);
reportShopIceOfferings($pdo,3,['shop_id'=>20,'states'=>['eisbecher'=>'offered']]);
checkOffer(getShopIceOfferings($pdo,20,3)['eisbecher']['my_state']==='offered','Staff can report as community members without operator privileges');

// Direct admin corrections use authenticated identity and replace older contrary decisions.
$pdo->exec("INSERT INTO eisdielen (id,name,status) VALUES (30,'Admin correction','open')");
reportShopIceOfferings($pdo,4,['shop_id'=>30,'states'=>['kugel'=>'not_offered']]);
reportShopIceOfferings($pdo,5,['shop_id'=>30,'states'=>['kugel'=>'not_offered']]);
$old=offeringQuery($pdo,"SELECT * FROM shop_ice_offering_reports WHERE shop_id=30 AND user_id=5")->fetch(PDO::FETCH_ASSOC);
reviewShopOfferingReport($pdo,1,['report_id'=>$old['id'],'decision'=>'approve','updated_at'=>$old['updated_at']]);
$pendingBefore=(int)offeringQuery($pdo,"SELECT COUNT(*) FROM shop_ice_offering_reports WHERE status='pending'")->fetchColumn();
$saved=reportShopIceOfferings($pdo,1,['shop_id'=>30,'states'=>['kugel'=>'offered','softeis'=>'not_offered','eisbecher'=>'offered']]);
foreach (['kugel'=>'offered','softeis'=>'not_offered','eisbecher'=>'offered'] as $type=>$state) {
    checkOffer($saved['ice_offerings'][$type]['state']===$state && $saved['ice_offerings'][$type]['source']==='admin','Each admin correction takes effect immediately: '.$type);
}
$adminReport=offeringQuery($pdo,"SELECT * FROM shop_ice_offering_reports WHERE shop_id=30 AND user_id=1 AND ice_type='kugel'")->fetch(PDO::FETCH_ASSOC);
checkOffer($adminReport['status']==='approved' && (int)$adminReport['decided_by']===1 && $adminReport['decided_at']!==null,'Direct admin corrections record an audited decision');
checkOffer(offeringQuery($pdo,'SELECT status FROM shop_ice_offering_reports WHERE id=?',[$old['id']])->fetchColumn()==='rejected','Admin correction supersedes an opposing older approval');
checkOffer((int)offeringQuery($pdo,"SELECT COUNT(*) FROM shop_ice_offering_reports WHERE status='pending'")->fetchColumn()===$pendingBefore,'Direct admin changes do not enter the pending queue');
reportShopIceOfferings($pdo,1,['shop_id'=>30,'states'=>['kugel'=>'not_offered']]);
checkOffer(getShopIceOfferings($pdo,30)['kugel']['state']==='not_offered','Admin can change their correction without a second approval');
reportShopIceOfferings($pdo,1,['shop_id'=>30,'states'=>['kugel'=>'unknown']]);
checkOffer(getShopIceOfferings($pdo,30,1)['kugel']['state']==='unknown' && getShopIceOfferings($pdo,30,1)['kugel']['my_state']==='unknown','Admin can withdraw their decision without reviving superseded approvals');
reportShopIceOfferings($pdo,4,['shop_id'=>30,'states'=>['softeis'=>'offered']]);
$opposing=offeringQuery($pdo,"SELECT * FROM shop_ice_offering_reports WHERE shop_id=30 AND user_id=4 AND ice_type='softeis'")->fetch(PDO::FETCH_ASSOC);
reviewShopOfferingReport($pdo,1,['report_id'=>$opposing['id'],'decision'=>'approve','updated_at'=>$opposing['updated_at']]);
checkOffer(getShopIceOfferings($pdo,30)['softeis']['state']==='offered','Moderation also supersedes a contrary earlier admin decision');
$pdo->exec("UPDATE shop_operator_members SET state='active' WHERE user_id=2");
reportShopIceOfferings($pdo,1,['shop_id'=>10,'states'=>['softeis'=>'not_offered']]);
checkOffer(getShopIceOfferings($pdo,10)['softeis']['source']==='operator' && getShopIceOfferings($pdo,10)['softeis']['state']==='offered','Active operator declarations retain the agreed precedence');
for ($i=0;$i<105;$i++) $pdo->exec("INSERT INTO eisdiele_change_requests (status) VALUES ('pending')");
$pdo->exec("INSERT INTO eisdiele_change_requests (status) VALUES ('approved'),('rejected')");

// Exercise the real HTTP/auth/content-type boundary using only the isolated database.
foreach ([1,4] as $user) {
    offeringQuery($pdo,'INSERT INTO user_api_tokens (user_id,token_hash,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 1 DAY))',[$user,hashAuthToken('offering-test-user-'.$user)]);
}
$server=proc_open([PHP_BINARY,'-S','127.0.0.1:8093','-t',$root],[0=>['pipe','r'],1=>['file','/tmp/offering-http.log','a'],2=>['file','/tmp/offering-http.log','a']],$pipes);
try {
    for ($i=0;$i<50;$i++) { $socket=@fsockopen('127.0.0.1',8093); if ($socket) { fclose($socket); break; } usleep(100000); }
    $http=function(string $action,?int $user,array $body=[],string $method='POST',string $type='application/json') {
        $headers="Content-Type: $type\r\n".($user?"Authorization: Bearer offering-test-user-$user\r\n":'');
        $context=stream_context_create(['http'=>['method'=>$method,'header'=>$headers,'content'=>json_encode($body),'ignore_errors'=>true,'timeout'=>5]]);
        $path=$action==='count' ? '/admin/get_shop_change_request_count.php' : '/shop_ice_offerings.php?action='.$action;
        $text=file_get_contents('http://127.0.0.1:8093'.$path,false,$context);
        preg_match('/\s(\d{3})\s/',$http_response_header[0],$match);
        return [(int)$match[1],json_decode($text,true)];
    };
    checkOffer($http('report',null,['shop_id'=>10,'states'=>['softeis'=>'offered']])[0]===401,'Anonymous HTTP requests are denied');
    checkOffer($http('list',4,[],'GET')[0]===403,'Forged admin identity does not grant read access');
    checkOffer($http('report',4,['shop_id'=>10,'states'=>['softeis'=>'offered']],'POST','text/plain')[0]===415,'JSON content type required');
    checkOffer($http('report',4,['shop_id'=>10,'states'=>['softeis'=>'offered'],'user_id'=>1])[0]===200,'Authenticated community reporting succeeds');
    checkOffer((int)offeringQuery($pdo,"SELECT user_id FROM shop_ice_offering_reports WHERE shop_id=10 AND ice_type='softeis' AND status='pending'")->fetchColumn()===4,'Server derives actor from bearer token');
    checkOffer(offeringQuery($pdo,"SELECT status FROM shop_ice_offering_reports WHERE shop_id=10 AND ice_type='softeis' AND user_id=4")->fetchColumn()==='pending','Spoofing user_id cannot auto-approve a community report');
    checkOffer($http('list',1,[],'GET')[0]===200,'Admin listing works over HTTP');
    checkOffer($http('report',4,[],'GET')[0]===405,'GET cannot mutate offerings');
    [$status,$result]=$http('report',1,['shop_id'=>30,'states'=>['eisbecher'=>'not_offered'],'user_id'=>4]);
    checkOffer($status===200 && $result['ice_offerings']['eisbecher']['state']==='not_offered' && $result['ice_offerings']['eisbecher']['source']==='admin','Admin token auto-approves corrections over HTTP regardless of supplied actor');
    checkOffer($http('count',null,[],'GET')[0]===401,'Guests cannot read moderation counts');
    checkOffer($http('count',4,['adminId'=>1],'GET')[0]===403,'Ordinary users cannot read moderation counts by spoofing adminId');
    checkOffer($http('count',1,[],'POST')[0]===405,'Counter is read-only');
    [$status,$counts]=$http('count',1,[],'GET');
    $pending=(int)offeringQuery($pdo,"SELECT COUNT(*) FROM shop_ice_offering_reports WHERE status='pending'")->fetchColumn();
    checkOffer($status===200 && $counts['shop_changes']===105 && $counts['ice_offerings']===$pending && $counts['pending_count']===105+$pending,'Counter includes both pending queues without pagination or decided reports');
    $pdo->exec('RENAME TABLE shop_ice_offering_reports TO offering_reports_unmigrated');
    try {
        [$status,$counts]=$http('count',1,[],'GET');
        checkOffer($status===200 && $counts['pending_count']===105,'Counter works before the offering migration is installed');
    } finally { $pdo->exec('RENAME TABLE offering_reports_unmigrated TO shop_ice_offering_reports'); }
    $pdo->exec("UPDATE eisdiele_change_requests SET status='approved'; UPDATE shop_ice_offering_reports SET status='rejected' WHERE status='pending'");
    checkOffer($http('count',1,[],'GET')[1]['pending_count']===0,'An empty moderation queue reports zero');
} finally { proc_terminate($server); proc_close($server); }
echo "Shop offering integration: $checks checks passed\n";
