<?php

function featureAccessAllowedUserIds(string $featureKey): array
{
    static $map = [
        'external_discovery' => [1],
    ];

    return $map[$featureKey] ?? [];
}

function featureAccessCanUse(string $featureKey, int $userId): bool
{
    return in_array($userId, featureAccessAllowedUserIds($featureKey), true);
}
