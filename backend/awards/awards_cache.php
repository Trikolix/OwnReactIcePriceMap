<?php

function awardsCacheDir(): string
{
    return __DIR__ . '/cache';
}

function awardsCacheFilePath(): string
{
    return awardsCacheDir() . '/awards.json';
}

function ensureAwardsCacheDirExists(): void
{
    $dir = awardsCacheDir();
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
}

function readAwardsCache(int $maxAgeSeconds): ?string
{
    $file = awardsCacheFilePath();
    if (!is_file($file)) {
        return null;
    }

    $mtime = @filemtime($file);
    if ($mtime === false) {
        return null;
    }

    if ((time() - $mtime) > $maxAgeSeconds) {
        return null;
    }

    $json = @file_get_contents($file);
    if ($json === false || $json === '') {
        return null;
    }

    return $json;
}

function writeAwardsCache(string $json): void
{
    ensureAwardsCacheDirExists();
    @file_put_contents(awardsCacheFilePath(), $json, LOCK_EX);
}

function invalidateAwardsCache(): void
{
    $file = awardsCacheFilePath();
    if (is_file($file)) {
        @unlink($file);
    }
}

