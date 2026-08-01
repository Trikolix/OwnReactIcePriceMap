-- `preise` is an append-only log of observed prices.  A repeated confirmation
-- must create a new event so historical as-of queries remain possible.
ALTER TABLE preise
  DROP INDEX eisdiele_id,
  ADD COLUMN is_reward_eligible TINYINT(1) NOT NULL DEFAULT 1 AFTER first_time_reported,
  ADD KEY idx_preise_shop_type_reported (eisdiele_id, typ, gemeldet_am, id),
  ADD KEY idx_preise_reward_identity (eisdiele_id, typ, gemeldet_von, preis),
  ADD KEY idx_preise_reporter_reward_reported (gemeldet_von, is_reward_eligible, gemeldet_am);

-- Existing rows were the only award-eligible representation of their price
-- reports before the append-only history was introduced.
UPDATE preise
SET is_reward_eligible = 1
WHERE is_reward_eligible <> 1;
