<?php
require_once  __DIR__ . '/BaseAwardEvaluator.php';
require_once  __DIR__ . '/../db_connect.php';

class DistanceIceTravelerEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 14;
    private const MIN_DISTANCE_KM = 100;

    public function evaluate(int $userId): array {
        global $pdo;
        $count = $this->meetsCondition($userId);

        $achievements = [];

        // Hole alle Level für diesen Award aus der Datenbank
        $stmt = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep 
                               FROM award_levels 
                               WHERE award_id = :awardId 
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);
        $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($levels as $levelData) {
            $level = (int)$levelData['level'];
            $threshold = (int)$levelData['threshold'];

            if ($count >= $threshold && $this->storeAwardIfNew($userId, self::AWARD_ID, $level)) {
                $achievements[] = [
                    'award_id' => self::AWARD_ID,
                    'level' => $level,
                    'message' => $levelData['description_de'],
                    'icon' => $levelData['icon_path'],
                    'ep' => (int)$levelData['ep'],
                ];
            }
        }
        return $achievements;
    }

    function meetsCondition(int $userId): int {
        global $pdo;
        $today = date('Y-m-d');

        // Hole alle Check-ins des Nutzers für heute inkl. Eisdielen-Koordinaten
        $stmt = $pdo->prepare("
            SELECT ci.id, ci.eisdiele_id, ci.datum, s.latitude, s.longitude
            FROM checkins ci
            JOIN eisdielen s ON ci.eisdiele_id = s.id
            WHERE ci.nutzer_id = :userId AND DATE(ci.datum) = :today
        ");
        $stmt->execute([
            ':userId' => $userId,
            ':today' => $today,
        ]);

        $checkins = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($checkins) < 2) {
            return 0; // Zu wenig Check-ins
        }

        // Prüfe alle Kombinationen auf Entfernung
        for ($i = 0; $i < count($checkins); $i++) {
            for ($j = $i + 1; $j < count($checkins); $j++) {
                $dist = $this->calculateDistance(
                    $checkins[$i]['latitude'],
                    $checkins[$i]['longitude'],
                    $checkins[$j]['latitude'],
                    $checkins[$j]['longitude']
                );

                if ($dist >= self::MIN_DISTANCE_KM) {
                    return 1;
                }
            }
        }

        return 0;
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2): float {
        // Haversine-Formel
        $earthRadius = 6371; // km
        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLat = deg2rad($lat2 - $lat1);
        $deltaLon = deg2rad($lon2 - $lon1);

        $a = sin($deltaLat / 2) ** 2 + cos($lat1Rad) * cos($lat2Rad) * sin($deltaLon / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
?>