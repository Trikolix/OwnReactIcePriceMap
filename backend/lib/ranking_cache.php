<?php
declare(strict_types=1);

/**
 * A small per-request-parameter cache for ranking responses.
 *
 * APCu is not available on every hosting stage, therefore the cache uses
 * private files in the system temporary directory. The cache key must always
 * include every value that can change the response (especially the viewer for
 * favourites and the rated user for personal rankings).
 */
const RANKING_CACHE_TTL_SECONDS = 45;

function ranking_cache_path(string $key): string
{
    $directory = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'ice-app-ranking-cache';
    if (!is_dir($directory)) {
        @mkdir($directory, 0700, true);
    }
    return $directory . DIRECTORY_SEPARATOR . hash('sha256', $key) . '.json';
}

function ranking_cache_key(array $parts): string
{
    ksort($parts);
    return 'ranking:v3:' . json_encode($parts, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function ranking_cache_read(string $key, int $ttl = RANKING_CACHE_TTL_SECONDS): ?string
{
    $path = ranking_cache_path($key);
    if (!is_file($path)) {
        return null;
    }
    $mtime = @filemtime($path);
    if ($mtime === false || (time() - $mtime) >= $ttl) {
        @unlink($path);
        return null;
    }
    $encoded = @file_get_contents($path);
    if ($encoded === false) {
        return null;
    }
    $cache = json_decode($encoded, true);
    if (!is_array($cache) || !isset($cache['body']) || !is_string($cache['body'])) {
        @unlink($path);
        return null;
    }
    return $cache['body'];
}

function ranking_cache_write(string $key, string $body): void
{
    $path = ranking_cache_path($key);
    $temporaryPath = @tempnam(dirname($path), 'ranking-');
    if ($temporaryPath === false) {
        return;
    }
    $cache = json_encode(['created_at' => time(), 'body' => $body], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($cache === false || @file_put_contents($temporaryPath, $cache, LOCK_EX) === false) {
        @unlink($temporaryPath);
        return;
    }
    @chmod($temporaryPath, 0600);
    @rename($temporaryPath, $path);
}
