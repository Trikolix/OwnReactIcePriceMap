<?php
declare(strict_types=1);
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/shop_operators.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
try {
    $pdo->exec("SET time_zone = '+00:00'");
    $method=$_SERVER['REQUEST_METHOD']??'GET';
    if (!in_array($method,['GET','POST'],true)) { header('Allow: GET, POST'); loyaltyFail('Methode nicht erlaubt.',405); }
    $auth=requireAuth($pdo); $userId=(int)$auth['user_id'];
    $action=$_GET['action']??'cards';
    $reads=['cards','card','code_status','shop','overview','operator_shop','claims','operators','history'];
    $writes=['join','issue_code','inspect_code','book','reverse','claim','review_claim','invite_staff','accept_invite','revoke_staff','revoke_operator','publish_program','end_program','update_business'];
    if (!in_array($action,array_merge($reads,$writes),true)) loyaltyFail('Unbekannte Aktion.',400);
    if (($method==='GET' && !in_array($action,$reads,true)) || ($method==='POST' && !in_array($action,$writes,true))) { header('Allow: '.(in_array($action,$reads,true)?'GET':'POST')); loyaltyFail('Methode nicht erlaubt.',405); }
    $data=[];
    if ($method==='POST') {
        if (strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]))!=='application/json') loyaltyFail('JSON ist erforderlich.',415);
        if ((int)($_SERVER['CONTENT_LENGTH']??0)>32768) loyaltyFail('Anfrage zu groß.',413);
        $raw=file_get_contents('php://input',false,null,0,32769);
        if (strlen($raw)>32768) loyaltyFail('Anfrage zu groß.',413);
        $data=json_decode($raw,true,32,JSON_THROW_ON_ERROR);
        if (!is_array($data) || (strlen(ltrim($raw)) && ltrim($raw)[0]!=='{')) loyaltyFail('Ein JSON-Objekt ist erforderlich.',400);
    }
    switch ($action) {
        case 'cards':
            $ids=loyaltyQuery($pdo,'SELECT id FROM loyalty_cards WHERE user_id=? ORDER BY id DESC',[$userId])->fetchAll(PDO::FETCH_COLUMN);
            $result=['cards'=>array_map(fn($id)=>loyaltyCard($pdo,(int)$id),$ids)]; break;
        case 'card':
            $card=loyaltyCard($pdo,loyaltyId($_GET['card_id']??null));
            if ($card['user_id']!==$userId) loyaltyFail('Diese Karte gehört einem anderen Nutzer.',403);
            $before=isset($_GET['before_id'])?loyaltyId($_GET['before_id']):PHP_INT_MAX;
            $history=loyaltyQuery($pdo,'SELECT id,kind,units,reward_delta,created_at FROM loyalty_ledger WHERE card_id=? AND id<? ORDER BY id DESC LIMIT 51',[$card['id'],$before])->fetchAll(PDO::FETCH_ASSOC);
            $hasMore=count($history)>50; $history=array_slice($history,0,50);
            $result=['card'=>$card,'history'=>$history,'next_cursor'=>$hasMore?(int)end($history)['id']:null]; break;
        case 'code_status':
            $code=loyaltyQuery($pdo,'SELECT x.id,x.card_id,x.consumed_at,x.expires_at<=UTC_TIMESTAMP() AS expired FROM loyalty_codes x JOIN loyalty_cards c ON c.id=x.card_id WHERE x.id=? AND c.user_id=?',[loyaltyId($_GET['code_id']??null),$userId])->fetch(PDO::FETCH_ASSOC);
            if (!$code) loyaltyFail('Code nicht gefunden.',404); $result=['code'=>$code]; break;
        case 'shop':
            $shop=loyaltyId($_GET['shop_id']??null);
            $program=loyaltyQuery($pdo,"SELECT p.*,e.name AS shop_name FROM loyalty_programs p JOIN eisdielen e ON e.id=p.shop_id WHERE p.shop_id=? AND p.state='active' ORDER BY p.id DESC LIMIT 1",[$shop])->fetch(PDO::FETCH_ASSOC);
            $result=['program'=>$program?:null,'permissions'=>shopOperatorPermissions($pdo,$shop,$userId)]; break;
        case 'overview': $result=operatorOverview($pdo,$userId); break;
        case 'operator_shop': $result=operatorShop($pdo,$userId,loyaltyId($_GET['shop_id']??null)); break;
        case 'claims':
            if ($userId!==1) loyaltyFail('Nur für den Administrator.',403);
            $result=['claims'=>loyaltyQuery($pdo,'SELECT c.*,e.name AS shop_name,n.username FROM shop_operator_claims c JOIN eisdielen e ON e.id=c.shop_id JOIN nutzer n ON n.id=c.user_id ORDER BY (c.state=\'pending\') DESC,c.id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC)]; break;
        case 'operators':
            if ($userId!==1) loyaltyFail('Nur für den Administrator.',403);
            $result=['operators'=>loyaltyQuery($pdo,"SELECT m.shop_id,m.user_id,e.name AS shop_name,n.username FROM shop_operator_members m JOIN eisdielen e ON e.id=m.shop_id JOIN nutzer n ON n.id=m.user_id WHERE m.role='operator' AND m.state='active' ORDER BY e.name")->fetchAll(PDO::FETCH_ASSOC)]; break;
        case 'history':
            $shop=loyaltyId($_GET['shop_id']??null); loyaltyRequireRole($pdo,$shop,$userId,true);
            $before=isset($_GET['before_id'])?loyaltyId($_GET['before_id']):PHP_INT_MAX;
            $rows=loyaltyQuery($pdo,"SELECT l.id,l.kind,l.units,l.reward_delta,l.created_at,l.reversal_of,COALESCE(n.username,CONCAT('Nutzer #',l.actor_id)) AS actor,c.user_id,p.reward,EXISTS(SELECT 1 FROM loyalty_ledger r WHERE r.reversal_of=l.id) AS reversed FROM loyalty_ledger l LEFT JOIN nutzer n ON n.id=l.actor_id JOIN loyalty_cards c ON c.id=l.card_id JOIN loyalty_programs p ON p.id=c.program_id WHERE l.shop_id=? AND l.id<? ORDER BY l.id DESC LIMIT 51",[$shop,$before])->fetchAll(PDO::FETCH_ASSOC);
            $hasMore=count($rows)>50; $rows=array_slice($rows,0,50); $result=['history'=>$rows,'next_cursor'=>$hasMore?(int)end($rows)['id']:null]; break;
        case 'join': $result=['card'=>loyaltyJoin($pdo,$userId,loyaltyId($data['program_id']??null))]; break;
        case 'issue_code': $result=loyaltyIssueCode($pdo,$userId,loyaltyId($data['card_id']??null),$data['purpose']??''); break;
        case 'inspect_code': $result=loyaltyInspectCode($pdo,$userId,loyaltyId($data['shop_id']??null),$data['code']??null); break;
        case 'book': $result=loyaltyBook($pdo,$userId,$data); break;
        case 'reverse': $result=loyaltyReverse($pdo,$userId,$data); break;
        case 'claim': $result=operatorClaim($pdo,$userId,$data); break;
        case 'review_claim': $result=operatorReview($pdo,$userId,$data); break;
        case 'invite_staff': case 'accept_invite': case 'revoke_staff': case 'revoke_operator': $result=operatorMembership($pdo,$userId,$action,$data); break;
        case 'publish_program': $result=operatorPublishProgram($pdo,$userId,$data); break;
        case 'end_program': $result=operatorEndProgram($pdo,$userId,$data); break;
        case 'update_business': $result=operatorUpdateBusiness($pdo,$userId,$data); break;
    }
    echo json_encode(['status'=>'success']+$result,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
} catch (LoyaltyError | ShopOfferingError $e) {
    http_response_code($e->getCode()); echo json_encode(['status'=>'error','message'=>$e->getMessage()],JSON_UNESCAPED_UNICODE);
} catch (JsonException $e) {
    http_response_code(400); echo json_encode(['status'=>'error','message'=>'Ungültige JSON-Anfrage.']);
} catch (Throwable $e) {
    error_log('Loyalty API: '.get_class($e).' '.$e->getCode());
    http_response_code(503); echo json_encode(['status'=>'error','message'=>'Kundenkarten sind gerade nicht verfügbar. Bitte erneut versuchen.']);
}
