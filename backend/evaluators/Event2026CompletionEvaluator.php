<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../event2026/bootstrap.php';

class Event2026CompletionEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 62;
    const SPECIAL_LEVEL = 4;
    const DEFAULT_SPECIAL_THRESHOLD = 8;

    private string $mode;
    private ?int $selfRideId;

    public function __construct(string $mode = 'live', ?int $selfRideId = null) {
        $this->mode = event2026_normalize_stamp_card_mode($mode);
        $this->selfRideId = $selfRideId;
    }

    public function evaluate(int $userId): array {
        global $pdo;

        if ($this->mode !== 'live' && $this->mode !== 'self_ride') {
            return [];
        }

        $event = event2026_current_event($pdo);
        $eventId = (int)$event['id'];
        $slot = $this->mode === 'self_ride'
            ? $this->getSelfRide($eventId, $userId)
            : event2026_get_slot_for_user($pdo, $eventId, $userId);
        if (!$slot) {
            return [];
        }

        $routeKey = event2026_normalize_route_key($slot['route_key'] ?? '');
        $progress = $this->mode === 'self_ride'
            ? $this->getSelfRideCompletionProgress($eventId, $userId, $slot, $routeKey)
            : $this->getMandatoryProgress($eventId, (int)$slot['id'], $routeKey);
        if (!$progress['is_finisher']) {
            return [];
        }

        $levelsByLevel = $this->getAwardLevels();
        if (empty($levelsByLevel)) {
            return [];
        }

        $achievements = [];
        $finisherLevel = $this->getFinisherLevelForRoute($routeKey);
        if ($finisherLevel !== null) {
            $achievement = $this->storeLevelIfNew($userId, $finisherLevel, $levelsByLevel);
            if ($achievement !== null) {
                $achievements[] = $achievement;
            }
        }

        if ($this->mode === 'self_ride') {
            $this->markSelfRideCompleted((int)$slot['id']);
            return $achievements;
        }

        $specialThreshold = isset($levelsByLevel[self::SPECIAL_LEVEL]['threshold'])
            ? (int)$levelsByLevel[self::SPECIAL_LEVEL]['threshold']
            : self::DEFAULT_SPECIAL_THRESHOLD;
        if ($this->getEventDayPortionCount($userId, $event) >= $specialThreshold) {
            $achievement = $this->storeLevelIfNew($userId, self::SPECIAL_LEVEL, $levelsByLevel);
            if ($achievement !== null) {
                $achievements[] = $achievement;
            }
        }

        return $achievements;
    }

    private function getFinisherLevelForRoute(string $routeKey): ?int {
        switch (event2026_normalize_route_key($routeKey)) {
            case 'family_2':
                return 1;
            case 'classic_3':
                return 2;
            case 'epic_4':
                return 3;
            default:
                return null;
        }
    }

    private function getAwardLevels(): array {
        global $pdo;

        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
            FROM award_levels
            WHERE award_id = :awardId");
        $stmt->execute(['awardId' => self::AWARD_ID]);

        $levels = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $levels[(int)$row['level']] = $row;
        }
        return $levels;
    }

    private function storeLevelIfNew(int $userId, int $level, array $levelsByLevel): ?array {
        if (!isset($levelsByLevel[$level])) {
            return null;
        }
        if (!$this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
            return null;
        }

        $levelData = $levelsByLevel[$level];
        return [
            'award_id' => self::AWARD_ID,
            'level' => $level,
            'message' => (string)($levelData['description_de'] ?? ''),
            'icon' => $levelData['icon_path'] ?? null,
            'ep' => (int)($levelData['ep'] ?? 0),
        ];
    }

    private function getMandatoryProgress(int $eventId, int $slotId, string $routeKey): array {
        global $pdo;

        $stmt = $pdo->prepare("SELECT
                c.route_keys_csv,
                p.passed_at
            FROM event2026_checkpoints c
            LEFT JOIN event2026_checkpoint_passages p
                ON p.checkpoint_id = c.id
                AND p.event_id = c.event_id
                AND p.slot_id = :slotId
            WHERE c.event_id = :eventId
              AND c.stamp_card_mode = :mode
              AND c.is_mandatory = 1");
        $stmt->execute([
            'slotId' => $slotId,
            'eventId' => $eventId,
            'mode' => $this->mode,
        ]);

        $total = 0;
        $passed = 0;
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            if (!event2026_route_applies_to_checkpoint($routeKey, (string)($row['route_keys_csv'] ?? ''))) {
                continue;
            }
            $total++;
            if ($row['passed_at'] !== null) {
                $passed++;
            }
        }

        return [
            'total' => $total,
            'passed' => $passed,
            'is_finisher' => $total > 0 && $passed >= $total,
        ];
    }

    private function getSelfRide(int $eventId, int $userId): ?array {
        global $pdo;

        if ($this->selfRideId !== null) {
            $stmt = $pdo->prepare("SELECT *
                FROM event2026_self_rides
                WHERE id = :id
                  AND event_id = :eventId
                  AND user_id = :userId
                  AND status <> 'cancelled'
                LIMIT 1");
            $stmt->execute([
                'id' => $this->selfRideId,
                'eventId' => $eventId,
                'userId' => $userId,
            ]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        }

        return event2026_get_self_ride_for_user($pdo, $eventId, $userId);
    }

    private function getSelfRideCompletionProgress(int $eventId, int $userId, array $selfRide, string $routeKey): array {
        $mandatoryProgress = $this->getSelfRideMandatoryProgress($eventId, (int)$selfRide['id'], $routeKey);
        $checkinProgress = $this->getSelfRideCheckinProgress($userId, $selfRide, $routeKey);

        return [
            'total' => $mandatoryProgress['total'] + $checkinProgress['total'],
            'passed' => $mandatoryProgress['passed'] + min($checkinProgress['passed'], $checkinProgress['total']),
            'is_finisher' => $mandatoryProgress['is_finisher'] && $checkinProgress['is_finisher'],
        ];
    }

    private function getSelfRideMandatoryProgress(int $eventId, int $selfRideId, string $routeKey): array {
        global $pdo;

        $stmt = $pdo->prepare("SELECT
                c.route_keys_csv,
                p.passed_at
            FROM event2026_checkpoints c
            LEFT JOIN event2026_self_ride_passages p
                ON p.checkpoint_id = c.id
                AND p.event_id = c.event_id
                AND p.self_ride_id = :selfRideId
            WHERE c.event_id = :eventId
              AND c.stamp_card_mode = 'self_ride'
              AND c.is_mandatory = 1");
        $stmt->execute([
            'selfRideId' => $selfRideId,
            'eventId' => $eventId,
        ]);

        $total = 0;
        $passed = 0;
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            if (!event2026_route_applies_to_checkpoint($routeKey, (string)($row['route_keys_csv'] ?? ''))) {
                continue;
            }
            $total++;
            if ($row['passed_at'] !== null) {
                $passed++;
            }
        }

        return [
            'total' => $total,
            'passed' => $passed,
            'is_finisher' => $total > 0 && $passed >= $total,
        ];
    }

    private function getSelfRideCheckinProgress(int $userId, array $selfRide, string $routeKey): array {
        global $pdo;

        $requiredCheckins = event2026_self_ride_required_checkins($routeKey);
        $shopIds = event2026_self_ride_route_shop_ids($routeKey);
        if (empty($shopIds)) {
            return [
                'total' => $requiredCheckins,
                'passed' => 0,
                'is_finisher' => false,
            ];
        }

        $shopIdSql = implode(',', array_map('intval', $shopIds));
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT c.id)
            FROM checkins c
            WHERE c.nutzer_id = :userId
              AND c.datum >= :startsAt
              AND c.datum < :expiresAt
              AND c.eisdiele_id IN ({$shopIdSql})");
        $stmt->execute([
            'userId' => $userId,
            'startsAt' => (string)$selfRide['starts_at'],
            'expiresAt' => (string)$selfRide['expires_at'],
        ]);
        $checkinCount = (int)$stmt->fetchColumn();

        return [
            'total' => $requiredCheckins,
            'passed' => $checkinCount,
            'is_finisher' => $checkinCount >= $requiredCheckins,
        ];
    }

    private function markSelfRideCompleted(int $selfRideId): void {
        global $pdo;

        $stmt = $pdo->prepare("UPDATE event2026_self_rides
            SET status = 'completed',
                completed_at = COALESCE(completed_at, NOW())
            WHERE id = :id
              AND status <> 'completed'");
        $stmt->execute(['id' => $selfRideId]);
    }

    private function getEventDayPortionCount(int $userId, array $event): int {
        global $pdo;

        $eventDate = !empty($event['event_date']) ? (string)$event['event_date'] : '2026-05-16';
        $shopIds = event2026_checkpoint_shop_ids();
        if (empty($shopIds)) {
            return 0;
        }

        $shopIdSql = implode(',', array_map('intval', $shopIds));
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(portions.portion_count), 0)
            FROM (
                SELECT
                    c.id,
                    GREATEST(1, COUNT(cs.id)) AS portion_count
                FROM checkins c
                LEFT JOIN checkin_sorten cs ON cs.checkin_id = c.id
                WHERE c.nutzer_id = :userId
                  AND DATE(c.datum) = :eventDate
                  AND c.eisdiele_id IN ({$shopIdSql})
                GROUP BY c.id
            ) portions");
        $stmt->execute([
            'userId' => $userId,
            'eventDate' => $eventDate,
        ]);

        return (int)$stmt->fetchColumn();
    }
}
?>
