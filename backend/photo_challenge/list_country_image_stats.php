<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : 0;
$challengeId = isset($_GET['challenge_id']) ? (int)$_GET['challenge_id'] : 0;

if (!$userId) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID fehlt.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

try {
    ensurePhotoChallengeSchema($pdo);
    $countries = fetchCountryImageStats($pdo);
    $selectedByCountry = [];

    if ($challengeId > 0) {
        $stmt = $pdo->prepare("
            SELECT pci.land_id,
                   pci.image_id,
                   l.name AS land
            FROM photo_challenge_images pci
            LEFT JOIN laender l ON l.id = pci.land_id
            WHERE pci.challenge_id = :challenge_id AND pci.land_id IS NOT NULL
        ");
        $stmt->execute(['challenge_id' => $challengeId]);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $selectedByCountry[(int)$row['land_id']] = [
                'land_id' => (int)$row['land_id'],
                'land' => $row['land'],
                'image_id' => (int)$row['image_id'],
            ];
        }
    }

    $data = array_map(static function (array $country) use ($selectedByCountry): array {
        $selected = $selectedByCountry[$country['land_id']] ?? null;
        $country['selected_image_id'] = $selected ? (int)$selected['image_id'] : null;
        $country['is_selected'] = $selected !== null;
        return $country;
    }, $countries);

    echo json_encode([
        'status' => 'success',
        'data' => $data,
        'summary' => [
            'countries_with_images' => count($countries),
            'selected_countries' => count($selectedByCountry),
            'missing_countries' => max(0, count($countries) - count($selectedByCountry)),
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Länderstatistik konnte nicht geladen werden.',
        'details' => $e->getMessage(),
    ]);
}
