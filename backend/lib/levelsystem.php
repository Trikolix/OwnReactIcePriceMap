<?php

function getLevelInformationForUser(PDO $pdo, int $userId): ?array {

    $epGesamt = getOverallEpForUser($pdo, $userId);

    // 2. Hole Level-Information
    $stmt = $pdo->prepare("
        SELECT 
            l.level,
            l.ep_min,
            l.level_name,
            (
                SELECT ep_min 
                FROM level_system
                WHERE level = l.level + 1
            ) AS next_ep_required
        FROM level_system l
        WHERE l.ep_min <= :ep
        ORDER BY l.level DESC
        LIMIT 1
    ");
    $stmt->execute(['ep' => $epGesamt]);
    $levelData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$levelData) {
        return null;
    }

    $nextEp = isset($levelData['next_ep_required']) ? (int)$levelData['next_ep_required'] : null;
    $percent = null;
    $epToNext = null;

    if ($nextEp !== null && ($nextEp - $levelData['ep_min']) > 0) {
        $epToNext = $nextEp - $epGesamt;
        $percent = round(
            (($epGesamt - $levelData['ep_min']) / ($nextEp - $levelData['ep_min'])) * 100,
            1
        );
    }

    return [
        'level' => (int)$levelData['level'],
        'level_name' => $levelData['level_name'],
        'ep_current' => $epGesamt,
        'ep_min' => (int)$levelData['ep_min'],
        'ep_to_next' => $epToNext,
        'percent_to_next' => $percent
    ];

}

function getOverallEpForUser(PDO $pdo, int $userId): int {
    $stmt = $pdo->prepare("SELECT 
                n.id AS nutzer_id,
                n.username,
                -- EP durch Check-ins ohne Bild
                COALESCE(ci_ohne_bild.count, 0) * 30 AS ep_checkins_ohne_bild,
                -- EP durch Check-ins mit Bild
                COALESCE(ci_mit_bild.count, 0) * 45 AS ep_checkins_mit_bild,
                -- EP durch Bewertungen
                COALESCE(bw.count, 0) * 20 AS ep_bewertungen,
                -- EP durch Preismeldungen
                COALESCE(pm.count, 0) * 15 AS ep_preismeldungen,
                -- EP durch Routen
                COALESCE(r.count, 0) * 20 AS ep_routen,
                -- EP durch Awards
                COALESCE(a.ep, 0) AS ep_awards,
                -- EP durch eingetragene Eisdielen (mit und ohne Check-ins)
                COALESCE(e.ep, 0) AS ep_eisdielen,
                -- EP durch geworbene Nutzer
                COALESCE(gw.ep, 0) AS ep_geworbene_nutzer,
                -- EP gesamt
                (
                    COALESCE(ci_ohne_bild.count, 0) * 30 +
                    COALESCE(ci_mit_bild.count, 0) * 45 +
                    COALESCE(bw.count, 0) * 20 +
                    COALESCE(pm.count, 0) * 15 +
                    COALESCE(r.count, 0) * 20 +
                    COALESCE(a.ep, 0) +
                    COALESCE(e.ep, 0) +
                    COALESCE(gw.ep, 0)
                ) AS ep_gesamt
            FROM nutzer n
            -- Check-ins ohne Bild
            LEFT JOIN (
                SELECT c.nutzer_id, COUNT(*) AS count
                FROM checkins c
                LEFT JOIN bilder b ON b.checkin_id = c.id
                WHERE b.id IS NULL
                GROUP BY c.nutzer_id
            ) ci_ohne_bild ON ci_ohne_bild.nutzer_id = n.id
            -- Check-ins mit mindestens einem Bild
            LEFT JOIN (
                SELECT c.nutzer_id, COUNT(DISTINCT c.id) AS count
                FROM checkins c
                JOIN bilder b ON b.checkin_id = c.id
                GROUP BY c.nutzer_id
            ) ci_mit_bild ON ci_mit_bild.nutzer_id = n.id
            -- Bewertungen
            LEFT JOIN (
                SELECT nutzer_id, COUNT(*) AS count
                FROM bewertungen
                GROUP BY nutzer_id
            ) bw ON bw.nutzer_id = n.id
            -- Preismeldungen
            LEFT JOIN (
                SELECT gemeldet_von, COUNT(*) AS count
                FROM preise
                GROUP BY gemeldet_von
            ) pm ON pm.gemeldet_von = n.id
            -- Routen
            LEFT JOIN (
                SELECT nutzer_id, COUNT(*) AS count
                FROM routen
                GROUP BY nutzer_id
            ) r ON r.nutzer_id = n.id
            -- Awards (Sonder-EP)
            LEFT JOIN (
                SELECT ua.user_id, SUM(al.ep) AS ep
                FROM user_awards ua
                JOIN award_levels al 
                    ON ua.award_id = al.award_id AND ua.level = al.level
                GROUP BY ua.user_id
            ) a ON a.user_id = n.id  
            -- Eisdielen-EP (mit oder ohne Check-ins)
            LEFT JOIN (
                SELECT 
                    e.user_id,
                    SUM(
                        CASE 
                            WHEN c.id IS NULL THEN 5  -- keine Check-ins
                            ELSE 25                   -- mindestens ein Check-in
                        END
                    ) AS ep
                FROM eisdielen e
                LEFT JOIN checkins c ON c.eisdiele_id = e.id
                GROUP BY e.user_id
            ) e ON e.user_id = n.id
            -- EP durch geworbene Nutzer (10 oder 250 je nach Aktivität)
            LEFT JOIN (
                SELECT 
                    n.invited_by AS nutzer_id,
                    SUM(
                        CASE 
                            WHEN EXISTS (
                                SELECT 1 FROM checkins c WHERE c.nutzer_id = n.id
                            ) THEN 250
                            ELSE 10
                        END
                    ) AS ep
                FROM nutzer n
                WHERE n.is_verified = 1 AND n.invited_by IS NOT NULL
                GROUP BY n.invited_by
            ) gw ON gw.nutzer_id = n.id
            WHERE n.id = :userid");
    $stmt->execute(['userid' => $userId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return isset($result['ep_gesamt']) ? (int)$result['ep_gesamt'] : 0;
}

function updateUserLevelIfChanged(PDO $pdo, int $userId): ?array {
    $levelInfo = getLevelInformationForUser($pdo, $userId);

    if (!$levelInfo) {
        return null;
    }

    // Aktuelles Level laut DB abrufen
    $stmt = $pdo->prepare("SELECT current_level FROM nutzer WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $currentLevel = (int) $stmt->fetchColumn();

    // Wenn neues Level höher → updaten + Rückgabe zur Anzeige im Frontend
    if ($levelInfo['level'] > $currentLevel) {
        $update = $pdo->prepare("UPDATE nutzer SET current_level = :newLevel WHERE id = :id");
        $update->execute([
            'newLevel' => $levelInfo['level'],
            'id' => $userId
        ]);

        // Rückgabe für Frontend (z. B. Level-Up-Modal)
        return [
            'level_up' => true,
            'new_level' => $levelInfo['level'],
            'level_name' => $levelInfo['level_name'],
            'ep_current' => $levelInfo['ep_current']
        ];
    }

    return ['level_up' => false];
}

?>