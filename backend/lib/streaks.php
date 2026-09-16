<?php
/** Calendar-based streaks. DATETIME check-ins are interpreted as Berlin wall time. */
function streakNow(): DateTimeImmutable { return new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')); }
function streakPeriod(string $date, string $type): string {
    $d = new DateTimeImmutable(substr($date, 0, 10), new DateTimeZone('Europe/Berlin'));
    return ($type === 'week' ? $d->modify('monday this week') : $d)->format('Y-m-d');
}
function streakNext(string $date, string $type, int $direction = 1): string {
    return (new DateTimeImmutable($date))->modify(($direction * ($type === 'week' ? 7 : 1)) . ' days')->format('Y-m-d');
}
function streakSeries(array $real, array $protected): array {
    $periods = array_unique(array_merge(array_keys($real), array_keys($protected)));
    sort($periods);
    return $periods;
}
function streakRuns(array $real, array $protected, string $type): array {
    $runs = []; $run = null; $previous = null;
    foreach (streakSeries($real, $protected) as $period) {
        if ($previous === null || streakNext($previous, $type) !== $period) {
            if ($run && $run['value']) $runs[] = $run;
            $run = ['start' => $period, 'end' => $period, 'value' => 0];
        }
        $run['end'] = $period;
        $run['value'] += isset($real[$period]) ? 1 : 0;
        $previous = $period;
    }
    if ($run && $run['value']) $runs[] = $run;
    return $runs;
}
function streakSummary(array $real, array $protected, string $type, DateTimeImmutable $now): array {
    $current = streakPeriod($now->format('Y-m-d'), $type);
    $real = array_filter($real, fn($p) => $p <= $current, ARRAY_FILTER_USE_KEY);
    $protected = array_filter($protected, fn($p) => $p <= $current, ARRAY_FILTER_USE_KEY);
    $runs = streakRuns($real, $protected, $type);
    $last = $runs ? $runs[count($runs)-1] : null;
    $value = 0; $state = 'none'; $start = null;
    if ($last && $last['end'] >= streakNext($current, $type, -1)) {
        $value = $last['value']; $start = $last['start'];
        $state = isset($real[$current]) ? 'active' : (isset($protected[streakNext($current, $type, -1)]) && !isset($real[streakNext($current, $type, -1)]) ? 'frozen' : 'at_risk');
    }
    $deadline = new DateTimeImmutable(streakNext($current, $type), new DateTimeZone('Europe/Berlin'));
    return ['value' => $value, 'record' => $runs ? max(array_column($runs, 'value')) : 0, 'state' => $state,
        'start' => $start, 'deadline_iso' => $state !== 'none' ? $deadline->format(DATE_ATOM) : null,
        'seconds_left' => $state !== 'none' ? max(0, $deadline->getTimestamp() - $now->getTimestamp()) : 0,
        'protected_periods' => array_values(array_filter(array_keys($protected), fn($p) => $start && $p >= $start && !isset($real[$p])))];
}
/** Pure settlement, also used for public read-only projections. */
function streakSettle(array $state, array $real, array $protected, string $type, DateTimeImmutable $now): array {
    $current = streakPeriod($now->format('Y-m-d'), $type); $consumed = [];
    for ($p = $state['cursor']; $p < $current && $state['balance'] > 0; $p = streakNext($p, $type)) {
        if (isset($real[$p]) || isset($protected[$p])) continue;
        $before = streakSummary($real, $protected, $type, new DateTimeImmutable($p, new DateTimeZone('Europe/Berlin')));
        if ($before['value'] > 0 && $state['balance'] > 0) {
            $protected[$p] = true; $state['balance']--; $consumed[] = $p;
        }
    }
    $state['cursor'] = max($state['cursor'], $current);
    return [$state, $protected, $consumed];
}
function streakLoad(PDO $pdo, int $userId, DateTimeImmutable $now, bool $lock = false): array {
    if ($lock && !$pdo->inTransaction()) throw new LogicException('Streak writes require a transaction');
    // Keep wallet and ledger reads on one snapshot while concurrent check-ins commit.
    $ownTransaction = !$pdo->inTransaction();
    if ($ownTransaction) $pdo->beginTransaction();
    try {
        if ($lock) {
            $q = $pdo->prepare('SELECT id FROM nutzer WHERE id = ? FOR UPDATE'); $q->execute([$userId]);
        }
        $launch = $pdo->query('SELECT launched_at FROM streak_config WHERE id = 1')->fetchColumn();
        if (!$launch) throw new RuntimeException('Streak migration missing');
        $launch = (new DateTimeImmutable($launch, new DateTimeZone('UTC')))->setTimezone(new DateTimeZone('Europe/Berlin'))->format('Y-m-d H:i:s');
        $q = $pdo->prepare('SELECT DATE(datum) d FROM checkins WHERE nutzer_id = ? AND datum <= ? GROUP BY DATE(datum)');
        $q->execute([$userId, $now->format('Y-m-d H:i:s')]);
        $real = ['day' => [], 'week' => []];
        foreach ($q->fetchAll(PDO::FETCH_COLUMN) as $d) foreach (['day','week'] as $t) $real[$t][streakPeriod($d,$t)] = true;
        $q = $pdo->prepare('SELECT * FROM streak_wallets WHERE user_id = ?'); $q->execute([$userId]);
        $states = [];
        foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $r) $states[$r['type']] = ['balance' => (int)$r['balance'], 'cursor' => $r['cursor_period']];
        $q = $pdo->prepare('SELECT * FROM streak_ledger WHERE user_id = ? ORDER BY id'); $q->execute([$userId]);
        $ledger = $q->fetchAll(PDO::FETCH_ASSOC); $protected = ['day'=>[], 'week'=>[]];
        foreach ($ledger as $r) if ($r['kind'] === 'consume') $protected[$r['type']][$r['period']] = true;
        foreach (['day','week'] as $t) $states[$t] = $states[$t] ?? ['balance'=>0, 'cursor'=>streakPeriod($launch,$t)];
        $result = compact('real','states','protected','ledger','launch');
        if ($ownTransaction) $pdo->commit();
        return $result;
    } catch (Throwable $error) {
        if ($ownTransaction && $pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}
function streakBook(PDO $pdo, int $userId, string $type, string $kind, string $period, string $key, int $amount, DateTimeImmutable $now): ?array {
    $q = $pdo->prepare('INSERT IGNORE INTO streak_ledger (user_id,type,kind,period,event_key,amount,created_at) VALUES (?,?,?,?,?,?,?)');
    $q->execute([$userId,$type,$kind,$period,$key,$amount,$now->format('Y-m-d H:i:s')]);
    return $q->rowCount() ? ['id'=>(string)$pdo->lastInsertId(), 'type'=>$type, 'kind'=>$kind, 'period'=>$period, 'amount'=>$amount] : null;
}
function streakPayload(array $data, DateTimeImmutable $now, bool $private): array {
    $out = []; $last = null;
    foreach (['day','week'] as $t) {
        [$state,$protected,$consumed] = streakSettle($data['states'][$t],$data['real'][$t],$data['protected'][$t],$t,$now);
        $out[$t] = streakSummary($data['real'][$t],$protected,$t,$now);
        $out[$t.'_current'] = $out[$t]['state'] === 'active' ? $out[$t]['value'] : 0;
        $out[$t.'_record'] = $out[$t]['record'];
        if ($private) $out['freezes'][$t] = $state['balance'];
        foreach (array_keys($protected) as $p) if (!$last || streakNext($p, $t) > streakNext($last['period'], $last['type'])) $last = ['type'=>$t,'period'=>$p];
    }
    if ($private) $out['last_freeze'] = $last;
    return $out;
}
/** Must run inside the caller's transaction. Settle before inserting or deleting a check-in. */
function streakReconcile(PDO $pdo, int $userId, ?DateTimeImmutable $now = null): array {
    if (!$pdo->inTransaction()) throw new LogicException('Streak reconciliation requires transaction');
    $now = $now ?? streakNow(); $d = streakLoad($pdo,$userId,$now,true); $events = [];
    foreach (['day','week'] as $t) {
        [$s,$p,$consumed] = streakSettle($d['states'][$t],$d['real'][$t],$d['protected'][$t],$t,$now);
        foreach ($consumed as $period) {
            $e = streakBook($pdo,$userId,$t,'consume',$period,"consume:$period",-1,$now);
            if ($e) $events[] = $e;
        }
        $q = $pdo->prepare('INSERT INTO streak_wallets (user_id,type,balance,cursor_period) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE balance=VALUES(balance), cursor_period=VALUES(cursor_period)');
        $q->execute([$userId,$t,$s['balance'],$s['cursor']]);
    }
    return $events;
}
function streakGrant(PDO $pdo, int $userId, string $type, string $period, string $source, DateTimeImmutable $now): ?array {
    if (!$pdo->inTransaction()) throw new LogicException('Streak grants require a transaction');
    $q = $pdo->prepare('SELECT balance FROM streak_wallets WHERE user_id=? AND type=?'); $q->execute([$userId,$type]);
    $amount = (int)$q->fetchColumn() < 2 ? 1 : 0;
    $event = streakBook($pdo,$userId,$type,'grant',$period,$source,$amount,$now);
    if ($event && $amount) { $q = $pdo->prepare('UPDATE streak_wallets SET balance=balance+1 WHERE user_id=? AND type=?'); $q->execute([$userId,$type]); }
    return $event;
}
function streakAfterCheckin(PDO $pdo, int $userId, int $checkinId, ?int $challengeId, DateTimeImmutable $now): array {
    $d = streakLoad($pdo,$userId,$now,true); $events = [];
    $q = $pdo->prepare('SELECT datum FROM checkins WHERE id=? AND nutzer_id=?'); $q->execute([$checkinId,$userId]); $date = $q->fetchColumn();
    // Historical/future entries correct statistics, but cannot mint rewards or celebrations.
    if (!$date || substr($date,0,10) !== $now->format('Y-m-d') || $date > $now->format('Y-m-d H:i:s')) return [];
    foreach (['day'=>7,'week'=>4] as $t=>$threshold) {
        $period = streakPeriod($date,$t);
        $q = $pdo->prepare('SELECT COUNT(*) FROM checkins WHERE nutzer_id=? AND id<>? AND datum>=? AND datum<?');
        $q->execute([$userId,$checkinId,$period,streakNext($period,$t)]);
        if ((int)$q->fetchColumn() === 0) {
            $summary = streakSummary($d['real'][$t],$d['protected'][$t],$t,$now);
            $qualified = streakBook($pdo,$userId,$t,'qualify',$period,"qualify:$period",0,$now);
            if ($qualified) {
                $qualified['kind'] = $summary['value'] === 1 ? 'start' : 'continue';
                $qualified['value'] = $summary['value']; $events[] = $qualified;
                $q = $pdo->prepare("SELECT period FROM streak_ledger WHERE user_id=? AND type=? AND kind='qualify' AND period>=? AND period<=?");
                $q->execute([$userId,$t,$summary['start'],$period]);
                $earnedPeriods = array_intersect($q->fetchAll(PDO::FETCH_COLUMN), array_keys($d['real'][$t]));
                if (count($earnedPeriods) > 0 && count($earnedPeriods) % $threshold === 0) {
                    $e = streakGrant($pdo,$userId,$t,$period,"milestone:$period",$now); if ($e) $events[] = $e;
                }
            }
        }
        if ($challengeId) { $e = streakGrant($pdo,$userId,$t,$period,"challenge:$challengeId",$now); if ($e) $events[]=$e; }
    }
    return $events;
}
