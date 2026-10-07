<?php
declare(strict_types=1);

const SHOP_ICE_TYPES = ['kugel', 'softeis', 'eisbecher'];
const SHOP_OFFERING_MIN_CHECKINS = 10;
const SHOP_OFFERING_MIN_VISITORS = 4;
const SHOP_OFFERING_MIN_VOTES = 2;

class ShopOfferingError extends RuntimeException {}

function offeringQuery(PDO $pdo, string $sql, array $params = []): PDOStatement {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function offeringId($value): int {
    if (!(is_int($value) || (is_string($value) && ctype_digit($value))) || (int)$value < 1 || (int)$value > 2147483647) {
        throw new ShopOfferingError('Ungültige ID.', 422);
    }
    return (int)$value;
}

function offeringStates($states): array {
    if (!is_array($states) || array_diff(array_keys($states), SHOP_ICE_TYPES)) {
        throw new ShopOfferingError('Ungültige Eisarten.', 422);
    }
    foreach ($states as $state) {
        if (!in_array($state, ['offered', 'not_offered', 'unknown'], true)) {
            throw new ShopOfferingError('Ungültige Angebotsangabe.', 422);
        }
    }
    return $states;
}

/** Pure resolver. Absence of data is only a labelled, reversible inference. */
function resolveShopIceOfferings(array $observations, array $reports, array $operators, int $total, int $visitors, int $userId = 0): array {
    $result = [];
    foreach (SHOP_ICE_TYPES as $type) {
        $observation = $observations[$type] ?? [];
        $lastSeen = $observation['last_seen'] ?? null;
        $votes = ['offered' => 0, 'not_offered' => 0];
        $approved = [];
        $myState = 'unknown';
        $typeReports = array_filter($reports, static fn($r) => $r['ice_type'] === $type);
        foreach ($typeReports as $report) {
            if ((int)$report['user_id'] === $userId && in_array($report['status'], ['pending', 'approved'], true)) $myState = $report['state'];
            if (!in_array($report['status'], ['pending', 'approved'], true)) continue;
            // A subsequently observed purchase reopens an old absence claim.
            $confirmedAt = $report['status'] === 'approved' ? ($report['decided_at'] ?? $report['updated_at']) : $report['updated_at'];
            if ($report['state'] === 'not_offered' && $lastSeen !== null && $lastSeen >= $confirmedAt) continue;
            $votes[$report['state']]++;
            if ($report['status'] === 'approved') $approved[$report['state']] = true;
        }
        $state = 'unknown';
        $source = 'unknown';
        if (count($approved) === 1) {
            $state = array_key_first($approved);
            $source = 'admin';
        } elseif (count($approved) > 1 || ($votes['offered'] && $votes['not_offered'])) {
            $source = 'conflict';
        } elseif (max($votes) >= SHOP_OFFERING_MIN_VOTES) {
            $state = $votes['offered'] >= SHOP_OFFERING_MIN_VOTES ? 'offered' : 'not_offered';
            $source = 'community';
        } elseif ($lastSeen !== null) {
            $state = 'offered';
            $source = 'observed';
        } elseif ($votes['offered'] > 0) {
            $source = 'community';
        } elseif ($total >= SHOP_OFFERING_MIN_CHECKINS && $visitors >= SHOP_OFFERING_MIN_VISITORS) {
            $state = 'not_offered';
            $source = 'inferred';
        }
        $operator = $operators[$type] ?? null;
        $discrepancy = false;
        if ($operator) {
            foreach ($typeReports as $report) {
                if (in_array($report['status'], ['pending', 'approved'], true) && $report['state'] !== $operator['state'] && $report['updated_at'] > $operator['updated_at']) $discrepancy = true;
            }
            if ($operator['state'] === 'not_offered' && $lastSeen !== null && $lastSeen > $operator['updated_at']) $discrepancy = true;
            $state = $operator['state'];
            $source = 'operator';
        }
        $result[$type] = [
            'state' => $state, 'source' => $source,
            'checkin_count' => (int)($observation['checkin_count'] ?? 0),
            'votes' => $votes, 'my_state' => $myState,
            'operator_state' => $operator['state'] ?? 'unknown',
            'discrepancy' => $discrepancy,
        ];
    }
    return $result;
}

function getShopIceOfferings(PDO $pdo, int $shopId, int $userId = 0): array {
    $totals = offeringQuery($pdo, 'SELECT COUNT(*) AS total, COUNT(DISTINCT nutzer_id) AS visitors FROM checkins WHERE eisdiele_id = ?', [$shopId])->fetch(PDO::FETCH_ASSOC);
    $observations = [];
    $rows = offeringQuery($pdo, 'SELECT LOWER(typ) AS ice_type, COUNT(*) AS checkin_count, MAX(datum) AS last_seen FROM checkins WHERE eisdiele_id = ? GROUP BY typ', [$shopId])->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) $observations[$row['ice_type']] = $row;
    $prices = offeringQuery($pdo, 'SELECT typ AS ice_type, MAX(gemeldet_am) AS last_seen FROM preise WHERE eisdiele_id = ? AND preis > 0 GROUP BY typ', [$shopId])->fetchAll(PDO::FETCH_ASSOC);
    foreach ($prices as $price) {
        $type = $price['ice_type'];
        if (!isset($observations[$type]['last_seen']) || $price['last_seen'] > $observations[$type]['last_seen']) $observations[$type]['last_seen'] = $price['last_seen'];
    }
    $reports = [];
    $operators = [];
    // Additive rollout: old installations keep working until the migration is applied.
    try {
        $reports = offeringQuery($pdo, 'SELECT * FROM shop_ice_offering_reports WHERE shop_id = ?', [$shopId])->fetchAll(PDO::FETCH_ASSOC);
        $rows = offeringQuery($pdo, "SELECT o.* FROM shop_ice_offering_operators o JOIN shop_operator_members m ON m.shop_id = o.shop_id AND m.user_id = o.operator_id AND m.role = 'operator' AND m.state = 'active' WHERE o.shop_id = ?", [$shopId])->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) $operators[$row['ice_type']] = $row;
    } catch (PDOException $e) {
        if ($e->getCode() !== '42S02') throw $e;
    }
    return resolveShopIceOfferings($observations, $reports, $operators, (int)$totals['total'], (int)$totals['visitors'], $userId);
}

