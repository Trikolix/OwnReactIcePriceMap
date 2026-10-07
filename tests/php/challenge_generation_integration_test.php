<?php
declare(strict_types=1);
require getenv('CHALLENGE_TEST_BACKEND') . '/db_connect.php';
$checks = 0;
function challengeCheck(bool $condition, string $message): void {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}
function generateChallenge(array $overrides = [], string $now = '2026-10-07 12:39:00'): array {
    $payload = array_replace(['nutzer_id'=>1,'lat'=>50.83,'lon'=>12.92,'type'=>'daily','difficulty'=>'leicht'], $overrides);
    $process = proc_open([PHP_BINARY, __DIR__ . '/fixtures/challenge-generation-worker.php', json_encode($payload), $now],
        [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']], $pipes);
    fclose($pipes[0]);
    $output = stream_get_contents($pipes[1]); $errors = stream_get_contents($pipes[2]);
    fclose($pipes[1]); fclose($pipes[2]);
    $exit = proc_close($process);
    if ($exit !== 0 || $errors !== '') throw new RuntimeException('API process failed: ' . $errors . ' ' . $output);
    return json_decode($output, true, 512, JSON_THROW_ON_ERROR);
}
function challengeRow(PDO $pdo, int $id): array {
    $stmt = $pdo->prepare('SELECT * FROM challenges WHERE id=?'); $stmt->execute([$id]); return $stmt->fetch();
}
function insertChallenge(PDO $pdo, int $user, string $from, string $until, int $shop = 115, int $completed = 0): int {
    $pdo->prepare("INSERT INTO challenges (nutzer_id,eisdiele_id,type,difficulty,valid_from,valid_until,completed) VALUES (?,?,'daily','leicht',?,?,?)")
        ->execute([$user,$shop,$from,$until,$completed]);
    return (int)$pdo->lastInsertId();
}
$pdo->exec("SET timestamp = UNIX_TIMESTAMP('2026-10-07 12:39:00');
CREATE TABLE eisdielen (id INT PRIMARY KEY,name VARCHAR(100),latitude DOUBLE,longitude DOUBLE,adresse VARCHAR(100),openingHours TEXT,opening_hours_note TEXT,status VARCHAR(30),place_type VARCHAR(30));
CREATE TABLE eisdiele_opening_hours (id INT AUTO_INCREMENT PRIMARY KEY,eisdiele_id INT,weekday INT,opens_at TIME,closes_at TIME,overnight INT,sort_order INT);
CREATE TABLE challenges (id INT AUTO_INCREMENT PRIMARY KEY,nutzer_id INT,eisdiele_id INT,type ENUM('daily','weekly'),difficulty ENUM('leicht','mittel','schwer','individuell'),created_at DATETIME DEFAULT CURRENT_TIMESTAMP,valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,custom_min_distance_m INT,custom_max_distance_m INT,valid_until DATETIME,completed TINYINT DEFAULT 0,completed_at TIMESTAMP NULL,recreated TINYINT DEFAULT 0);");
foreach ([[115,101,102,103,104],[11,201,202,203,204],[500,301,302,303,304]] as $band => $ids) {
    foreach ($ids as $offset => $id) {
        $distance = [1000,7000,21000][$band] + $offset * 500;
        $pdo->prepare("INSERT INTO eisdielen VALUES (?, ?, ?, 12.92, 'Markt 12', NULL, NULL, 'open', 'ice_shop')")
            ->execute([$id,'Shop '.$id,50.83 + rad2deg($distance / 6371000)]);
    }
}
// Exact reported daily records from the supplied October 7 export.
$pdo->exec("INSERT INTO challenges (id,nutzer_id,eisdiele_id,type,difficulty,created_at,valid_from,valid_until) VALUES
(1113,1,115,'daily','leicht','2026-10-07 07:28:26','2026-10-07 07:28:26','2026-10-07 23:59:59'),
(1114,1,11,'daily','mittel','2026-10-07 07:28:29','2026-10-07 07:28:29','2026-10-07 23:59:59'),
(1115,1,500,'daily','schwer','2026-10-07 07:28:30','2026-10-07 07:28:30','2026-10-07 23:59:59'),
(1108,1,101,'weekly','leicht','2026-10-05 20:30:09','2026-10-05 20:30:09','2026-10-11 23:59:59');");
$tomorrow = [];
foreach (['leicht','mittel','schwer'] as $difficulty) {
    challengeCheck(generateChallenge(['difficulty'=>$difficulty])['status']==='error', 'Existing daily blocks another challenge for today: '.$difficulty);
    $result = generateChallenge(['difficulty'=>$difficulty,'for_tomorrow'=>'true']);
    challengeCheck($result['status']==='success', 'Export reproduction: tomorrow is available despite today: '.$difficulty);
    challengeCheck($result['valid_from']==='2026-10-08 00:00:00' && $result['valid_until']==='2026-10-08 23:59:59', 'Tomorrow starts at midnight and ends on the correct day');
    $row = challengeRow($pdo, (int)$result['challenge_id']);
    challengeCheck($row['valid_from']===$result['challenge']['valid_from'] && $row['valid_until']===$result['challenge']['valid_until'], 'Stored period matches both response formats');
    challengeCheck($row['custom_min_distance_m']!==null && $row['custom_max_distance_m']===$result['challenge']['custom_max_distance_m'], 'Preset distance metadata is stored and returned');
    challengeCheck(generateChallenge(['difficulty'=>$difficulty,'for_tomorrow'=>'true'])['status']==='error', 'An existing tomorrow challenge prevents a duplicate');
    $tomorrow[$difficulty] = (int)$result['challenge_id'];
}
challengeCheck(challengeRow($pdo,1113)['valid_from']==='2026-10-07 07:28:26', 'Planning tomorrow preserves the existing daily record');
$pdo->exec('UPDATE challenges SET completed=1 WHERE id='.$tomorrow['schwer']);
challengeCheck(generateChallenge(['difficulty'=>'schwer','for_tomorrow'=>'true'])['status']==='error', 'Completed challenges still occupy their daily slot');
challengeCheck(generateChallenge(['type'=>'weekly','for_tomorrow'=>'true'])['status']==='error', 'Tomorrow selection does not bypass an active weekly challenge');
$result = generateChallenge(['nutzer_id'=>2,'for_tomorrow'=>'true']);
$futureId = (int)$result['challenge_id'];
$result = generateChallenge(['nutzer_id'=>2,'for_tomorrow'=>'false'], '2026-10-07 18:30:00');
challengeCheck($result['status']==='success' && $result['valid_from']==='2026-10-07 18:30:00' && $result['valid_until']==='2026-10-07 23:59:59', 'Today stays available alongside tomorrow and still ends today after 18:00');
$result = generateChallenge(['nutzer_id'=>3], '2026-10-07 23:59:00');
challengeCheck($result['status']==='success' && $result['valid_until']==='2026-10-07 23:59:59', 'Missing tomorrow flag selects today even late in the evening');
$result = generateChallenge(['nutzer_id'=>4,'for_tomorrow'=>'1'], '2026-12-31 20:00:00');
challengeCheck($result['status']==='success' && $result['valid_from']==='2027-01-01 00:00:00' && $result['valid_until']==='2027-01-01 23:59:59', 'Tomorrow handles the year boundary');
$result = generateChallenge(['nutzer_id'=>5,'for_tomorrow'=>true], '2026-10-24 20:00:00');
challengeCheck($result['status']==='success' && $result['valid_from']==='2026-10-25 00:00:00' && $result['valid_until']==='2026-10-25 23:59:59', 'Tomorrow remains a calendar day across the daylight-saving date');
$result = generateChallenge(['nutzer_id'=>6,'type'=>'weekly'], '2026-10-11 10:00:00');
challengeCheck($result['status']==='success' && $result['valid_until']==='2026-10-18 23:59:59', 'Sunday weekly deadline keeps the next-Sunday rule');
$result = generateChallenge(['challenge_id'=>1113,'for_tomorrow'=>'true'], '2026-10-07 19:00:00');
challengeCheck($result['status']==='success' && (int)$result['challenge_id']===1113 && $result['valid_from']==='2026-10-07 07:28:26' && $result['valid_until']==='2026-10-07 23:59:59', 'Refreshing today does not move it to tomorrow or extend its deadline');
challengeCheck(challengeRow($pdo,1113)['eisdiele_id']!==115 && $result['recreated']===true, 'Refresh changes the shop and retains the same record');
challengeCheck(generateChallenge(['challenge_id'=>1113])['status']==='error', 'A second refresh stays blocked');
$result = generateChallenge(['nutzer_id'=>2,'challenge_id'=>$futureId,'for_tomorrow'=>'false']);
challengeCheck($result['status']==='success' && $result['valid_from']==='2026-10-08 00:00:00' && $result['valid_until']==='2026-10-08 23:59:59', 'Refreshing tomorrow preserves its planned midnight start');
challengeCheck(generateChallenge(['challenge_id'=>$tomorrow['schwer'],'difficulty'=>'schwer'])['status']==='error', 'Completed challenges cannot be refreshed');
challengeCheck(generateChallenge(['challenge_id'=>1114,'difficulty'=>'schwer'])['status']==='error', 'Refresh cannot change the challenge difficulty');
challengeCheck(generateChallenge(['challenge_id'=>1114,'type'=>'weekly','difficulty'=>'mittel'])['status']==='error', 'Refresh cannot change the challenge type');
challengeCheck(generateChallenge(['nutzer_id'=>2,'challenge_id'=>1114,'difficulty'=>'mittel'])['status']==='error', 'Refresh still verifies record ownership');
$expired = insertChallenge($pdo,7,'2026-10-06 08:00:00','2026-10-06 23:59:59');
challengeCheck(generateChallenge(['nutzer_id'=>7,'challenge_id'=>$expired])['status']==='error', 'Expired challenges cannot be refreshed');
challengeCheck(generateChallenge(['nutzer_id'=>7])['status']==='success', 'Expired records do not block a new daily');
insertChallenge($pdo,8,'2026-10-06 19:00:00','2026-10-07 23:59:59');
challengeCheck(generateChallenge(['nutzer_id'=>8])['status']==='error', 'Legacy evening challenges still running today occupy today');
challengeCheck(generateChallenge(['nutzer_id'=>8,'for_tomorrow'=>'true'])['status']==='success', 'A legacy carry-over does not block planning tomorrow');
$result = generateChallenge(['nutzer_id'=>9,'difficulty'=>'individuell','custom_min_km'=>20,'custom_max_km'=>50,'for_tomorrow'=>'true']);
challengeCheck($result['status']==='success' && $result['custom_min_distance_m']===20000 && $result['custom_max_distance_m']===50000 && $result['valid_from']==='2026-10-08 00:00:00', 'The existing custom-range UI can also plan tomorrow');
challengeCheck(generateChallenge(['nutzer_id'=>10,'difficulty'=>'individuell','custom_min_km'=>50,'custom_max_km'=>45])['status']==='error', 'Invalid custom distance ranges are rejected');
challengeCheck(generateChallenge(['nutzer_id'=>10,'for_tomorrow'=>'nonsense'])['status']==='error', 'Invalid tomorrow flags are rejected');
challengeCheck(generateChallenge(['nutzer_id'=>10,'lat'=>49,'lon'=>10])['status']==='error', 'The minimum shop requirement remains enforced');

// Execute the real check-in lookup instead of reproducing its SQL in the test.
$source = file_get_contents(__DIR__.'/../../backend/checkin/checkin_upload.php');
preg_match('/SELECT c\.id, c\.nutzer_id, c\.eisdiele_id[\s\S]*?LIMIT 1/', $source, $match);
$lookup = $pdo->prepare($match[0]);
$future = insertChallenge($pdo,12,'2026-10-08 00:00:00','2026-10-08 23:59:59');
$lookup->execute([':userId'=>12,':shopId'=>115]);
challengeCheck($lookup->fetch()===false, 'A check-in today cannot complete a challenge planned for tomorrow');
$current = insertChallenge($pdo,12,'2026-10-07 09:00:00','2026-10-07 23:59:59');
$pdo->exec("UPDATE challenges SET created_at='2026-10-07 08:00:00' WHERE id=$future");
$lookup->execute([':userId'=>12,':shopId'=>115]);
challengeCheck($lookup->fetch()['id']===$current, 'Check-in picks the started challenge even if tomorrow was created earlier');
$pdo->exec("SET timestamp = UNIX_TIMESTAMP('2026-10-08 00:00:00')");
$lookup->execute([':userId'=>12,':shopId'=>115]);
challengeCheck($lookup->fetch()['id']===$future, 'The planned challenge becomes eligible exactly at midnight');
echo json_encode(['passed'=>$checks,'database'=>'isolated MySQL','cases'=>'today/tomorrow, export regression, refresh, weekly, custom range and check-in activation']).PHP_EOL;
