<?php

const SHOP_OWNER_EDIT_WINDOW_SECONDS = 6 * 3600;

function shopOwnerEditDeadline(array $shop): ?int
{
    $rawCreatedAt = (string)($shop['erstellt_am'] ?? '');
    $createdAt = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $rawCreatedAt);
    if (!$createdAt || $createdAt->format('Y-m-d H:i:s') !== $rawCreatedAt) {
        return null;
    }

    return $createdAt->getTimestamp() + SHOP_OWNER_EDIT_WINDOW_SECONDS;
}

function shopCanEditDirectly(array $shop, int $userId, ?int $now = null): bool
{
    if ($userId === 1) {
        return true;
    }
    if ($userId <= 0 || $userId !== (int)($shop['user_id'] ?? 0)) {
        return false;
    }

    $deadline = shopOwnerEditDeadline($shop);
    $now = $now ?? time();
    return $deadline !== null
        && $now >= $deadline - SHOP_OWNER_EDIT_WINDOW_SECONDS
        && $now <= $deadline;
}

function shopCoordinatesAreValid($latitude, $longitude): bool
{
    return is_numeric($latitude) && is_numeric($longitude)
        && is_finite((float)$latitude) && is_finite((float)$longitude)
        && (float)$latitude >= -90 && (float)$latitude <= 90
        && (float)$longitude >= -180 && (float)$longitude <= 180;
}
