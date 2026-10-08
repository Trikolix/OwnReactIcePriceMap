<?php

require_once __DIR__ . '/../../backend/lib/summer_campaign_results.php';

function expectSummerResult($actual, $expected, string $message): void
{
    if ($actual !== $expected) {
        throw new RuntimeException($message . ': ' . json_encode($actual) . ' != ' . json_encode($expected));
    }
}

$config = [
    'campaign_id' => 'summer_2026',
    'title' => 'Sommer-Sammelaktion 2026',
    'starts_at' => '2026-05-01 00:00:00',
    'ends_at' => '2026-09-30 23:59:59',
];
$card = static fn(int $shop, ?int $user, ?string $username, int $confirmed): array => [
    'summer_shop_id' => $shop,
    'shop_id' => $shop + 100,
    'shop_name' => 'Eisdiele ' . $shop,
    'award_icon' => null,
    'user_id' => $user,
    'username' => $username,
    'checkin_confirmed' => $confirmed,
];

$result = buildSummerCampaignResults($config, [
    $card(1, 1, 'Anna', 1),
    $card(1, 1, 'Anna', 1), // A repeated scan must not improve the result.
    $card(2, 1, 'Anna', 1),
    $card(1, 2, 'Ben', 1),
    $card(2, 2, 'Ben', 0), // All scans alone do not complete the album.
    $card(1, 3, 'Clara', 0),
    $card(1, 4, 'Dora', 0), // Identical results share their rank.
    $card(1, 5, 'Emil', 1),
]);
expectSummerResult($result['summary'], [
    'participants' => 5, 'total_shops' => 2, 'collected' => 7, 'confirmed' => 4, 'complete_albums' => 1,
], 'Each person and card counts once');
expectSummerResult(array_column($result['ranking'], 'user_id'), [1, 2, 5, 3, 4], 'Cards rank before confirmations');
expectSummerResult(array_column($result['ranking'], 'rank'), [1, 2, 3, 4, 4], 'Equal scores share their rank');
expectSummerResult(array_column($result['ranking'], 'album_complete'), [true, false, false, false, false], 'Complete albums require every confirmation');
expectSummerResult(array_column($result['shops'], 'scan_count'), [5, 2], 'Shop totals match the ranking');
expectSummerResult(array_column($result['shops'], 'checkin_count'), [3, 1], 'Confirmations are counted per collector');

$sharedPodium = buildSummerCampaignResults($config, [
    $card(1, 2, 'Ben', 1), $card(1, 1, 'Anna', 1), $card(1, 3, 'Clara', 0),
]);
expectSummerResult(array_column($sharedPodium['ranking'], 'rank'), [1, 1, 3], 'Competition ranking skips shared places');

$empty = buildSummerCampaignResults($config, [$card(1, null, null, 0), $card(2, null, null, 0)]);
expectSummerResult($empty['ranking'], [], 'Uncollected shops do not create participants');
expectSummerResult($empty['summary']['total_shops'], 2, 'Uncollected shops remain visible');
expectSummerResult($empty['summary']['complete_albums'], 0, 'No empty album is complete');
expectSummerResult(buildSummerCampaignResults($config, [])['summary']['participants'], 0, 'No configured shops yields an empty result');

$duplicateConfirmation = buildSummerCampaignResults($config, [
    $card(1, 1, 'Anna', 0), $card(1, 1, 'Anna', 1), $card(1, 1, 'Anna', 1),
]);
expectSummerResult($duplicateConfirmation['summary']['collected'], 1, 'Repeated scans stay unique');
expectSummerResult($duplicateConfirmation['summary']['confirmed'], 1, 'Repeated confirmations stay unique');

echo "Summer campaign result tests passed\n";
