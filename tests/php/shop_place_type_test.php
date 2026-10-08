<?php

require_once __DIR__ . '/../../backend/lib/shop_change_requests.php';

function expectPlaceType($actual, $expected, string $message): void
{
    if ($actual !== $expected) {
        throw new RuntimeException($message . ': ' . json_encode($actual) . ' != ' . json_encode($expected));
    }
}

$now = strtotime('2026-10-05 12:00:00');
$iceShop = ['place_type' => 'ice_shop', 'active_until' => null, 'closed_early_at' => null];
$hours = normalize_structured_opening_hours(null);
$restaurant = ['place_type' => 'restaurant', 'active_until' => null, 'closed_early_at' => null];
$data = ['name' => 'Test', 'place_type' => 'restaurant', 'active_until' => null];
$normalized = normalizeShopPlaceTypeUpdate($data, $iceShop, $now);
expectPlaceType($normalized, $restaurant, 'Direct updates convert an ice shop to a restaurant');
$changes = buildShopChangeSet($data, $iceShop, $hours, '', $normalized);
expectPlaceType($changes['place_type'], 'restaurant', 'Change requests contain the selected place type');
$persisted = json_decode(json_encode(['changes' => $changes]), true)['changes'];
expectPlaceType(normalizeShopPlaceTypeUpdate($persisted, $iceShop, $now), $restaurant, 'A serialized proposal can be approved with the same place type');

$endDate = '2026-10-06 23:59:59';
$stand = ['place_type' => 'temporary_stand', 'active_until' => $endDate, 'closed_early_at' => '2026-10-05 11:00:00'];
$converted = normalizeShopPlaceTypeUpdate($data, $stand, $now);
expectPlaceType($converted, $restaurant, 'Conversion to a restaurant clears temporary visibility limits');
$changes = buildShopChangeSet($data, $stand, $hours, '', $converted);
expectPlaceType($changes['active_until'], null, 'Proposals clear the temporary end date');
expectPlaceType($changes['closed_early_at'], null, 'Proposals clear early closure');
expectPlaceType(normalizeShopPlaceTypeUpdate($changes, $stand, $now), $restaurant, 'Approval also clears both temporary limits');

$temporaryData = ['place_type' => 'temporary_stand', 'active_until' => $endDate];
$newStand = normalizeShopPlaceTypeUpdate($temporaryData, $iceShop, $now);
expectPlaceType($newStand['active_until'], $endDate, 'A new temporary stand keeps its selected end date');
expectPlaceType(normalizeShopPlaceTypeUpdate($temporaryData, $stand, $now)['closed_early_at'], $stand['closed_early_at'], 'Unchanged visibility settings preserve early closure');
expectPlaceType(normalizeShopPlaceTypeUpdate(['name' => 'New name'], $restaurant, $now), $restaurant, 'Legacy requests without a place type preserve the existing type');
expectPlaceType(buildShopChangeSet(['name' => 'New name'], $restaurant, $hours, '', $restaurant), ['name' => 'New name'], 'Name-only proposals do not alter the place type');

foreach ([['place_type' => 'invalid'], ['place_type' => []], ['place_type' => 'temporary_stand'],
    ['place_type' => 'temporary_stand', 'active_until' => '2026-10-04 12:00:00']] as $invalidData) {
    try {
        normalizeShopPlaceTypeUpdate($invalidData, $iceShop, $now);
        throw new RuntimeException('Invalid place-type updates must be rejected');
    } catch (InvalidArgumentException $e) {
        // Expected: invalid types and expired/missing stand dates must not be stored.
    }
}
try {
    normalizeShopPlaceTypeUpdate($temporaryData, $iceShop, strtotime($endDate) + 1);
    throw new RuntimeException('An expired temporary-stand proposal must not be approved');
} catch (InvalidArgumentException $e) {
}

expectPlaceType(buildShopPlaceTypeFilter(null), ['sql' => '', 'params' => []], 'Other consumers can request all place types');
$filter = buildShopPlaceTypeFilter('ice_shop,temporary_stand');
expectPlaceType(array_values($filter['params']), ['ice_shop', 'temporary_stand'], 'An inactive restaurant filter excludes restaurants in the SQL parameters');
expectPlaceType(array_values(buildShopPlaceTypeFilter('restaurant')['params']), ['restaurant'], 'Restaurant-only filtering is supported');
expectPlaceType(buildShopPlaceTypeFilter(''), ['sql' => ' AND 1 = 0', 'params' => []], 'No enabled place types means no visible shops');
expectPlaceType(buildShopPlaceTypeFilter("invalid'); DROP TABLE eisdielen; --"), ['sql' => ' AND 1 = 0', 'params' => []], 'Unrecognized place types cannot enter the SQL filter');

echo "Shop place-type tests passed\n";
