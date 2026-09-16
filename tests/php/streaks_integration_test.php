<?php
/** Isolated MySQL integration suite. Creates/drops only a uniquely named test database. */
require_once __DIR__.'/../../backend/lib/streaks.php';
$dsn = getenv('STREAK_TEST_DSN');
if (!$dsn) { fwrite(STDERR,"SKIP: Set STREAK_TEST_DSN, STREAK_TEST_USER and STREAK_TEST_PASSWORD for an isolated MySQL test server.\n"); exit(77); }
function connection(): PDO {
    return new PDO(getenv('STREAK_TEST_DSN'),getenv('STREAK_TEST_USER') ?: '',getenv('STREAK_TEST_PASSWORD') ?: '',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES=>false]);
}
function check($condition,$name) { if (!$condition) throw new RuntimeException($name); }
function at($date): DateTimeImmutable { return new DateTimeImmutable($date,new DateTimeZone('Europe/Berlin')); }
if (($argv[1] ?? '') === '--worker') {
    $database = $argv[2];
    if (!preg_match('/^ice_streak_test_[a-f0-9]+$/',$database)) exit(1);
    $pdo = connection(); $pdo->exec("USE `$database`"); $pdo->beginTransaction();
    streakReconcile($pdo,3,at('2026-09-16 12:00'));
    streakGrant($pdo,3,'day','2026-09-16','concurrent',at('2026-09-16 12:00'));
    $pdo->commit(); exit;
}
$pdo=connection(); $database='ice_streak_test_'.bin2hex(random_bytes(6));
$pdo->exec("CREATE DATABASE `$database`");
try {
    $pdo->exec("USE `$database`");
    $pdo->exec('CREATE TABLE nutzer(id INT PRIMARY KEY) ENGINE=InnoDB');
    $pdo->exec('CREATE TABLE checkins(id INT AUTO_INCREMENT PRIMARY KEY,nutzer_id INT,datum DATETIME) ENGINE=InnoDB');
    $pdo->exec('CREATE TABLE award_levels(award_id INT,description_de TEXT) ENGINE=InnoDB');
    $migration=file_get_contents(__DIR__.'/../../backend/Database/migrations/2026-09-16_add_streak_freezes.sql');
    $pdo->exec($migration);
    $pdo->exec("UPDATE streak_config SET launched_at='2026-09-15 22:00:00'");
    $pdo->exec('INSERT INTO nutzer VALUES (1),(2),(3)');
    $pdo->exec("INSERT INTO checkins(nutzer_id,datum) VALUES(1,'2026-09-15 12:00:00')");
    $pdo->beginTransaction(); streakReconcile($pdo,1,at('2026-09-16 12:00'));
    check((int)$pdo->query('SELECT SUM(balance) FROM streak_wallets WHERE user_id=1')->fetchColumn()===0,'No historical rewards');
    $pdo->exec("INSERT INTO checkins(nutzer_id,datum) VALUES(1,'2026-09-16 12:00:00')"); $id=(int)$pdo->lastInsertId();
    $events=streakAfterCheckin($pdo,1,$id,42,at('2026-09-16 12:00'));
    check(count(array_filter($events,fn($e)=>$e['kind']==='grant'))===2,'Challenge grants both types');
    check(streakAfterCheckin($pdo,1,$id,42,at('2026-09-16 12:00'))===[],'Repeated event is idempotent');
    streakGrant($pdo,1,'day','2026-09-16','extra',at('2026-09-16 12:00'));
    $overflow=streakGrant($pdo,1,'day','2026-09-16','overflow',at('2026-09-16 12:00'));
    check($overflow['amount']===0,'Wallet capped'); $pdo->commit();
    $before=streakLoad($pdo,1,at('2026-09-18 12:00'));
    $projection=streakPayload($before,at('2026-09-18 12:00'),false);
    check(!isset($projection['freezes'])&&!isset($projection['last_freeze']),'Public payload privacy');
    check((int)$pdo->query("SELECT balance FROM streak_wallets WHERE user_id=1 AND type='day'")->fetchColumn()===2,'Preview is read-only');
    $pdo->beginTransaction(); $consumed=streakReconcile($pdo,1,at('2026-09-18 12:00'));
    check(count($consumed)===1,'One missed day consumed');
    check(streakReconcile($pdo,1,at('2026-09-18 12:00'))===[],'Settlement retry is idempotent');
    check(streakGrant($pdo,1,'day','2026-09-18','overflow',at('2026-09-18 12:00'))===null,'Full-wallet rewards cannot be claimed later');
    $pdo->exec("INSERT INTO checkins(nutzer_id,datum) VALUES(1,'2026-09-17 12:00:00')"); $backfill=(int)$pdo->lastInsertId();
    check(streakAfterCheckin($pdo,1,$backfill,null,at('2026-09-18 12:00'))===[],'Backfill has no rewards');
    $s=streakPayload(streakLoad($pdo,1,at('2026-09-18 12:00')),at('2026-09-18 12:00'),true);
    check($s['day']['value']===3 && $s['freezes']['day']===1,'Backfill corrects value without refund');
    $pdo->exec("DELETE FROM checkins WHERE nutzer_id=1 AND DATE(datum)='2026-09-16'");
    streakReconcile($pdo,1,at('2026-09-18 12:00'));
    $s=streakPayload(streakLoad($pdo,1,at('2026-09-18 12:00')),at('2026-09-18 12:00'),true);
    check($s['day']['value']===1 && $s['freezes']['day']===1,'Deletion is not retroactively protected'); $pdo->commit();
    // Seven distinct current-day check-ins award one day freeze, regardless of duplicates.
    for ($day=16;$day<=22;$day++) {
        $date="2026-09-$day 12:00:00"; $pdo->beginTransaction(); streakReconcile($pdo,2,at($date));
        $q=$pdo->prepare('INSERT INTO checkins(nutzer_id,datum) VALUES(2,?)'); $q->execute([$date]);
        streakAfterCheckin($pdo,2,(int)$pdo->lastInsertId(),null,at($date));
        $q->execute([$date]); check(streakAfterCheckin($pdo,2,(int)$pdo->lastInsertId(),null,at($date))===[],'Duplicate day has no event');
        $pdo->commit();
    }
    check((int)$pdo->query("SELECT balance FROM streak_wallets WHERE user_id=2 AND type='day'")->fetchColumn()===1,'Seven-day reward');
    foreach (['2026-09-23','2026-09-30','2026-10-07'] as $day) {
        $date="$day 12:00:00"; $pdo->beginTransaction(); streakReconcile($pdo,2,at($date));
        $q=$pdo->prepare('INSERT INTO checkins(nutzer_id,datum) VALUES(2,?)'); $q->execute([$date]);
        streakAfterCheckin($pdo,2,(int)$pdo->lastInsertId(),null,at($date)); $pdo->commit();
    }
    check((int)$pdo->query("SELECT balance FROM streak_wallets WHERE user_id=2 AND type='week'")->fetchColumn()===1,'Four-week reward');
    // A second process races the same reward while this connection holds the user lock.
    $pdo->beginTransaction(); streakReconcile($pdo,3,at('2026-09-16 12:00'));
    $process=proc_open([PHP_BINARY,__FILE__,'--worker',$database],[1=>['pipe','w'],2=>['pipe','w']],$pipes);
    check(is_resource($process),'Worker starts');
    usleep(200000);
    streakGrant($pdo,3,'day','2026-09-16','concurrent',at('2026-09-16 12:00')); $pdo->commit();
    $stdout=stream_get_contents($pipes[1]); $stderr=stream_get_contents($pipes[2]); fclose($pipes[1]); fclose($pipes[2]);
    check(proc_close($process)===0,'Concurrent worker: '.$stderr);
    check((int)$pdo->query("SELECT balance FROM streak_wallets WHERE user_id=3 AND type='day'")->fetchColumn()===1,'Concurrent grant happens once');
    echo "Streak MySQL integration tests passed\n";
} finally {
    if ($pdo->inTransaction()) $pdo->rollBack();
    $pdo->exec("DROP DATABASE `$database`");
}
