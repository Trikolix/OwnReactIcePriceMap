<?php

require_once __DIR__ . '/../../backend/lib/shop_editing.php';

function expectShopEditing($actual, $expected, string $message): void
{
    if ($actual !== $expected) {
        throw new RuntimeException($message . ': ' . json_encode($actual) . ' != ' . json_encode($expected));
    }
}

$createdAt = strtotime('2026-10-05 12:00:00');
$shop = ['user_id' => 42, 'erstellt_am' => '2026-10-05 12:00:00'];
$deadline = $createdAt + 6 * 3600;
expectShopEditing(shopOwnerEditDeadline($shop), $deadline, 'Deadline is six hours after creation');
expectShopEditing(shopCanEditDirectly($shop, 42, $createdAt), true, 'Creator can correct a new shop');
expectShopEditing(shopCanEditDirectly($shop, 42, $deadline), true, 'Creator can correct at the deadline');
expectShopEditing(shopCanEditDirectly($shop, 42, $deadline + 1), false, 'Creator cannot correct after the deadline');
expectShopEditing(shopCanEditDirectly($shop, 43, $createdAt), false, 'Other users cannot move a new shop');
expectShopEditing(shopCanEditDirectly($shop, 1, $deadline + 1), true, 'Administrator can correct older shops');
expectShopEditing(shopCanEditDirectly($shop, 42, $createdAt - 1), false, 'Future creation dates do not grant access');
expectShopEditing(shopCanEditDirectly(['user_id' => 0, 'erstellt_am' => $shop['erstellt_am']], 0, $createdAt), false, 'Anonymous users cannot be creators');
foreach (['', 'invalid', '2026-02-30 12:00:00'] as $invalidDate) {
    $invalidShop = ['user_id' => 42, 'erstellt_am' => $invalidDate];
    expectShopEditing(shopOwnerEditDeadline($invalidShop), null, 'Invalid creation dates have no deadline');
    expectShopEditing(shopCanEditDirectly($invalidShop, 42, $createdAt), false, 'Invalid dates do not grant access');
}

foreach ([[50.83, 12.92], ['50.830000', '12.920000'], [0, 0], [-90, -180], [90, 180]] as [$lat, $lon]) {
    expectShopEditing(shopCoordinatesAreValid($lat, $lon), true, 'Valid coordinates are accepted');
}
foreach ([[null, 12], ['', 12], [' ', 12], ['invalid', 12], [true, 12], [[], 12], [91, 12], [50, -181], [INF, 0], [0, NAN]] as [$lat, $lon]) {
    expectShopEditing(shopCoordinatesAreValid($lat, $lon), false, 'Missing, nonnumeric and out-of-range coordinates are rejected');
}

echo "Shop editing tests passed\n";
