-- Run on development/staging before deploying the backend and frontend.
-- No existing prices, scores or check-ins are changed.
CREATE TABLE IF NOT EXISTS shop_ice_offering_operators (
  shop_id INT NOT NULL,
  ice_type ENUM('kugel','softeis','eisbecher') NOT NULL,
  state ENUM('offered','not_offered') NOT NULL,
  operator_id INT NOT NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (shop_id, ice_type),
  KEY idx_offering_operator (operator_id),
  FOREIGN KEY (shop_id) REFERENCES eisdielen(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES nutzer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shop_ice_offering_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shop_id INT NOT NULL,
  user_id INT NOT NULL,
  ice_type ENUM('kugel','softeis','eisbecher') NOT NULL,
  state ENUM('offered','not_offered') NOT NULL,
  status ENUM('pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  decided_by INT DEFAULT NULL,
  decided_at DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_offering_vote (shop_id, user_id, ice_type),
  KEY idx_offering_moderation (status, updated_at),
  FOREIGN KEY (shop_id) REFERENCES eisdielen(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE,
  FOREIGN KEY (decided_by) REFERENCES nutzer(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
