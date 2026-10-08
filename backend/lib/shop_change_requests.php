<?php

require_once __DIR__ . '/opening_hours.php';
require_once __DIR__ . '/shop_place_type.php';

function buildShopChangeSet(array $data, array $shop, array $normalizedHours, string $openingHoursText, array $placeDetails): array
{
    $changeSet = [];
    foreach (['name', 'adresse', 'website', 'reopening_date', 'closing_date'] as $field) {
        if (array_key_exists($field, $data)) {
            $changeSet[$field] = $data[$field] === '' && in_array($field, ['reopening_date', 'closing_date'], true)
                ? null : $data[$field];
        }
    }
    if (isset($data['status']) && in_array($data['status'], ['open', 'seasonal_closed', 'permanent_closed'], true)) {
        $changeSet['status'] = $data['status'];
    }
    if (array_key_exists('place_type', $data) || array_key_exists('active_until', $data)) {
        foreach ($placeDetails as $field => $value) {
            if ($value !== ($shop[$field] ?? ($field === 'place_type' ? 'ice_shop' : null))) {
                $changeSet[$field] = $value;
            }
        }
    }
    if (!empty($normalizedHours['rows']) || array_key_exists('openingHoursStructured', $data)) {
        $changeSet['openingHours'] = $openingHoursText;
        $changeSet['openingHoursNote'] = $normalizedHours['note'] ?? null;
        $changeSet['openingHoursStructured'] = build_structured_opening_hours(
            $normalizedHours['rows'], $normalizedHours['note'], $normalizedHours['timezone'] ?? OPENING_HOURS_DEFAULT_TIMEZONE
        );
    }
    return $changeSet;
}
