<?php
function onboardingStages(array $stats): array
{
    return [
        1 => [
            'avatar' => !empty($stats['avatar']),
            'installation' => !empty($stats['app_installed']),
            'push' => !empty($stats['push_active']),
            'checkin' => (int)($stats['checkins'] ?? 0) >= 1,
            'invitation' => (int)($stats['invited_count'] ?? 0) >= 1 || !empty($stats['invite_shared']),
            'social' => !empty($stats['social_account']),
        ],
        2 => [
            'shop' => (int)($stats['created_shops_with_checkin'] ?? 0) >= 1,
            'review' => (int)($stats['reviews'] ?? 0) >= 1,
            'checkins' => (int)($stats['checkins'] ?? 0) >= 5,
            'challenge' => (int)($stats['completed_challenges'] ?? 0) >= 1,
            'route' => (int)($stats['routes'] ?? 0) >= 1,
            'likes' => (int)($stats['foreign_likes'] ?? 0) >= 10,
        ],
    ];
}
