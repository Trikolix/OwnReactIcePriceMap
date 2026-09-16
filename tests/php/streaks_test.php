<?php
require_once __DIR__.'/../../backend/lib/streaks.php';
function same($actual,$expected,$name) { if ($actual !== $expected) throw new RuntimeException("$name: ".json_encode($actual).' != '.json_encode($expected)); }
function clockAt($date) { return new DateTimeImmutable($date,new DateTimeZone('Europe/Berlin')); }
function dates(...$values) { return array_fill_keys($values,true); }
$real = dates('2026-09-14','2026-09-15');
$s = streakSummary($real,[],'day',clockAt('2026-09-16 12:00'));
same($s['value'],2,'Yesterday preserves streak'); same($s['state'],'at_risk','At risk');
same($s['seconds_left'],43200,'Midnight deadline');
[$wallet,$protected,$events] = streakSettle(['balance'=>2,'cursor'=>'2026-09-16'],$real,[],'day',clockAt('2026-09-18'));
same($wallet['balance'],0,'Two freezes consumed'); same($events,['2026-09-16','2026-09-17'],'Ordered consumption');
same(streakSummary($real,$protected,'day',clockAt('2026-09-18'))['value'],2,'Freezes do not increment');
same(streakSummary($real,$protected,'day',clockAt('2026-09-18'))['state'],'frozen','Frozen presentation');
same(streakSummary($real,$protected,'day',clockAt('2026-09-19'))['value'],0,'Insufficient stock breaks streak');
[$again,,$againEvents]=streakSettle($wallet,$real,$protected,'day',clockAt('2026-09-18'));
same($again,$wallet,'Idempotent state'); same($againEvents,[],'No repeated consumption');
$real['2026-09-18']=true;
same(streakSummary($real,$protected,'day',clockAt('2026-09-18 12:00'))['value'],3,'Continuation after two pauses');
same(streakSummary($real,$protected,'day',clockAt('2026-09-18 12:00'))['record'],3,'Award record excludes pauses');
$real['2026-09-16']=true;
same(streakSummary($real,$protected,'day',clockAt('2026-09-18 12:00'))['value'],4,'Backfill corrects counts');
same($wallet['balance'],0,'Backfill does not refund');
unset($real['2026-09-15']);
same(streakSummary($real,$protected,'day',clockAt('2026-09-18 12:00'))['value'],2,'Deletion creates actual break');
same(streakPeriod('2027-01-01','week'),'2026-12-28','ISO year boundary');
[$w,$p] = streakSettle(['balance'=>1,'cursor'=>'2027-01-04'],dates('2026-12-28'),[],'week',clockAt('2027-01-11'));
same($w['balance'],0,'Weekly freeze'); same(streakSummary(dates('2026-12-28'),$p,'week',clockAt('2027-01-11'))['value'],1,'Weekly value excludes pause');
same(streakSummary(dates('2026-03-28'),[],'day',clockAt('2026-03-29'))['seconds_left'],23*3600,'Spring DST');
same(streakSummary(dates('2026-10-24'),[],'day',clockAt('2026-10-25'))['seconds_left'],25*3600,'Autumn DST');
[$w,,$events]=streakSettle(['balance'=>2,'cursor'=>'2026-09-16'],dates('2026-01-01'),[],'day',clockAt('2026-09-18'));
same($events,[],'No protection for already broken historical streak'); same($w['balance'],2,'Unused stock remains');
[$w,,$events]=streakSettle(['balance'=>0,'cursor'=>'2026-09-16'],dates('2026-09-15'),[],'day',clockAt('2026-09-18'));
same($w['cursor'],'2026-09-18','Empty stock advances cursor');
[$w,,$events]=streakSettle(['balance'=>1,'cursor'=>$w['cursor']],dates('2026-09-15'),[],'day',clockAt('2026-09-18'));
same($events,[],'New rewards never protect old gaps');
same(streakSummary(dates('2026-09-19'),[],'day',clockAt('2026-09-18'))['value'],0,'Future dates excluded');
[$w] = streakSettle(['balance'=>1,'cursor'=>'2026-09-19'],dates('2026-09-18'),[],'day',clockAt('2026-09-18 23:59'));
same($w['cursor'],'2026-09-19','A delayed request cannot rewind settlement');
$dailyProtection = dates('2026-09-14','2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19','2026-09-20');
same(streakSummary(dates('2026-09-07'), [], 'week', clockAt('2026-09-21'))['value'],0,'Daily freezes do not count as a real week');
$payload=streakPayload(['states'=>['day'=>['balance'=>2,'cursor'=>'2026-09-18'],'week'=>['balance'=>1,'cursor'=>'2026-09-14']], 'real'=>['day'=>dates('2026-09-17'),'week'=>dates('2026-09-14')], 'protected'=>['day'=>[],'week'=>[]]],clockAt('2026-09-18'),false);
same(isset($payload['freezes']),false,'Public payload has no wallet');
same(isset($payload['last_freeze']),false,'Public payload has no private consumption metadata');
echo "Streak calendar tests passed\n";
