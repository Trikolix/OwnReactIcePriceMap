ALTER TABLE bewertungen
  ADD COLUMN IF NOT EXISTS zuletzt_bearbeitet_am TIMESTAMP NULL DEFAULT NULL AFTER erstellt_am;
