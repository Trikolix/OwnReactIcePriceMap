<?php

/**
 * Resolves redirects for known shorteners or potentially indirect links.
 */
function resolveRouteUrl($url) {
    if (empty($url)) return $url;
    
    $host = parse_url($url, PHP_URL_HOST);
    if (!$host) return $url;

    $shorteners = ['out.ac', 'strava.app.link', 'bit.ly', 'tinyurl.com', 't.co', 'goo.gl'];
    $isShortener = false;
    foreach ($shorteners as $s) {
        if (stripos($host, $s) !== false) {
            $isShortener = true;
            break;
        }
    }

    // Special case for Outdooractive /s/ links or alphanumeric route IDs
    if (stripos($host, 'outdooractive.com') !== false) {
        // If it doesn't end in digits, it might be a short ID that needs resolution
        if (!preg_match('#/\d+/?$#', parse_url($url, PHP_URL_PATH) ?? '')) {
            $isShortener = true;
        }
    }

    if (!$isShortener) return $url;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_exec($ch);
    $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    
    return $finalUrl ?: $url;
}

/**
 * Validates and cleans the route URL.
 */
function validateAndCleanUrl(string $url): ?string {
    $allowedHosts = [
        'komoot' => '#https?:\/\/(www\.)?komoot\.(com|de)\/(?:[a-z-]+\/)?tour\/\d+#',
        'strava' => '#https?:\/\/(www\.)?strava\.com\/routes\/\d+#',
        'outdooractive' => '#https?:\/\/(www\.)?outdooractive\.com\/.*\/(\d+)#'
    ];

    // 1. Try matching the current URL
    foreach ($allowedHosts as $pattern) {
        if (preg_match($pattern, $url, $matches)) {
            return rtrim($matches[0], '/') . '/';
        }
    }

    // 2. If no match, resolve (follow redirects) and try again
    $resolvedUrl = resolveRouteUrl($url);
    if ($resolvedUrl !== $url) {
        foreach ($allowedHosts as $pattern) {
            if (preg_match($pattern, $resolvedUrl, $matches)) {
                return rtrim($matches[0], '/') . '/';
            }
        }
    }
    
    return null;
}

/**
 * Generates embed code for the given (cleaned or raw) URL.
 */
function generateEmbedCode($url) {
    if (!$url) return null;

    // We might need to resolve it here too if it hasn't been cleaned yet
    $cleanUrl = validateAndCleanUrl($url) ?: $url;

    // Komoot
    if (preg_match('#https?:\/\/(www\.)?komoot\.(com|de)\/(?:[a-z-]+\/)?tour\/(\d+)#', $cleanUrl, $matches)) {
        $tourId = $matches[3];
        $parsedUrl = parse_url($cleanUrl);
        $shareToken = '';
        if (isset($parsedUrl['query'])) {
            parse_str($parsedUrl['query'], $queryParams);
            if (isset($queryParams['share_token'])) {
                $shareToken = htmlspecialchars($queryParams['share_token'], ENT_QUOTES, 'UTF-8');
            }
        }
        $src = 'https://www.komoot.com/de-de/tour/' . $tourId . '/embed';
        if ($shareToken) {
            $src .= '?share_token=' . $shareToken;
        }
        return '<iframe src="' . $src . '" width="640" height="440" frameborder="0" scrolling="no"></iframe>';
    }

    // Strava
    if (preg_match('#https?:\/\/(www\.)?strava\.com\/routes\/(\d+)#', $cleanUrl, $matches)) {
        $routeId = $matches[2];
        return '<div class="strava-embed-placeholder" data-embed-type="route" data-embed-id="' . $routeId . '"></div><script src="https://strava-embeds.com/embed.js"></script>';
    }

    // Outdooractive
    if (preg_match('#https?:\/\/(www\.)?outdooractive\.com\/.*\/(\d+)#', $cleanUrl, $matches)) {
        $routeId = $matches[2];
        return '<iframe src="https://www.outdooractive.com/en/embed/' . $routeId . '/" width="100%" height="440" frameborder="0" scrolling="no"></iframe>';
    }

    return null;
}

/**
 * Checks if the route is public.
 */
function checkRouteVisibility($url) {
    if (empty($url)) {
        return ['status' => 'unknown'];
    }

    $cleanUrl = validateAndCleanUrl($url);
    if (!$cleanUrl) {
        return ['status' => 'unknown'];
    }

    $ch = curl_init($cleanUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);

    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 404 || $httpCode === 401 || $httpCode === 410) {
        return ['status' => 'private'];
    }

    if ($html) {
        // Special handling for Strava
        if (stripos($cleanUrl, 'strava.com') !== false) {
             // Strava routes are often login-walled but still "public" for embedding.
             // If we see any sign of a route title, we consider it public enough.
             if (stripos($html, 'Route on Strava') !== false || stripos($html, 'See ') !== false) {
                 return ['status' => 'public'];
             }
             // If it redirects to login or has a clear "private" message
             if (stripos($html, 'This route is private') !== false) {
                 return ['status' => 'private'];
             }
             // Default for Strava: if we reached here with 200 OK and no "private" message, it's probably okay or just login-walled
             return ['status' => 'public'];
        }

        if (stripos($html, 'Du bist nicht berechtigt') !== false ||
            stripos($html, 'This route is private') !== false ||
            stripos($html, 'Du hast keine Berechtigung') !== false ||
            stripos($html, 'You are not authorized') !== false) {
            return ['status' => 'private'];
        }
    }

    return ['status' => 'public'];
}