/** Called inside the business-update transaction, after checking the active operator role. */
function saveOperatorIceOfferings(PDO $pdo, int $shopId, int $userId, array $states): void {
    foreach (offeringStates($states) as $type => $state) {
        if ($state === 'unknown') {
            offeringQuery($pdo, 'DELETE FROM shop_ice_offering_operators WHERE shop_id = ? AND ice_type = ?', [$shopId, $type]);
        } else {
            offeringQuery($pdo, 'INSERT INTO shop_ice_offering_operators (shop_id, ice_type, state, operator_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE updated_at = IF(state = VALUES(state) AND operator_id = VALUES(operator_id), updated_at, CURRENT_TIMESTAMP(6)), state = VALUES(state), operator_id = VALUES(operator_id)', [$shopId, $type, $state, $userId]);
        }
    }
}

function offeringTransaction(PDO $pdo, int $shopId, callable $callback) {
    $pdo->beginTransaction();
    try {
        if (!offeringQuery($pdo, 'SELECT id FROM eisdielen WHERE id = ? FOR UPDATE', [$shopId])->fetchColumn()) throw new ShopOfferingError('Eisdiele nicht gefunden.', 404);
        $result = $callback();
        $pdo->commit();
        return $result;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function reportShopIceOfferings(PDO $pdo, int $userId, array $data): array {
    if ($userId < 1) throw new ShopOfferingError('Bitte melde dich an.', 401);
    $shopId = offeringId($data['shop_id'] ?? null);
    $states = offeringStates($data['states'] ?? null);
    if (!$states) throw new ShopOfferingError('Bitte eine Eisart auswählen.', 422);
    return offeringTransaction($pdo, $shopId, function() use ($pdo, $shopId, $userId, $states) {
        foreach ($states as $type => $state) {
            if ($state === 'unknown') {
                offeringQuery($pdo, "UPDATE shop_ice_offering_reports SET status = 'withdrawn', updated_at = CURRENT_TIMESTAMP(6), decided_by = NULL, decided_at = NULL WHERE shop_id = ? AND user_id = ? AND ice_type = ?", [$shopId, $userId, $type]);
            } elseif ($userId === 1) {
                supersedeShopOfferingApprovals($pdo, $shopId, $type, $state, $userId);
                offeringQuery($pdo, "INSERT INTO shop_ice_offering_reports (shop_id, user_id, ice_type, state, status, decided_by, decided_at) VALUES (?, ?, ?, ?, 'approved', ?, CURRENT_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE state = VALUES(state), status = 'approved', updated_at = CURRENT_TIMESTAMP(6), decided_by = VALUES(decided_by), decided_at = VALUES(decided_at)", [$shopId, $userId, $type, $state, $userId]);
            } else {
                offeringQuery($pdo, "INSERT INTO shop_ice_offering_reports (shop_id, user_id, ice_type, state) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE state = VALUES(state), status = 'pending', updated_at = CURRENT_TIMESTAMP(6), decided_by = NULL, decided_at = NULL", [$shopId, $userId, $type, $state]);
            }
        }
        return ['message' => 'Deine Angebotsangaben wurden gespeichert.', 'ice_offerings' => getShopIceOfferings($pdo, $shopId, $userId)];
    });
}

/** An explicit admin decision replaces older opposing approvals under the shop lock. */
function supersedeShopOfferingApprovals(PDO $pdo, int $shopId, string $type, string $state, int $adminId): void {
    offeringQuery($pdo, "UPDATE shop_ice_offering_reports SET status = 'rejected', decided_by = ?, decided_at = CURRENT_TIMESTAMP(6) WHERE shop_id = ? AND ice_type = ? AND state <> ? AND status = 'approved'", [$adminId, $shopId, $type, $state]);
}

function listShopOfferingReports(PDO $pdo, int $userId, string $status): array {
    if ($userId !== 1) throw new ShopOfferingError('Nur für den Administrator.', 403);
    if (!in_array($status, ['pending', 'approved', 'rejected', 'withdrawn', 'all'], true)) throw new ShopOfferingError('Ungültiger Status.', 422);
    return offeringQuery($pdo, 'SELECT r.*, e.name AS shop_name, n.username AS requester_name FROM shop_ice_offering_reports r JOIN eisdielen e ON e.id = r.shop_id JOIN nutzer n ON n.id = r.user_id' . ($status === 'all' ? '' : ' WHERE r.status = ?') . ' ORDER BY r.updated_at DESC, r.id DESC LIMIT 100', $status === 'all' ? [] : [$status])->fetchAll(PDO::FETCH_ASSOC);
}

function reviewShopOfferingReport(PDO $pdo, int $userId, array $data): array {
    if ($userId !== 1) throw new ShopOfferingError('Nur für den Administrator.', 403);
    $id = offeringId($data['report_id'] ?? null);
    $action = $data['decision'] ?? null;
    if (!in_array($action, ['approve', 'reject'], true)) throw new ShopOfferingError('Ungültige Entscheidung.', 422);
    $report = offeringQuery($pdo, 'SELECT * FROM shop_ice_offering_reports WHERE id = ?', [$id])->fetch(PDO::FETCH_ASSOC);
    if (!$report) throw new ShopOfferingError('Meldung nicht gefunden.', 404);
    return offeringTransaction($pdo, (int)$report['shop_id'], function() use ($pdo, $id, $userId, $action, $data) {
        $report = offeringQuery($pdo, 'SELECT * FROM shop_ice_offering_reports WHERE id = ? FOR UPDATE', [$id])->fetch(PDO::FETCH_ASSOC);
        if ($report['status'] !== 'pending' || ($data['updated_at'] ?? null) !== $report['updated_at']) throw new ShopOfferingError('Die Meldung wurde inzwischen geändert. Bitte neu laden.', 409);
        if ($action === 'approve') supersedeShopOfferingApprovals($pdo, (int)$report['shop_id'], $report['ice_type'], $report['state'], $userId);
        offeringQuery($pdo, 'UPDATE shop_ice_offering_reports SET status = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP(6) WHERE id = ?', [$action === 'approve' ? 'approved' : 'rejected', $userId, $id]);
        return ['message' => 'Die Angebotsmeldung wurde geprüft.'];
    });
}
