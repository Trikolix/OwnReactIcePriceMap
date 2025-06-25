SELECT 
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
    
    -- EP gesamt
    (
        COALESCE(ci_ohne_bild.count, 0) * 30 +
        COALESCE(ci_mit_bild.count, 0) * 45 +
        COALESCE(bw.count, 0) * 20 +
        COALESCE(pm.count, 0) * 15 +
        COALESCE(r.count, 0) * 20 +
        COALESCE(a.ep, 0) +
        COALESCE(e.ep, 0) 
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

ORDER BY `ep_gesamt`  DESC;