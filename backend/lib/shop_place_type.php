<?php

function buildShopPlaceTypeFilter(?string $rawTypes): array
{
    if ($rawTypes === null) return ['sql' => '', 'params' => []];
    $types = array_values(array_unique(array_intersect(
        array_map('trim', explode(',', $rawTypes)), ['ice_shop', 'restaurant', 'temporary_stand']
    )));
    if (!$types) return ['sql' => ' AND 1 = 0', 'params' => []];
    $params = [];
    foreach ($types as $index => $type) $params[':visiblePlaceType' . $index] = $type;
    return ['sql' => ' AND e.place_type IN (' . implode(', ', array_keys($params)) . ')', 'params' => $params];
}

function normalizeShopPlaceTypeUpdate(array $data, array $shop, ?int $now = null): array
{
    $placeType = $data['place_type'] ?? $shop['place_type'] ?? 'ice_shop';
    if (!in_array($placeType, ['ice_shop', 'restaurant', 'temporary_stand'], true)) {
        throw new InvalidArgumentException('Ungültiger Ortstyp.');
    }

    $activeUntil = null;
    $closedEarlyAt = null;
    if ($placeType === 'temporary_stand') {
        $rawActiveUntil = trim((string)($data['active_until'] ?? $shop['active_until'] ?? ''));
        $timestamp = $rawActiveUntil !== '' ? strtotime($rawActiveUntil) : false;
        $originalTimestamp = !empty($shop['active_until']) ? strtotime($shop['active_until']) : false;
        $unchanged = ($shop['place_type'] ?? 'ice_shop') === $placeType && $timestamp === $originalTimestamp;
        if ($timestamp === false || (!$unchanged && $timestamp <= ($now ?? time()))) {
            throw new InvalidArgumentException('Für einen temporären Stand ist ein zukünftiges Enddatum erforderlich.');
        }
        $activeUntil = date('Y-m-d H:i:s', $timestamp);
        $closedEarlyAt = $unchanged ? ($shop['closed_early_at'] ?? null) : null;
    }

    return ['place_type' => $placeType, 'active_until' => $activeUntil, 'closed_early_at' => $closedEarlyAt];
}
