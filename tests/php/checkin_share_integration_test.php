<?php
// Real endpoint, authentication, SQL and PNG renderer. No production configuration.
$root = getenv('CHECKIN_SHARE_TEST_ROOT');
if (!$root || !str_starts_with($root, '/tmp/ice-share-test')) throw new RuntimeException('Isolated test root required');
require $root . '/backend/db_connect.php';
require $root . '/backend/lib/social_media_stories.php';
require $root . '/backend/social_media/helpers.php';
$pdo->exec("CREATE TABLE nutzer (id INT PRIMARY KEY, username VARCHAR(255));
CREATE TABLE user_api_tokens (id INT PRIMARY KEY, user_id INT, token_hash VARCHAR(64), last_used_at DATETIME, expires_at DATETIME, revoked_at DATETIME);
CREATE TABLE eisdielen (id INT PRIMARY KEY, name VARCHAR(255), adresse VARCHAR(255), latitude DECIMAL(10,7), longitude DECIMAL(10,7));
CREATE TABLE checkins (id INT PRIMARY KEY, nutzer_id INT, eisdiele_id INT NULL, datum DATETIME, typ VARCHAR(50), kommentar TEXT, anreise VARCHAR(50), geschmackbewertung FLOAT, waffelbewertung FLOAT, größenbewertung FLOAT, preisleistungsbewertung FLOAT);
CREATE TABLE bilder (id INT PRIMARY KEY, checkin_id INT, url VARCHAR(255));
CREATE TABLE user_profile_images (user_id INT PRIMARY KEY, avatar_path VARCHAR(255));
CREATE TABLE checkin_sorten (id INT PRIMARY KEY, checkin_id INT, sortenname VARCHAR(255));
INSERT INTO nutzer VALUES (99, 'Mia_mit_einem_besonders_langen_Nutzernamen'), (77, 'Jonas'), (1, 'Admin');
INSERT INTO eisdielen VALUES (7, 'Eiscafé Sonnenschein mit einem besonders langen Namen', 'Eisstraße 7, 12345 Sommerstadt', NULL, NULL);
INSERT INTO checkins VALUES (46,99,7,'2026-10-07 12:00:00','Kugel','Ein schöner Tag mit köstlichem Eis und einem langen Kommentar, der in beiden Bildformaten vollständig sichtbar bleiben soll.','Fahrrad',4.5,4,5,4.5), (47,77,7,'2026-10-07 13:00:00','Softeis','Fremder Check-in','Auto',4,NULL,NULL,4), (48,99,NULL,'2026-10-07 14:00:00','Eisbecher','Mein Eis ohne öffentlichen Ort','',5,NULL,NULL,NULL);
INSERT INTO bilder VALUES (101,46,'uploads/checkin-46.png'),(102,46,'uploads/checkin-46-other.png'),(103,47,'uploads/checkin-47.png');
INSERT INTO checkin_sorten VALUES (1,46,'Pistazie'),(2,46,'Stracciatella'),(3,46,'Mango');");
foreach ([99, 77, 1] as $id) {
    $pdo->prepare('INSERT INTO user_api_tokens VALUES (?, ?, ?, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), NULL)')->execute([$id, $id, hash('sha256', 'test-token-' . $id)]);
}
$image = imagecreatetruecolor(640, 960);
imagefill($image, 0, 0, imagecolorallocate($image, 183, 215, 182));
imagefilledpolygon($image, [180,430,460,430,320,800], imagecolorallocate($image, 193, 137, 77));
imagefilledellipse($image, 260,360,230,230,imagecolorallocate($image, 232, 204, 224));
imagefilledellipse($image, 390,355,230,230,imagecolorallocate($image, 251, 246, 218));
imagepng($image, $root . '/uploads/checkin-46.png');
imagefilter($image, IMG_FILTER_NEGATE);
imagepng($image, $root . '/uploads/checkin-46-other.png');
imagedestroy($image);

$server = proc_open([PHP_BINARY, '-S', '127.0.0.1:18097', '-t', $root], [0=>['pipe','r'],1=>['file',$root.'/server.log','a'],2=>['file',$root.'/server.log','a']], $pipes);
if (!is_resource($server)) throw new RuntimeException('Unable to start fixture server');
$checks = 0;
function check(bool $value, string $message): void { global $checks; if (!$value) throw new RuntimeException($message); $checks++; echo "PASS $message\n"; }
function request(string $method, array $payload, ?int $user = 99): array {
    $headers = "Content-Type: application/json\r\n" . ($user ? 'Authorization: Bearer test-token-' . $user . "\r\n" : '');
    $query = $method === 'GET' ? '?' . http_build_query($payload) : '';
    $context = stream_context_create(['http'=>['method'=>$method,'header'=>$headers,'content'=>$method==='POST'?json_encode($payload):'','ignore_errors'=>true,'timeout'=>20]]);
    $body = file_get_contents('http://127.0.0.1:18097/backend/social_media/checkin_share.php' . $query, false, $context);
    preg_match('/\s(\d{3})\s/', $http_response_header[0], $match);
    return ['status'=>(int)$match[1], 'body'=>$body, 'headers'=>implode("\n",$http_response_header), 'json'=>json_decode($body,true)];
}
try {
    for ($attempt=0; $attempt<80; $attempt++) {
        $socket = @fsockopen('127.0.0.1',18097,$errno,$error,.1);
        if ($socket) { fclose($socket); break; } usleep(50000);
    }
    foreach (['GET','POST'] as $method) {
        check(request($method,['checkin_id'=>46],null)['status']===401, "$method requires authentication");
        check(request($method,['checkin_id'=>46],77)['status']===403, "$method rejects another user's check-in");
        check(request($method,['checkin_id'=>46,'user_id'=>99],1)['status']===403, "$method uses authenticated identity, including admin");
        check(request($method,['checkin_id'=>9999])['status']===404, "$method rejects missing check-in");
        check(request($method,['checkin_id'=>0])['status']===422, "$method validates check-in ID");
    }
    $manifest = request('GET',['checkin_id'=>46]);
    check($manifest['status']===200 && count($manifest['json']['data']['images'])===2, 'Owner can choose both photos');
    check($manifest['json']['data']['formats']===['story','feed'], 'Both export formats are available');
    check($manifest['json']['data']['awards']===[], 'Missing optional award table remains compatible');
    $private = request('GET',['checkin_id'=>48]);
    check($private['status']===200 && !$private['json']['data']['slides']['photo'] && $private['json']['data']['shop_name']==='Mein Eis-Moment', 'Check-in without public place or photo can be shared');
    check(!array_key_exists('latitude',$private['json']['data']), 'No private coordinates in manifest');
    check(request('POST',['checkin_id'=>46,'slide'=>'photo','image_id'=>103])['status']===422, 'Rejects photo from another check-in');
    check(request('POST',['checkin_id'=>48,'slide'=>'photo'])['status']===422, 'Rejects photo export when no photo exists');
    check(request('POST',['checkin_id'=>46,'slide'=>'invalid'])['status']===422, 'Validates slide selection');
    check(request('POST',['checkin_id'=>46,'format'=>'invalid'])['status']===422, 'Validates export format');
    check(request('DELETE',['checkin_id'=>46])['status']===405, 'Rejects unsupported request method');
    $output = getenv('CHECKIN_SHARE_TEST_OUTPUT');
    $starCanvas = imagecreatetruecolor(64, 64);
    $starBackground = imagecolorallocate($starCanvas, 20, 70, 130);
    imagefill($starCanvas, 0, 0, $starBackground);
    iceSocialMediaDrawStar($starCanvas, 32, 32, 15, .5);
    check(imagecolorat($starCanvas, 49, 16) === $starBackground && imagecolorat($starCanvas, 36, 32) === $starBackground && imagecolorat($starCanvas, 28, 32) !== $starBackground, 'Half stars fill only their shape and preserve the photo background');
    imagedestroy($starCanvas);
    $bodies = [];
    foreach (['story'=>1920,'feed'=>1350] as $format=>$height) foreach (['photo','review'] as $slide) {
        $response = request('POST',['checkin_id'=>46,'format'=>$format,'slide'=>$slide,'image_id'=>101]);
        $size = @getimagesizefromstring($response['body']);
        check($response['status']===200 && $size && $size[0]===1080 && $size[1]===$height, "$format $slide returns real PNG at correct dimensions");
        check(str_contains($response['headers'],'Content-Type: image/png') && str_contains($response['headers'],'Cache-Control: no-store'), "$format $slide returns binary and private cache headers");
        check(str_contains($response['headers'],"ice-$format-$slide-46-"), "$format $slide provides download filename");
        $bodies["$format-$slide"] = $response['body'];
        file_put_contents("$output/$format-$slide.png",$response['body']);
    }
    $secondPhoto = request('POST',['checkin_id'=>46,'slide'=>'photo','image_id'=>102]);
    check($secondPhoto['status']===200 && $secondPhoto['body']!==$bodies['story-photo'], 'Selecting another photo changes export');
    $privatePng = request('POST',['checkin_id'=>48,'slide'=>'review','format'=>'feed']);
    check($privatePng['status']===200 && getimagesizefromstring($privatePng['body'])[1]===1350, 'Private check-in renders without public map coordinates');
    file_put_contents("$output/feed-private.png", $privatePng['body']);
    $pdo->exec("CREATE TABLE award_checkins (checkin_id INT, user_award_id INT);
        CREATE TABLE user_awards (id INT, award_id INT, level INT, user_id INT);
        CREATE TABLE award_levels (award_id INT, level INT, title_de VARCHAR(255), description_de TEXT, icon_path VARCHAR(255));
        INSERT INTO award_checkins VALUES (46,1); INSERT INTO user_awards VALUES (1,3,1,99);
        INSERT INTO award_levels VALUES (3,1,'Herbstentdecker','Neue Auszeichnung','');");
    check(count(request('GET',['checkin_id'=>46])['json']['data']['awards'])===1, 'Manifest includes awards linked to check-in');
    $withAward = request('POST',['checkin_id'=>46,'slide'=>'review','format'=>'feed','include_awards'=>true]);
    $withoutAward = request('POST',['checkin_id'=>46,'slide'=>'review','format'=>'feed','include_awards'=>false]);
    check($withAward['status']===200 && $withoutAward['status']===200 && $withAward['body']!==$withoutAward['body'], 'Award toggle changes exported image');
    file_put_contents("$output/feed-review-award.png",$withAward['body']);
    $pdo->exec('ALTER TABLE user_awards ADD COLUMN trigger_checkin_id INT NULL; UPDATE user_awards SET trigger_checkin_id=46; DROP TABLE award_checkins');
    check(count(request('GET',['checkin_id'=>46])['json']['data']['awards'])===1, 'Current award trigger column works without historical linkage table');
    $pdo->exec('UPDATE user_awards SET user_id=77');
    check(request('GET',['checkin_id'=>46])['json']['data']['awards']===[], 'Only awards belonging to check-in owner are included');
    $candidate = socialMediaFetchCheckinCandidate($pdo, 46);
    // Tile downloads are disabled; local HTTP endpoint tests still use the http wrapper.
    stream_wrapper_unregister('https');
    foreach (['story', 'feed'] as $format) {
        $layout = iceCheckinExportReviewLayout($candidate, $format);
        check($layout['mapHeight']===0, "$format omits map placeholder without coordinates");
        $candidate['shop_latitude'] = 52.5; $candidate['shop_longitude'] = 13.4;
        $layout = iceCheckinExportReviewLayout($candidate, $format);
        check($layout['cardTop'] + $layout['cardHeight'] < $layout['footerY'] - 35, "$format card stays above footer");
        check(!$layout['mapHeight'] || $layout['mapTop'] + $layout['mapHeight'] < $layout['footerY'] - 35, "$format map stays above footer");
        $withMap = iceSocialMediaRenderReviewSlide($candidate, $format);
        imagepng($withMap, "$output/$format-with-map.png"); imagedestroy($withMap);
        $photo = iceCheckinExportPhotoLayout($candidate, $format);
        check($photo['top'] > $photo['height'] * .4 && $photo['bottom'] < $photo['height'] - 70, "$format photo leaves room for image and edge insets");
        $candidate['shop_latitude'] = null; $candidate['shop_longitude'] = null;
    }
    $mapCanvas = iceSocialMediaCreateCanvas(800, 120);
    iceSocialMediaDrawMap($mapCanvas, ['shop_latitude'=>52.5, 'shop_longitude'=>13.4], 0, 0, 800, 120);
    $markerPixels = [];
    for ($y = 0; $y < 120; $y++) for ($x = 350; $x < 450; $x++) {
        if ((imagecolorat($mapCanvas, $x, $y) & 0xffffff) === 0xf05a47) $markerPixels[] = $y;
    }
    check(count($markerPixels) > 100 && min($markerPixels) > 5 && max($markerPixels) < 100, 'Location marker remains fully visible in a short map');
    imagedestroy($mapCanvas);
    $dense = $candidate;
    $dense['shop_name'] = str_repeat('Besonders langes Eiscafé mit vielen Namen ', 4);
    $dense['shop_address'] = str_repeat('Eine außergewöhnlich lange Straße in einer großen Stadt, ', 5);
    $dense['username'] = str_repeat('Sehr_langer_Name_', 8);
    $dense['comment'] = str_repeat('Unser Eis war fantastisch und wir kommen bald wieder. ', 12);
    $dense['flavours'] = ['Schokoladenkeks mit Erdnussbutter und Karamell', 'Sizilianische Pistazie mit Amarenakirschen', 'Fruchtiges Mangosorbet mit Passionsfrucht'];
    $dense['awards'] = [['title'=>'Eine sehr lange neue Auszeichnung für viele Eisbesuche'], ['title'=>'Ein weiterer schöner Award für meinen Besuch']];
    foreach (['story','feed'] as $format) {
        $layout = iceCheckinExportReviewLayout($dense,$format);
        check($layout['cardTop'] + $layout['cardHeight'] < $layout['footerY'] - 35, "$format dense text fits above footer");
        foreach ($layout['title']['lines'] as $line) check(iceSocialMediaTextWidth($line, $layout['title']['size'], 'bold') <= $layout['contentWidth'], "$format long title fits image width");
        $png = iceSocialMediaRenderReviewSlide($dense, $format);
        imagepng($png, "$output/$format-dense.png"); imagedestroy($png);
    }
    $real = $candidate;
    $real['shop_name'] = 'Eismanufaktur Klatt'; $real['username'] = 'Mia';
    $real['shop_address'] = 'Am Eiscafé, 01705 Freital';
    $real['image_url'] = 'uploads/real-photo.jpg';
    copy('/workspace/src/pages/Event/images/eismanufaktur_klatt.jpg', $root . '/uploads/real-photo.jpg');
    foreach (['story','feed'] as $format) {
        $photo = iceSocialMediaRenderPhotoSlide($real, $format, 'composite');
        imagepng($photo,"$output/$format-real-photo.png"); imagedestroy($photo);
        $review = iceSocialMediaRenderReviewSlide($real, $format);
        imagepng($review,"$output/$format-real-review.png"); imagedestroy($review);
    }
    check(request('POST',['checkin_id'=>46,'slide'=>'photo','image_id'=>0])['body']===$bodies['story-photo'], 'Default photo is first photo');
    $pdo->exec("UPDATE user_api_tokens SET revoked_at=NOW() WHERE user_id=99");
    check(request('POST',['checkin_id'=>46])['status']===401, 'Revoked token cannot export images');
    echo "$checks check-in share integration checks passed.\n";
} finally { proc_terminate($server); proc_close($server); }
