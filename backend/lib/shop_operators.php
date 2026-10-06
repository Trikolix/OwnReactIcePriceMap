<?php
declare(strict_types=1);
require_once __DIR__ . '/loyalty.php';
require_once __DIR__ . '/opening_hours.php';

function shopOperatorPermissions(PDO $pdo,int $shopId,int $userId): array {
    $role=null;
    try { if ($userId>0) $role=loyaltyRole($pdo,$shopId,$userId); }
    catch (PDOException $e) { if ($e->getCode()!=='42S02') throw $e; }
    return ['operator_role'=>$role,'can_manage_loyalty'=>$role==='operator','can_stamp'=>in_array($role,['operator','staff'],true),'can_edit_business'=>$role==='operator'];
}
function shopLoyaltyMetadata(PDO $pdo,int $shopId,int $userId): array {
    $program=null;
    try { $program=loyaltyQuery($pdo,"SELECT id,unit,stamp_target,reward FROM loyalty_programs WHERE shop_id=? AND state='active' ORDER BY id DESC LIMIT 1",[$shopId])->fetch(PDO::FETCH_ASSOC)?:null; }
    catch (PDOException $e) { if ($e->getCode()!=='42S02') throw $e; }
    return ['loyalty_program'=>$program,'business_permissions'=>shopOperatorPermissions($pdo,$shopId,$userId)];
}
function operatorOverview(PDO $pdo,int $userId): array {
    $shops=loyaltyQuery($pdo,"SELECT e.id,e.name,m.role,m.state FROM shop_operator_members m JOIN eisdielen e ON e.id=m.shop_id WHERE m.user_id=? AND m.state IN ('active','invited') ORDER BY e.name",[$userId])->fetchAll(PDO::FETCH_ASSOC);
    $claims=loyaltyQuery($pdo,'SELECT c.*,e.name AS shop_name FROM shop_operator_claims c JOIN eisdielen e ON e.id=c.shop_id WHERE c.user_id=? ORDER BY c.id DESC',[$userId])->fetchAll(PDO::FETCH_ASSOC);
    return ['shops'=>$shops,'claims'=>$claims];
}
function operatorClaim(PDO $pdo,int $userId,array $data): array {
    $shop=loyaltyId($data['shop_id']??null); $contact=loyaltyText($data['contact']??null,300,'Kontakt'); $reason=loyaltyText($data['reason']??null,2000,'Begründung');
    return loyaltyTransaction($pdo,function() use($pdo,$shop,$userId,$contact,$reason) {
        loyaltyLockShop($pdo,$shop);
        if (loyaltyRole($pdo,$shop,$userId)==='operator') loyaltyFail('Du bist bereits Betreiber.',409);
        $old=loyaltyQuery($pdo,'SELECT * FROM shop_operator_claims WHERE shop_id=? AND user_id=?',[$shop,$userId])->fetch(PDO::FETCH_ASSOC);
        if ($old && $old['state']==='pending') loyaltyFail('Dein Antrag wartet bereits auf Prüfung.',409);
        loyaltyQuery($pdo,"INSERT INTO shop_operator_claims (shop_id,user_id,contact,reason) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE contact=VALUES(contact),reason=VALUES(reason),state='pending',review_note=NULL,reviewed_by=NULL,reviewed_at=NULL,created_at=UTC_TIMESTAMP()",[$shop,$userId,$contact,$reason]);
        loyaltyAudit($pdo,$shop,$userId,'claim_submitted',[]); return ['message'=>'Dein Antrag wurde gespeichert und wird manuell geprüft.'];
    });
}
function operatorReview(PDO $pdo,int $admin,array $data): array {
    if ($admin!==1) loyaltyFail('Nur der Administrator darf Anträge prüfen.',403);
    $id=loyaltyId($data['claim_id']??null); $approve=$data['approve']??null;
    if (!is_bool($approve)) loyaltyFail('Bitte eine Entscheidung auswählen.');
    if ($approve && ($data['verified']??null)!==true) loyaltyFail('Bitte die persönliche Prüfung bestätigen.');
    $note=loyaltyText($data['note']??null,1000,'Prüfvermerk');
    $claim=loyaltyQuery($pdo,'SELECT * FROM shop_operator_claims WHERE id=?',[$id])->fetch(PDO::FETCH_ASSOC);
    if (!$claim) loyaltyFail('Antrag nicht gefunden.',404);
    return loyaltyTransaction($pdo,function() use($pdo,$id,$admin,$approve,$note,$claim) {
        $shop=(int)$claim['shop_id']; loyaltyLockShop($pdo,$shop);
        $claim=loyaltyQuery($pdo,'SELECT * FROM shop_operator_claims WHERE id=? FOR UPDATE',[$id])->fetch(PDO::FETCH_ASSOC);
        if ($claim['state']!=='pending') loyaltyFail('Der Antrag wurde bereits geprüft.',409);
        if ($approve) {
            if (loyaltyQuery($pdo,"SELECT user_id FROM shop_operator_members WHERE shop_id=? AND role='operator' AND state='active'",[$shop])->fetchColumn()) loyaltyFail('Diese Eisdiele hat bereits einen Betreiber.',409);
            loyaltyQuery($pdo,"INSERT INTO shop_operator_members (shop_id,user_id,role,state,invited_by) VALUES (?,?,'operator','active',?) ON DUPLICATE KEY UPDATE role='operator',state='active',invited_by=VALUES(invited_by),updated_at=UTC_TIMESTAMP()",[$shop,$claim['user_id'],$admin]);
        }
        loyaltyQuery($pdo,'UPDATE shop_operator_claims SET state=?,review_note=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?',[$approve?'approved':'rejected',$note,$admin,$id]);
        loyaltyAudit($pdo,$shop,$admin,$approve?'claim_approved':'claim_rejected',['claim_id'=>$id,'note'=>$note]); return ['message'=>'Antrag geprüft.'];
    });
}
function operatorMembership(PDO $pdo,int $userId,string $action,array $data): array {
    $shop=loyaltyId($data['shop_id']??null);
    return loyaltyTransaction($pdo,function() use($pdo,$userId,$shop,$action,$data) {
        loyaltyLockShop($pdo,$shop);
        if ($action==='accept_invite') {
            $changed=loyaltyQuery($pdo,"UPDATE shop_operator_members SET state='active',updated_at=UTC_TIMESTAMP() WHERE shop_id=? AND user_id=? AND role='staff' AND state='invited'",[$shop,$userId])->rowCount();
            if (!$changed) loyaltyFail('Keine offene Einladung vorhanden.',409);
            loyaltyAudit($pdo,$shop,$userId,'invite_accepted',[]);
        } elseif ($action==='revoke_operator') {
            if ($userId!==1) loyaltyFail('Nur der Administrator darf Betreiberrechte entziehen.',403);
            loyaltyQuery($pdo,"UPDATE shop_operator_members SET state='revoked',updated_at=UTC_TIMESTAMP() WHERE shop_id=?",[$shop]);
            loyaltyQuery($pdo,"UPDATE loyalty_programs SET state='ended',ended_at=UTC_TIMESTAMP() WHERE shop_id=? AND state='active'",[$shop]);
            loyaltyAudit($pdo,$shop,$userId,'operator_revoked',[]);
        } else {
            loyaltyRequireRole($pdo,$shop,$userId,true);
            if ($action==='invite_staff') {
                $username=loyaltyText($data['username']??null,100,'Nutzername');
                $target=loyaltyQuery($pdo,'SELECT id FROM nutzer WHERE username=?',[$username])->fetchColumn();
                if (!$target) loyaltyFail('Dieser Nutzername wurde nicht gefunden.',404);
                if ((int)$target===$userId) loyaltyFail('Als Betreiber kannst du selbst stempeln.');
                $member=loyaltyQuery($pdo,'SELECT * FROM shop_operator_members WHERE shop_id=? AND user_id=?',[$shop,$target])->fetch(PDO::FETCH_ASSOC);
                if ($member && in_array($member['state'],['active','invited'],true)) loyaltyFail('Dieser Nutzer ist bereits zugeordnet oder eingeladen.',409);
                loyaltyQuery($pdo,"INSERT INTO shop_operator_members (shop_id,user_id,role,state,invited_by) VALUES (?,?,'staff','invited',?) ON DUPLICATE KEY UPDATE role='staff',state='invited',invited_by=VALUES(invited_by),updated_at=UTC_TIMESTAMP()",[$shop,$target,$userId]);
                loyaltyAudit($pdo,$shop,$userId,'staff_invited',['user_id'=>(int)$target]);
            } elseif ($action==='revoke_staff') {
                $target=loyaltyId($data['user_id']??null);
                loyaltyQuery($pdo,"UPDATE shop_operator_members SET state='revoked',updated_at=UTC_TIMESTAMP() WHERE shop_id=? AND user_id=? AND role='staff'",[$shop,$target]);
                loyaltyAudit($pdo,$shop,$userId,'staff_revoked',['user_id'=>$target]);
            } else loyaltyFail('Unbekannte Aktion.',400);
        }
        return ['message'=>'Berechtigung aktualisiert.'];
    });
}
function operatorPublishProgram(PDO $pdo,int $userId,array $data): array {
    $shop=loyaltyId($data['shop_id']??null); $unit=$data['unit']??null; $target=$data['stamp_target']??null;
    if (!in_array($unit,['scoop','purchase'],true) || !is_int($target) || $target<2 || $target>100) loyaltyFail('Bitte Einheit und Stempelziel (2–100) prüfen.');
    $reward=loyaltyText($data['reward']??null,300,'Prämie');
    $expected=$data['current_program_id']??null;
    if (!is_int($expected) || $expected<0) loyaltyFail('Bitte den aktuellen Programmstand bestätigen.');
    return loyaltyTransaction($pdo,function() use($pdo,$shop,$userId,$unit,$target,$reward,$expected) {
        loyaltyLockShop($pdo,$shop); loyaltyRequireRole($pdo,$shop,$userId,true);
        $active=loyaltyQuery($pdo,"SELECT id FROM loyalty_programs WHERE shop_id=? AND state='active'",[$shop])->fetchColumn();
        if ((int)$active!==$expected) loyaltyFail('Das Programm wurde inzwischen geändert. Bitte neu laden.',409);
        loyaltyQuery($pdo,"UPDATE loyalty_programs SET state='ended',ended_at=UTC_TIMESTAMP() WHERE shop_id=? AND state='active'",[$shop]);
        loyaltyQuery($pdo,'INSERT INTO loyalty_programs (shop_id,unit,stamp_target,reward,created_by) VALUES (?,?,?,?,?)',[$shop,$unit,$target,$reward,$userId]);
        $id=(int)$pdo->lastInsertId(); loyaltyAudit($pdo,$shop,$userId,'program_published',['program_id'=>$id,'replaced'=>(int)$active]);
        return ['program_id'=>$id,'message'=>'Kundenkartenprogramm veröffentlicht.'];
    });
}
function operatorEndProgram(PDO $pdo,int $userId,array $data): array {
    $shop=loyaltyId($data['shop_id']??null); $id=loyaltyId($data['program_id']??null);
    return loyaltyTransaction($pdo,function() use($pdo,$shop,$id,$userId) {
        loyaltyLockShop($pdo,$shop); loyaltyRequireRole($pdo,$shop,$userId,true);
        loyaltyQuery($pdo,"UPDATE loyalty_programs SET state='ended',ended_at=UTC_TIMESTAMP() WHERE id=? AND shop_id=? AND state='active'",[$id,$shop]);
        loyaltyAudit($pdo,$shop,$userId,'program_ended',['program_id'=>$id]); return ['message'=>'Programm beendet. Vorhandene Prämien bleiben einlösbar.'];
    });
}
function operatorUpdateBusiness(PDO $pdo,int $userId,array $data): array {
    $shop=loyaltyId($data['shop_id']??null); $website=loyaltyText($data['website']??'',255,'Website',true); $status=$data['status']??null;
    if ($website!=='' && (!filter_var($website,FILTER_VALIDATE_URL) || !in_array(strtolower(parse_url($website,PHP_URL_SCHEME)??''),['http','https'],true) || parse_url($website,PHP_URL_USER)!==null)) loyaltyFail('Bitte eine vollständige http- oder https-Webadresse ohne Zugangsdaten eingeben.');
    if (!in_array($status,['open','seasonal_closed','permanent_closed'],true)) loyaltyFail('Ungültiger Betriebsstatus.');
    $hours=$data['opening_hours']??null;
    if (!is_array($hours) || !is_array($hours['days']??null) || count($hours['days'])!==7) loyaltyFail('Bitte vollständige Öffnungszeiten übermitteln.');
    $seen=[];
    foreach ($hours['days'] as $day) {
        if (!is_array($day) || !is_int($day['weekday']??null) || $day['weekday']<1 || $day['weekday']>7 || isset($seen[$day['weekday']]) || !is_array($day['ranges']??null) || count($day['ranges'])>3) loyaltyFail('Ungültiger Wochentag oder Zeitbereich.');
        $seen[$day['weekday']]=true;
        foreach ($day['ranges'] as $range) {
            if (!is_array($range) || !is_string($range['open']??null) || !is_string($range['close']??null) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$range['open']) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$range['close']) || !is_bool($range['overnight']??false)) loyaltyFail('Bitte gültige Öffnungs- und Schließzeiten eingeben.');
            if ($range['close'] <= $range['open'] && !($range['overnight']??false)) loyaltyFail('Bei Schließung am Folgetag bitte „Über Nacht“ auswählen.');
        }
    }
    loyaltyText($hours['note']??'',1000,'Hinweis',true); $hours['timezone']=OPENING_HOURS_DEFAULT_TIMEZONE;
    $normalized=normalize_structured_opening_hours($hours);
    return loyaltyTransaction($pdo,function() use($pdo,$shop,$userId,$website,$status,$normalized) {
        $original=loyaltyLockShop($pdo,$shop); loyaltyRequireRole($pdo,$shop,$userId,true);
        $text=build_opening_hours_display($normalized['rows'],$normalized['note']);
        $sameStatus=($original['status']??'open')===$status;
        loyaltyQuery($pdo,'UPDATE eisdielen SET website=?,status=?,openingHours=?,opening_hours_note=?,reopening_date=?,closing_date=? WHERE id=?',[$website,$status,$text,$normalized['note'],$sameStatus?($original['reopening_date']??null):null,$sameStatus?($original['closing_date']??null):null,$shop]);
        replace_opening_hours($pdo,$shop,$normalized['rows']);
        loyaltyAudit($pdo,$shop,$userId,'business_updated',['website'=>$website,'status'=>$status,'opening_hours'=>$normalized]); return ['message'=>'Eisdielendaten gespeichert.'];
    });
}
function operatorShop(PDO $pdo,int $userId,int $shopId): array {
    $role=loyaltyRequireRole($pdo,$shopId,$userId);
    $shop=loyaltyQuery($pdo,'SELECT id,name,website,status,openingHours,opening_hours_note FROM eisdielen WHERE id=?',[$shopId])->fetch(PDO::FETCH_ASSOC);
    if (!$shop) loyaltyFail('Eisdiele nicht gefunden.',404);
    $rows=fetch_opening_hours_rows($pdo,$shopId);
    if (!$rows && !empty($shop['openingHours'])) $rows=parse_legacy_opening_hours($shop['openingHours'])['rows'];
    $shop['opening_hours']=build_structured_opening_hours($rows,$shop['opening_hours_note']);
    $programs=loyaltyQuery($pdo,'SELECT * FROM loyalty_programs WHERE shop_id=? ORDER BY id DESC',[$shopId])->fetchAll(PDO::FETCH_ASSOC);
    $result=['shop'=>$shop,'role'=>$role,'programs'=>$programs];
    if ($role==='operator') {
        $result['members']=loyaltyQuery($pdo,'SELECT m.user_id,m.role,m.state,n.username FROM shop_operator_members m JOIN nutzer n ON n.id=m.user_id WHERE shop_id=? ORDER BY m.role,n.username',[$shopId])->fetchAll(PDO::FETCH_ASSOC);
        $result['stats']=loyaltyQuery($pdo,'SELECT COUNT(DISTINCT c.user_id) AS customers,COALESCE(SUM(c.total_units),0) AS units,COALESCE(SUM(c.redeemed_rewards),0) AS redeemed,COALESCE(SUM(FLOOR(c.total_units/p.stamp_target)-c.redeemed_rewards),0) AS available FROM loyalty_cards c JOIN loyalty_programs p ON p.id=c.program_id WHERE p.shop_id=?',[$shopId])->fetch(PDO::FETCH_ASSOC);
        $result['stats']['stamp_transactions']=loyaltyQuery($pdo,"SELECT COUNT(*) FROM loyalty_ledger l WHERE shop_id=? AND kind='stamp' AND NOT EXISTS (SELECT 1 FROM loyalty_ledger r WHERE r.reversal_of=l.id)",[$shopId])->fetchColumn();
    }
    return $result;
}
