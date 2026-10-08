<?php

require_once __DIR__ . '/../lib/social_media_stories.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$projectRoot = dirname(__DIR__, 2);
$outputDirectory = $argv[1] ?? (sys_get_temp_dir() . '/ice-social-media-reference');
if (!is_dir($outputDirectory) && !mkdir($outputDirectory, 0775, true) && !is_dir($outputDirectory)) {
    throw new RuntimeException('Ausgabeordner konnte nicht erstellt werden: ' . $outputDirectory);
}

$photoPath = $argv[2] ?? null;
if (!$photoPath) {
    $photos = glob($projectRoot . '/uploads/checkins/*.{jpg,jpeg,png,webp}', GLOB_BRACE) ?: [];
    $photoPath = $photos[0] ?? null;
}
$photoUrl = $photoPath
    ? str_replace('\\', '/', ltrim(str_replace($projectRoot, '', (string)realpath($photoPath)), '/\\'))
    : '';

$awardIcons = array_values(array_slice(glob($projectRoot . '/uploads/{award_icons,awards}/*.png', GLOB_BRACE) ?: [], 0, 3));
$awards = [];
foreach (['Preis-Detektiv', 'Geschmackstreue', 'Eis-Entdecker'] as $index => $title) {
    $awards[] = [
        'title' => $title,
        'icon' => isset($awardIcons[$index])
            ? str_replace('\\', '/', ltrim(str_replace($projectRoot, '', $awardIcons[$index]), '/\\'))
            : '',
    ];
}

$base = [
    'image_id' => 1,
    'image_url' => $photoUrl,
    'checkin_id' => 1,
    'checkin_date' => '2026-08-20 18:30:00',
    'checkin_type' => 'Kugel',
    'is_on_site' => 1,
    'username' => 'EisEntdeckerin',
    'avatar_url' => '',
    'shop_name' => 'Eismanufaktur Zum außergewöhnlich langen Sommerglück',
    'shop_address' => 'Mühlsteig 5, 09355 Gersdorf',
    'shop_latitude' => 50.8326,
    'shop_longitude' => 12.9253,
    'flavours' => ['Amarena-Kirsch', 'Pistazie', 'Weiße Schokolade'],
    'flavour_details' => [
        ['name' => 'Amarena-Kirsch', 'rating' => 4.8],
        ['name' => 'Pistazie', 'rating' => null],
        ['name' => 'Weiße Schokolade', 'rating' => 4.6],
    ],
    'ratings' => [
        ['key' => 'geschmackbewertung', 'label' => 'Geschmack', 'value' => 4.8],
        ['key' => 'waffelbewertung', 'label' => 'Waffel', 'value' => 4.6],
        ['key' => 'größenbewertung', 'label' => 'Größe', 'value' => 5.0],
        ['key' => 'preisleistungsbewertung', 'label' => 'Preis-Leistung', 'value' => 4.9],
    ],
    'arrival' => 'Fahrrad',
    'comment' => 'Sehr lecker 😋 – und die Bedienung war großartig! 🚲🍦',
    'awards' => $awards,
];

$fixtures = [
    'story_review_4-ratings_3-awards.png' => [$base, 'story'],
    'feed_review_4-ratings_3-awards.png' => [$base, 'feed'],
    'story_review_0-ratings_0-awards.png' => [array_merge($base, [
        'shop_name' => 'Eiscafé Glück',
        'ratings' => [],
        'awards' => [],
        'is_on_site' => 0,
    ]), 'story'],
    'story_review_2-ratings_1-award.png' => [array_merge($base, [
        'ratings' => array_slice($base['ratings'], 0, 2),
        'awards' => array_slice($awards, 0, 1),
    ]), 'story'],
    'story_review_no-coordinates.png' => [array_merge($base, [
        'shop_latitude' => null,
        'shop_longitude' => null,
        'awards' => [],
    ]), 'story'],
    'story_review_address-only.png' => [array_merge($base, [
        'image_url' => '',
        'shop_latitude' => null,
        'shop_longitude' => null,
        'ratings' => array_slice($base['ratings'], 0, 1),
        'flavours' => ['Zitrone'],
        'flavour_details' => [['name' => 'Zitrone', 'rating' => null]],
        'comment' => 'Ein langer Kommentar mit Emoji 🍦, der sauber auf zwei Zeilen begrenzt werden muss.',
        'awards' => [],
    ]), 'story'],
];

foreach ($fixtures as $filename => [$candidate, $format]) {
    $image = iceSocialMediaRenderReviewSlide($candidate, $format);
    imagepng($image, rtrim($outputDirectory, '/\\') . DIRECTORY_SEPARATOR . $filename, 7);
    imagedestroy($image);
}

if ($photoUrl !== '') {
    foreach (['story', 'feed'] as $format) {
        $image = iceSocialMediaRenderPhotoSlide($base, $format, 'composite');
        $filename = $format . '_photo_long-name.png';
        imagepng($image, rtrim($outputDirectory, '/\\') . DIRECTORY_SEPARATOR . $filename, 7);
        imagedestroy($image);
    }

    $overlay = iceSocialMediaRenderPhotoSlide($base, 'story', 'overlay');
    imagepng($overlay, rtrim($outputDirectory, '/\\') . DIRECTORY_SEPARATOR . 'story_photo_overlay.png', 7);
    imagedestroy($overlay);
}

echo 'Referenzexporte: ' . realpath($outputDirectory) . PHP_EOL;
