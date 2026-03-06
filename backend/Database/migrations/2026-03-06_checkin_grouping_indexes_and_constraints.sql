-- Checkin grouping hardening:
-- 1) Remove duplicate mention pairs
-- 2) Add unique and lookup indexes needed for race-safe grouping and suggestions

-- Duplikate in checkin_mentions bereinigen (behalte jeweils die kleinste id)
DELETE cm1
FROM checkin_mentions cm1
JOIN checkin_mentions cm2
  ON cm1.checkin_id = cm2.checkin_id
 AND cm1.mentioned_user_id = cm2.mentioned_user_id
 AND cm1.id > cm2.id;

-- Unique-Key: pro Checkin/Nutzer genau eine Mention
SET @has_unique := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'checkin_mentions'
    AND index_name = 'uniq_checkin_mentions_pair'
);
SET @sql := IF(
  @has_unique = 0,
  'ALTER TABLE checkin_mentions ADD UNIQUE KEY uniq_checkin_mentions_pair (checkin_id, mentioned_user_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: schnelle Abfragen nach erwähntem Nutzer + Status + Zeit
SET @has_idx_mentions_user_status_created := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'checkin_mentions'
    AND index_name = 'idx_mentions_user_status_created'
);
SET @sql := IF(
  @has_idx_mentions_user_status_created = 0,
  'ALTER TABLE checkin_mentions ADD KEY idx_mentions_user_status_created (mentioned_user_id, status, created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: schnelle Abfragen nach Checkin + Status
SET @has_idx_mentions_checkin_status := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'checkin_mentions'
    AND index_name = 'idx_mentions_checkin_status'
);
SET @sql := IF(
  @has_idx_mentions_checkin_status = 0,
  'ALTER TABLE checkin_mentions ADD KEY idx_mentions_checkin_status (checkin_id, status)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: schnelle Vorschlags-Suche am selben Shop/Zeitfenster
SET @has_idx_checkins_shop_date := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'checkins'
    AND index_name = 'idx_checkins_shop_date'
);
SET @sql := IF(
  @has_idx_checkins_shop_date = 0,
  'ALTER TABLE checkins ADD KEY idx_checkins_shop_date (eisdiele_id, datum)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: schnelle Nutzer+Datum-Abfragen
SET @has_idx_checkins_user_date := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'checkins'
    AND index_name = 'idx_checkins_user_date'
);
SET @sql := IF(
  @has_idx_checkins_user_date = 0,
  'ALTER TABLE checkins ADD KEY idx_checkins_user_date (nutzer_id, datum)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Optionaler Index für Gruppenzugriffe (falls noch nicht vorhanden)
SET @has_idx_checkins_group_id := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'checkins'
    AND index_name = 'idx_checkins_group_id'
);
SET @sql := IF(
  @has_idx_checkins_group_id = 0,
  'ALTER TABLE checkins ADD KEY idx_checkins_group_id (group_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

