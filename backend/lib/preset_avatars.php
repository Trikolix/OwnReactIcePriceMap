<?php

function getPresetAvatarDirectory(): string {
    return __DIR__ . '/../../public/assets/comic-avatars';
}

function allowedPresetExtensions(): array {
    return ['png', 'jpg', 'jpeg', 'webp', 'svg'];
}

function formatPresetLabel(string $filename): string {
    $name = preg_replace('/\.[^.]+$/', '', $filename);
    $name = str_replace(['-', '_'], ' ', $name);
    $name = preg_replace('/\s+/', ' ', trim($name));
    if ($name === '') {
        return 'Avatar';
    }
    return ucwords($name);
}

function normalizePresetId(string $filename): string {
    $name = preg_replace('/\.[^.]+$/', '', $filename);
    $name = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name));
    $name = trim($name, '-');
    return $name !== '' ? $name : 'avatar';
}

function listPresetAvatars(): array {
    $dir = getPresetAvatarDirectory();
    if (!is_dir($dir)) {
        return [];
    }

    $entries = [];
    $files = scandir($dir);
    $allowed = allowedPresetExtensions();
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        $fullPath = $dir . '/' . $file;
        if (!is_file($fullPath)) {
            continue;
        }
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($extension, $allowed, true)) {
            continue;
        }
        $entries[] = [
            'id' => normalizePresetId($file),
            'label' => formatPresetLabel($file),
            'path' => 'public/assets/comic-avatars/' . $file,
        ];
    }

    usort($entries, fn($a, $b) => strcmp($a['label'], $b['label']));
    return $entries;
}

function listPresetAvatarPaths(): array {
    return array_map(fn($entry) => $entry['path'], listPresetAvatars());
}
