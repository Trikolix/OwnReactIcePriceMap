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

function getPresetAvatarMinLevel(string $relativeDirectory): int {
    if (preg_match('~(?:^|/)level-(\d+)(?:/|$)~', str_replace('\\', '/', $relativeDirectory), $matches)) {
        return max(0, (int)$matches[1]);
    }

    return 0;
}

function scanPresetAvatarDirectory(string $directory, string $relativeDirectory = ''): array {
    if (!is_dir($directory)) {
        return [];
    }

    $dir = getPresetAvatarDirectory();
    $basePath = rtrim(str_replace('\\', '/', realpath($dir) ?: $dir), '/');
    $currentPath = rtrim(str_replace('\\', '/', realpath($directory) ?: $directory), '/');
    if (strpos($currentPath, $basePath) !== 0) {
        return [];
    }

    $entries = [];
    $files = scandir($directory);
    $allowed = allowedPresetExtensions();
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        $fullPath = $directory . '/' . $file;
        $entryRelativeDirectory = trim($relativeDirectory . '/' . $file, '/');

        if (is_dir($fullPath)) {
            $entries = array_merge($entries, scanPresetAvatarDirectory($fullPath, $entryRelativeDirectory));
            continue;
        }

        if (!is_file($fullPath)) {
            continue;
        }

        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($extension, $allowed, true)) {
            continue;
        }
        $relativePath = trim($relativeDirectory . '/' . $file, '/');
        $minLevel = getPresetAvatarMinLevel($relativeDirectory);
        $entries[] = [
            'id' => normalizePresetId($relativePath),
            'label' => formatPresetLabel($file),
            'path' => 'public/assets/comic-avatars/' . $relativePath,
            'min_level' => $minLevel,
        ];
    }

    return $entries;
}

function listPresetAvatars(?int $currentLevel = null): array {
    $entries = scanPresetAvatarDirectory(getPresetAvatarDirectory());

    usort($entries, function ($a, $b) {
        $levelCompare = ((int)$a['min_level']) <=> ((int)$b['min_level']);
        if ($levelCompare !== 0) {
            return $levelCompare;
        }
        return strcmp($a['label'], $b['label']);
    });

    if ($currentLevel !== null) {
        $level = max(0, $currentLevel);
        $entries = array_map(function ($entry) use ($level) {
            $entry['unlocked'] = $level >= (int)$entry['min_level'];
            return $entry;
        }, $entries);
    }

    return $entries;
}

function listPresetAvatarPaths(): array {
    return array_map(fn($entry) => $entry['path'], listPresetAvatars());
}

function findPresetAvatarByPath(string $path): ?array {
    $normalizedPath = ltrim($path, '/');
    foreach (listPresetAvatars() as $entry) {
        if (($entry['path'] ?? '') === $normalizedPath) {
            return $entry;
        }
    }

    return null;
}
