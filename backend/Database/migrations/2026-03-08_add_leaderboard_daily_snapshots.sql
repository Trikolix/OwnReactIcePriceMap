CREATE TABLE IF NOT EXISTS leaderboard_daily_snapshots (
  id INT NOT NULL AUTO_INCREMENT,
  leaderboard_type VARCHAR(64) NOT NULL,
  snapshot_date DATE NOT NULL,
  user_id INT NOT NULL,
  rank_position INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  payload_json JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_leaderboard_snapshot_user (leaderboard_type, snapshot_date, user_id),
  KEY idx_leaderboard_snapshot_lookup (leaderboard_type, snapshot_date, rank_position),
  CONSTRAINT fk_leaderboard_snapshot_user FOREIGN KEY (user_id) REFERENCES nutzer (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
