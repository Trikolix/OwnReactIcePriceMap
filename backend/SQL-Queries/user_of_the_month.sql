SELECT 
    n.id AS nutzer_id,
    n.username,    
    -- Anzahl Checkins
    COALESCE(ci_ohne_bild.count, 0) + COALESCE(ci_mit_bild.count, 0) AS anzahl_checkins,
    -- EP durch Check-ins ohne Bild
    COALESCE(ci_ohne_bild.count, 0) * 30 AS ep_checkins_ohne_bild,    
    -- EP durch Check-ins mit Bild
    COALESCE(ci_mit_bild.count, 0) * 45 AS ep_checkins_mit_bild,
    -- Anzahl Bewertungen
    COALESCE(bw.count, 0) AS anzahl_bewertungen,    
    -- EP durch Bewertungen
    COALESCE(bw.count, 0) * 20 AS ep_bewertungen, 
    -- Anzahl Preismeldungen
    COALESCE(pm.count, 0) AS anzahl_preismeldungen,   
    -- EP durch Preismeldungen
    COALESCE(pm.count, 0) * 15 AS ep_preismeldungen,
    -- Anzahl Routen
    COALESCE(r.count, 0) AS anzahl_routen,
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
    AND c.datum BETWEEN :startDate AND :endDate
    GROUP BY c.nutzer_id
) ci_ohne_bild ON ci_ohne_bild.nutzer_id = n.id

-- Check-ins mit mindestens einem Bild
LEFT JOIN (
    SELECT c.nutzer_id, COUNT(DISTINCT c.id) AS count
    FROM checkins c
    JOIN bilder b ON b.checkin_id = c.id
    AND c.datum BETWEEN :startDate AND :endDate
    GROUP BY c.nutzer_id
) ci_mit_bild ON ci_mit_bild.nutzer_id = n.id

-- Bewertungen
LEFT JOIN (
    SELECT nutzer_id, COUNT(*) AS count
    FROM bewertungen
    WHERE bewertungen.erstellt_am BETWEEN :startDate AND :endDate
    GROUP BY nutzer_id
) bw ON bw.nutzer_id = n.id

-- Preismeldungen
LEFT JOIN (
    SELECT gemeldet_von, COUNT(*) AS count
    FROM preise
    WHERE preise.gemeldet_am BETWEEN :startDate AND :endDate
    GROUP BY gemeldet_von
) pm ON pm.gemeldet_von = n.id

-- Routen
LEFT JOIN (
    SELECT nutzer_id, COUNT(*) AS count
    FROM routen
    WHERE routen.erstellt_am BETWEEN :startDate AND :endDate
    GROUP BY nutzer_id
) r ON r.nutzer_id = n.id

-- Awards (Sonder-EP)
LEFT JOIN (
    SELECT ua.user_id, SUM(al.ep) AS ep
    FROM user_awards ua
    JOIN award_levels al 
        ON ua.award_id = al.award_id AND ua.level = al.level
    WHERE ua.awarded_at BETWEEN :startDate AND :endDate
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
    WHERE e.erstellt_am BETWEEN :startDate AND :endDate
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
        AND n.erstellt_am BETWEEN :startDate AND :endDate
        GROUP BY n.invited_by
    ) gw ON gw.nutzer_id = n.id

ORDER BY `ep_gesamt`  DESC;