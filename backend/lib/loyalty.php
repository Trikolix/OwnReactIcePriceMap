<?php
declare(strict_types=1);

class LoyaltyError extends RuntimeException {}

function loyaltyFail(string $message, int $status = 422): void { throw new LoyaltyError($message, $status); }
function loyaltyQuery(PDO $pdo, string $sql, array $params = []): PDOStatement {
    $stmt = $pdo->prepare($sql); $stmt->execute($params); return $stmt;
}
function loyaltyId($value): int {
    if (!(is_int($value) || (is_string($value) && ctype_digit($value))) || (int)$value < 1 || (int)$value > 2147483647) loyaltyFail('Ungültige ID.');
    return (int)$value;
}
function loyaltyText($value, int $max, string $label, bool $optional = false): string {
    if (!is_string($value)) loyaltyFail($label . ' ist ungültig.');
    $value = trim($value);
    if ((!$optional && $value === '') || preg_match('//u', $value) !== 1 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $value) || preg_match_all('/./us', $value) > $max) loyaltyFail($label . ' ist leer oder zu lang.');
    return $value;
}
function loyaltyTransaction(PDO $pdo, callable $fn) {
    $pdo->beginTransaction();
    try { $result = $fn(); $pdo->commit(); return $result; }
    catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
}
function loyaltyLockShop(PDO $pdo, int $shopId): array {
    $shop = loyaltyQuery($pdo, 'SELECT * FROM eisdielen WHERE id=? FOR UPDATE', [$shopId])->fetch(PDO::FETCH_ASSOC);
    if (!$shop) loyaltyFail('Eisdiele nicht gefunden.', 404);
    return $shop;
}
function loyaltyRole(PDO $pdo, int $shopId, int $userId): ?string {
    return loyaltyQuery($pdo, "SELECT role FROM shop_operator_members WHERE shop_id=? AND user_id=? AND state='active'", [$shopId,$userId])->fetchColumn() ?: null;
}
function loyaltyRequireRole(PDO $pdo, int $shopId, int $userId, bool $owner = false): string {
    $role = loyaltyRole($pdo,$shopId,$userId);
    if ($role !== 'operator' && ($owner || $role !== 'staff')) loyaltyFail('Für diese Eisdiele fehlt die Berechtigung.',403);
    return $role;
}
function loyaltyAudit(PDO $pdo, int $shop, int $user, string $action, array $details): void {
    loyaltyQuery($pdo,'INSERT INTO shop_operator_audit (shop_id,actor_id,action,details_json) VALUES (?,?,?,?)',[$shop,$user,$action,json_encode($details,JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
}
function loyaltyRateLimit(PDO $pdo, int $userId, string $action, int $limit): void {
    $bucket = (int)floor(time()/60);
    loyaltyQuery($pdo,'INSERT INTO loyalty_rate_limits (user_id,action,bucket) VALUES (?,?,?) ON DUPLICATE KEY UPDATE attempts=attempts+1',[$userId,$action,$bucket]);
    $count = loyaltyQuery($pdo,'SELECT attempts FROM loyalty_rate_limits WHERE user_id=? AND action=? AND bucket=?',[$userId,$action,$bucket])->fetchColumn();
    if ((int)$count > $limit) loyaltyFail('Zu viele Versuche. Bitte in einer Minute erneut versuchen.',429);
    // Bounded retention; no raw codes or IP addresses are logged.
    loyaltyQuery($pdo,'DELETE FROM loyalty_rate_limits WHERE bucket < ? LIMIT 100',[$bucket-60]);
}
function loyaltyCard(PDO $pdo, int $cardId, bool $lock = false): array {
    if ($lock) loyaltyQuery($pdo,'SELECT id FROM loyalty_cards WHERE id=? FOR UPDATE',[$cardId]);
    $row = loyaltyQuery($pdo,'SELECT c.*, p.shop_id,p.unit,p.stamp_target,p.reward,p.state AS program_state,e.name AS shop_name,n.username FROM loyalty_cards c JOIN loyalty_programs p ON p.id=c.program_id JOIN eisdielen e ON e.id=p.shop_id JOIN nutzer n ON n.id=c.user_id WHERE c.id=?',[$cardId])->fetch(PDO::FETCH_ASSOC);
    if (!$row) loyaltyFail('Kundenkarte nicht gefunden.',404);
    foreach (['id','program_id','user_id','shop_id','stamp_target','total_units','redeemed_rewards'] as $key) $row[$key]=(int)$row[$key];
    $row['stamps']=$row['total_units'] % $row['stamp_target'];
    $row['available_rewards']=intdiv($row['total_units'],$row['stamp_target'])-$row['redeemed_rewards'];
    return $row;
}
function loyaltyJoin(PDO $pdo, int $userId, int $programId): array {
    $program=loyaltyQuery($pdo,'SELECT * FROM loyalty_programs WHERE id=?',[$programId])->fetch(PDO::FETCH_ASSOC);
    if (!$program) loyaltyFail('Programm nicht gefunden.',404);
    return loyaltyTransaction($pdo,function() use($pdo,$userId,$programId,$program) {
        loyaltyLockShop($pdo,(int)$program['shop_id']);
        $current=loyaltyQuery($pdo,'SELECT state FROM loyalty_programs WHERE id=?',[$programId])->fetchColumn();
        $existing=loyaltyQuery($pdo,'SELECT id FROM loyalty_cards WHERE program_id=? AND user_id=?',[$programId,$userId])->fetchColumn();
        if (!$existing && $current !== 'active') loyaltyFail('Dieses Programm nimmt keine neuen Teilnehmer auf.',409);
        if (!$existing) { loyaltyQuery($pdo,'INSERT INTO loyalty_cards (program_id,user_id) VALUES (?,?)',[$programId,$userId]); $existing=(int)$pdo->lastInsertId(); }
        return loyaltyCard($pdo,(int)$existing);
    });
}
function loyaltyIssueCode(PDO $pdo, int $userId, int $cardId, $purpose): array {
    if (!in_array($purpose,['stamp','redeem'],true)) loyaltyFail('Ungültiger Vorgang.');
    loyaltyRateLimit($pdo,$userId,'issue',10);
    $before=loyaltyCard($pdo,$cardId);
    return loyaltyTransaction($pdo,function() use($pdo,$userId,$cardId,$purpose,$before) {
        loyaltyLockShop($pdo,$before['shop_id']);
        $card=loyaltyCard($pdo,$cardId,true);
        if ($card['user_id'] !== $userId) loyaltyFail('Diese Kundenkarte gehört einem anderen Nutzer.',403);
        if ($purpose==='stamp' && $card['program_state']!=='active') loyaltyFail('Das Programm ist beendet. Vorhandene Prämien bleiben einlösbar.',409);
        if ($purpose==='redeem' && $card['available_rewards']<1) loyaltyFail('Es ist keine Prämie verfügbar.',409);
        // Previous codes remain valid until expiry so an in-progress staff confirmation is not interrupted.
        for ($attempt=0; $attempt<5; $attempt++) {
            $token=bin2hex(random_bytes(32)); $manual=str_pad((string)random_int(0,9999999999),10,'0',STR_PAD_LEFT);
            try {
                loyaltyQuery($pdo,'INSERT INTO loyalty_codes (card_id,purpose,token_hash,manual_hash,expires_at) VALUES (?,?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 120 SECOND))',[$cardId,$purpose,hash('sha256',$token),hash('sha256',$manual)]);
                break;
            } catch (PDOException $e) { if ((int)($e->errorInfo[1]??0)!==1062 || $attempt===4) throw $e; }
        }
        $id=(int)$pdo->lastInsertId();
        return ['id'=>$id,'token'=>$token,'manual_code'=>$manual,'expires_at'=>loyaltyQuery($pdo,'SELECT expires_at FROM loyalty_codes WHERE id=?',[$id])->fetchColumn() . 'Z','purpose'=>$purpose,'card'=>$card];
    });
}
function loyaltyCodeInput($input): string {
    if (!is_string($input)) loyaltyFail('Bitte einen gültigen Code scannen oder eingeben.');
    $code=preg_replace('/\s/','',trim($input));
    if (strpos($code,'iceapp-loyalty:')===0) $code=substr($code,15);
    if (!preg_match('/^(?:[a-f0-9]{64}|[0-9]{10})$/D',$code)) loyaltyFail('Bitte einen gültigen Kundenkarten-Code verwenden.');
    return $code;
}
function loyaltyFindCode(PDO $pdo, string $raw): array {
    $field=strlen($raw)===10 ? 'manual_hash':'token_hash';
    $code=loyaltyQuery($pdo,"SELECT *, expires_at > UTC_TIMESTAMP() AS valid FROM loyalty_codes WHERE $field=?",[hash('sha256',$raw)])->fetch(PDO::FETCH_ASSOC);
    if (!$code || !(int)$code['valid'] || $code['consumed_at']) loyaltyFail('Code abgelaufen oder bereits verwendet. Bitte neu scannen.',409);
    return $code;
}
function loyaltyInspectCode(PDO $pdo,int $userId,int $shopId,$input): array {
    loyaltyRequireRole($pdo,$shopId,$userId);
    loyaltyRateLimit($pdo,$userId,'inspect',30);
    $code=loyaltyFindCode($pdo,loyaltyCodeInput($input)); $card=loyaltyCard($pdo,(int)$code['card_id']);
    if ($card['shop_id']!==$shopId) loyaltyFail('Der Code gehört zu einer anderen Eisdiele.',403);
    return ['purpose'=>$code['purpose'],'expires_at'=>$code['expires_at'].'Z','card'=>$card];
}
function loyaltyRequestKey($key): string {
    if (!is_string($key) || !preg_match('/^[a-zA-Z0-9_-]{16,80}$/D',$key)) loyaltyFail('Ein gültiger Request-Schlüssel ist erforderlich.');
    return $key;
}
function loyaltyReplay(PDO $pdo,string $key,string $hash,int $actor): ?array {
    $old=loyaltyQuery($pdo,'SELECT actor_id,request_hash,result_json FROM loyalty_ledger WHERE request_key=?',[$key])->fetch(PDO::FETCH_ASSOC);
    if (!$old) return null;
    if ((int)$old['actor_id']!==$actor || !hash_equals($old['request_hash'],$hash)) loyaltyFail('Der Request-Schlüssel wurde bereits für einen anderen Vorgang verwendet.',409);
    return json_decode($old['result_json'],true,512,JSON_THROW_ON_ERROR);
}
function loyaltyBook(PDO $pdo,int $userId,array $data): array {
    $shopId=loyaltyId($data['shop_id']??null); $key=loyaltyRequestKey($data['request_key']??null);
    $raw=loyaltyCodeInput($data['code']??null); $purpose=$data['purpose']??null;
    if (!in_array($purpose,['stamp','redeem'],true)) loyaltyFail('Ungültiger Vorgang.');
    $quantity=$data['quantity']??null;
    if (!is_int($quantity) || $quantity<1 || $quantity>50 || ($purpose==='redeem' && $quantity!==1)) loyaltyFail('Bitte eine gültige Menge zwischen 1 und 50 bestätigen.');
    $hash=hash('sha256',json_encode([$shopId,$raw,$purpose,$quantity]));
    loyaltyRateLimit($pdo,$userId,'book',60);
    return loyaltyTransaction($pdo,function() use($pdo,$userId,$shopId,$key,$raw,$purpose,$quantity,$hash) {
        // Same shop lock is taken by revocation, program changes, issue, booking and reversal.
        loyaltyLockShop($pdo,$shopId); loyaltyRequireRole($pdo,$shopId,$userId);
        $replay=loyaltyReplay($pdo,$key,$hash,$userId); if ($replay) return $replay;
        $code=loyaltyFindCode($pdo,$raw); $card=loyaltyCard($pdo,(int)$code['card_id'],true);
        if ($card['shop_id']!==$shopId) loyaltyFail('Der Code gehört zu einer anderen Eisdiele.',403);
        if ($code['purpose']!==$purpose) loyaltyFail('Der Code ist für einen anderen Vorgang bestimmt.',409);
        if ($purpose==='stamp' && $card['program_state']!=='active') loyaltyFail('Das Programm ist beendet.',409);
        if ($purpose==='stamp' && $card['unit']==='purchase' && $quantity!==1) loyaltyFail('Pro Kauf darf genau ein Stempel vergeben werden.');
        if ($purpose==='redeem' && $card['available_rewards']<1) loyaltyFail('Keine Prämie mehr verfügbar.',409);
        $units=$purpose==='stamp'?$quantity:0;
        loyaltyQuery($pdo,'UPDATE loyalty_cards SET total_units=total_units+?,redeemed_rewards=redeemed_rewards+? WHERE id=?',[$units,$purpose==='redeem'?1:0,$card['id']]);
        loyaltyQuery($pdo,'UPDATE loyalty_codes SET consumed_at=UTC_TIMESTAMP() WHERE id=? AND consumed_at IS NULL',[$code['id']]);
        $after=loyaltyCard($pdo,$card['id']);
        $delta=$after['available_rewards']-$card['available_rewards'];
        $result=['card'=>$after,'kind'=>$purpose,'quantity'=>$quantity,'reward_delta'=>$delta];
        loyaltyQuery($pdo,'INSERT INTO loyalty_ledger (shop_id,card_id,actor_id,kind,units,reward_delta,request_key,request_hash,result_json) VALUES (?,?,?,?,?,?,?,?,?)',[$shopId,$card['id'],$userId,$purpose,$units,$delta,$key,$hash,json_encode($result,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
        return $result;
    });
}
function loyaltyReverse(PDO $pdo,int $userId,array $data): array {
    $shopId=loyaltyId($data['shop_id']??null); $entryId=loyaltyId($data['entry_id']??null); $key=loyaltyRequestKey($data['request_key']??null);
    $hash=hash('sha256',json_encode(['reverse',$shopId,$entryId]));
    return loyaltyTransaction($pdo,function() use($pdo,$userId,$shopId,$entryId,$key,$hash) {
        loyaltyLockShop($pdo,$shopId); loyaltyRequireRole($pdo,$shopId,$userId,true);
        $replay=loyaltyReplay($pdo,$key,$hash,$userId); if ($replay) return $replay;
        $entry=loyaltyQuery($pdo,"SELECT * FROM loyalty_ledger WHERE id=? AND shop_id=? AND kind='stamp'",[$entryId,$shopId])->fetch(PDO::FETCH_ASSOC);
        if (!$entry) loyaltyFail('Stempelbuchung nicht gefunden.',404);
        if (loyaltyQuery($pdo,'SELECT id FROM loyalty_ledger WHERE reversal_of=?',[$entryId])->fetchColumn()) loyaltyFail('Diese Buchung wurde bereits storniert.',409);
        $card=loyaltyCard($pdo,(int)$entry['card_id'],true);
        // Conservative: no reversal after any subsequent redemption on this card.
        if (loyaltyQuery($pdo,"SELECT id FROM loyalty_ledger WHERE card_id=? AND kind='redeem' AND id>? LIMIT 1",[$card['id'],$entryId])->fetchColumn()) loyaltyFail('Nach dieser Buchung wurde eine Prämie eingelöst. Storno ist nicht mehr möglich.',409);
        $total=$card['total_units']-(int)$entry['units'];
        if ($total<0 || intdiv($total,$card['stamp_target'])<$card['redeemed_rewards']) loyaltyFail('Storno würde eine bereits eingelöste Prämie aufheben.',409);
        loyaltyQuery($pdo,'UPDATE loyalty_cards SET total_units=? WHERE id=?',[$total,$card['id']]);
        $after=loyaltyCard($pdo,$card['id']); $delta=$after['available_rewards']-$card['available_rewards'];
        $result=['card'=>$after,'kind'=>'reverse','quantity'=>(int)$entry['units'],'reward_delta'=>$delta];
        loyaltyQuery($pdo,'INSERT INTO loyalty_ledger (shop_id,card_id,actor_id,kind,units,reward_delta,reversal_of,request_key,request_hash,result_json) VALUES (?,?,?,?,?,?,?,?,?,?)',[$shopId,$card['id'],$userId,'reverse',-(int)$entry['units'],$delta,$entryId,$key,$hash,json_encode($result,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
        return $result;
    });
}
