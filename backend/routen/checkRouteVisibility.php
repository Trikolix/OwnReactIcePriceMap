<?php
require_once  __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

$authData = requireAuth($pdo);

function checkRouteVisibility($url) {
    if (empty($url)) {
        return ['status' => 'unknown'];
    }

    $allowedHosts = [
        '#https:\/\/www\.komoot\.(com|de)\/(?:de-de\/)?tour\/\d+#',
        '#https:\/\/www\.strava\.com\/routes\/\d+#',
        '#https:\/\/www\.outdooractive\.com\/(?:[a-z-]+\/)+(\d+)#'
    ];

    $cleanUrl = null;
    foreach ($allowedHosts as $pattern) {
        if (preg_match($pattern, $url, $matches)) {
            $cleanUrl = rtrim($matches[0], '/');
            break;
        }
    }

    if (!$cleanUrl) {
        return ['status' => 'unknown'];
    }

    if (filter_var($url, FILTER_VALIDATE_URL) === false) {
        return ['status' => 'unknown'];
    }

    $url = $cleanUrl;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 404 || $httpCode === 401 || $httpCode === 410) {
        return ['status' => 'private'];
    }

    if ($html) {
        if (stripos($html, 'Du bist nicht berechtigt') !== false ||
            stripos($html, 'This route is private') !== false ||
            stripos($html, 'Du hast keine Berechtigung') !== false ||
            stripos($html, 'You are not authorized') !== false ||
            stripos($html, 'is private') !== false) {
            return ['status' => 'private'];
        }
    }

    return ['status' => 'public'];
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $url = $data['url'] ?? '';

    if (empty($url)) {
        echo json_encode(['status' => 'error', 'message' => 'Keine URL angegeben']);
        die();
    }

    $visibility = checkRouteVisibility($url);

    echo json_encode([
        'status' => 'success',
        'visibility' => $visibility['status']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fehler bei der Prüfung',
        'details' => $e->getMessage()
    ]);
}
?>
