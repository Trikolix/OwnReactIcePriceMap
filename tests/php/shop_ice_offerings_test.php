<?php
require_once __DIR__ . '/../../backend/lib/shop_ice_offerings.php';
$checks = 0;
function offerCheck($condition, string $message): void {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}
function offers(array $observed = [], array $reports = [], array $operators = [], int $total = 10, int $visitors = 4): array {
    return resolveShopIceOfferings($observed, $reports, $operators, $total, $visitors, 7);
}
function vote(int $user, string $state, string $status = 'pending', string $time = '2026-10-07 12:00:00'): array {
    return ['user_id' => $user, 'ice_type' => 'softeis', 'state' => $state, 'status' => $status, 'updated_at' => $time];
}
offerCheck(offers([], [], [], 9)['softeis']['state'] === 'unknown', 'Nine visits do not infer absence');
offerCheck(offers([], [], [], 10, 3)['softeis']['state'] === 'unknown', 'Repeated visits by three people do not infer absence');
offerCheck(offers()['softeis']['source'] === 'inferred', 'Ten visits from four people infer labelled absence');
$old = ['softeis' => ['last_seen' => '2020-01-01 00:00:00', 'checkin_count' => 1]];
offerCheck(offers($old)['softeis']['state'] === 'offered', 'Even old observations prevent automatic absence; no time window');
offerCheck(offers([], [vote(7, 'offered')])['softeis']['state'] === 'unknown', 'One positive report prevents automatic hiding');
offerCheck(offers([], [vote(7, 'not_offered')], [], 0, 0)['softeis']['state'] === 'unknown', 'A single absence report is insufficient');
$two = [vote(7, 'not_offered'), vote(8, 'not_offered')];
offerCheck(offers([], $two)['softeis']['source'] === 'community', 'Two absence reports are confirmed');
offerCheck(offers([], [vote(7, 'offered'), vote(8, 'offered')])['softeis']['state'] === 'offered', 'Two positive reports confirm an offering');
offerCheck(offers([], [...$two, vote(9, 'offered')])['softeis']['source'] === 'conflict', 'Contradictory active votes keep the offering unknown');
offerCheck(offers([], [vote(7, 'not_offered', 'approved')])['softeis']['source'] === 'admin', 'One admin-approved report is sufficient');
offerCheck(offers([], [vote(7, 'not_offered', 'approved'), vote(8, 'offered', 'approved')])['softeis']['state'] === 'unknown', 'Opposing approved reports remain unknown');
foreach (['withdrawn', 'rejected'] as $status) offerCheck(offers([], [vote(7, 'not_offered', $status)], [], 0, 0)['softeis']['state'] === 'unknown', 'Inactive reports do not count');
$fresh = ['softeis' => ['last_seen' => '2026-10-07 13:00:00', 'checkin_count' => 1]];
offerCheck(offers($fresh, $two)['softeis']['state'] === 'offered', 'A new visit reopens a community-confirmed absence');
offerCheck(offers($fresh, [vote(7, 'not_offered', 'approved')])['softeis']['state'] === 'offered', 'A new observation reopens an admin-approved absence');
$owner = ['softeis' => ['state' => 'not_offered', 'updated_at' => '2026-10-07 12:00:00']];
offerCheck(offers($fresh, [], $owner)['softeis']['source'] === 'operator', 'Operator declarations retain precedence');
offerCheck(offers($fresh, [], $owner)['softeis']['discrepancy'], 'New opposing observations flag an operator discrepancy');
offerCheck(offers($old, [], $owner)['softeis']['discrepancy'] === false, 'Historical purchases do not flag a newly changed operator offering');
offerCheck(offers([], $two)['softeis']['my_state'] === 'not_offered', 'The authenticated user can see their own current vote');
offerCheck(offers([], [vote(7, 'not_offered', 'withdrawn')])['softeis']['my_state'] === 'unknown', 'Withdrawn votes are not prefilled');
foreach ([['other' => 'offered'], ['kugel' => 'invalid'], ['kugel' => true], 'invalid'] as $invalid) {
    try { offeringStates($invalid); throw new RuntimeException('Invalid offering accepted'); }
    catch (ShopOfferingError $e) { offerCheck($e->getCode() === 422, 'Invalid states are rejected'); }
}
echo "Shop offering resolver: $checks checks passed\n";
