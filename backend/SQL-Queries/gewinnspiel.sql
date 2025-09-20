
-- NutzerId, Username und Anzahl der Lose für das Gewinnspiel
WITH 
-- Check-ins mit Bildern im Aktionszeitraum
checkin_lose AS (
    SELECT 
        c.nutzer_id,
        COUNT(*) as anzahl_lose
    FROM checkins c
    INNER JOIN bilder b ON c.id = b.checkin_id
    WHERE c.datum >= '2025-07-28 00:00:00' 
      AND c.datum <= '2025-08-31 23:59:59'
    GROUP BY c.nutzer_id
),

-- Geworbene aktive Nutzer (Nutzer die sich im Aktionszeitraum registriert haben)
werbung_lose AS (
    SELECT 
        invited_by as nutzer_id,
        COUNT(*) * 5 as anzahl_lose
    FROM nutzer 
    WHERE erstellt_am >= '2025-07-28 00:00:00' 
      AND erstellt_am <= '2025-08-31 23:59:59'
      AND invited_by IS NOT NULL
    GROUP BY invited_by
),

-- Alle Lose zusammengefasst
alle_lose AS (
    SELECT nutzer_id, anzahl_lose FROM checkin_lose
    UNION ALL
    SELECT nutzer_id, anzahl_lose FROM werbung_lose
),

-- Gesamtanzahl Lose pro Nutzer
nutzer_lose_gesamt AS (
    SELECT 
        nutzer_id,
        SUM(anzahl_lose) as gesamt_lose
    FROM alle_lose
    GROUP BY nutzer_id
)

-- Finale Ausgabe: Nutzer-ID, Username und Anzahl Lose
SELECT 
    n.id as nutzer_id,
    n.username,
    nlg.gesamt_lose as anzahl_lose
FROM nutzer_lose_gesamt nlg
JOIN nutzer n ON nlg.nutzer_id = n.id
ORDER BY nlg.gesamt_lose DESC, n.username;


-- Losziehung ohne TheGourmetCyclist oder TheGourmetBiker
WITH 
-- Check-ins mit Bildern im Aktionszeitraum
checkin_lose AS (
    SELECT 
        c.nutzer_id,
        COUNT(*) as anzahl_lose
    FROM checkins c
    INNER JOIN bilder b ON c.id = b.checkin_id
    WHERE c.datum >= '2025-07-28 00:00:00' 
      AND c.datum <= '2025-08-31 23:59:59'
	  AND c.nutzer_id != 1
      AND c.nutzer_id != 2
    GROUP BY c.nutzer_id
),

-- Geworbene aktive Nutzer (Nutzer die sich im Aktionszeitraum registriert haben)
werbung_lose AS (
    SELECT 
        invited_by as nutzer_id,
        COUNT(*) * 5 as anzahl_lose
    FROM nutzer 
    WHERE erstellt_am >= '2025-07-28 00:00:00' 
      AND erstellt_am <= '2025-08-31 23:59:59'
      AND invited_by IS NOT NULL
	  AND invited_by != 1
      AND invited_by != 2
    GROUP BY invited_by
),

-- Alle Lose zusammengefasst
alle_lose AS (
    SELECT nutzer_id, anzahl_lose FROM checkin_lose
    UNION ALL
    SELECT nutzer_id, anzahl_lose FROM werbung_lose
),

-- Gesamtanzahl Lose pro Nutzer
nutzer_lose_gesamt AS (
    SELECT 
        nutzer_id,
        SUM(anzahl_lose) as gesamt_lose
    FROM alle_lose
    GROUP BY nutzer_id
)

-- Finale Ausgabe: Jede Nutzer-ID so oft wie sie Lose hat
SELECT nutzer_id
FROM nutzer_lose_gesamt
CROSS JOIN (
    SELECT 1 as lose_nummer
    UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
    UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
    UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
    UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
    -- Weitere Zahlen hinzufügen falls mehr als 20 Lose pro Nutzer möglich
) lose_zahlen
WHERE lose_zahlen.lose_nummer <= nutzer_lose_gesamt.gesamt_lose
ORDER BY RAND();