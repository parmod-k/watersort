-- Water Sort backend schema. Safe to re-run: every statement is idempotent.

CREATE TABLE IF NOT EXISTS players (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per device signed in to a player. A guest has one; a linked account can have several.
CREATE TABLE IF NOT EXISTS player_tokens (
  -- SHA-256 of the device's secret token; the token itself is never stored.
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  player_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tokens_player (player_id),
  CONSTRAINT fk_tokens_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Google / Apple identities linked to a player. This is what makes an account permanent: signing in
-- with the same identity on any device (or after clearing app data) finds the same player.
CREATE TABLE IF NOT EXISTS player_logins (
  provider VARCHAR(16) NOT NULL,
  -- The provider's stable user id (the ID token's "sub").
  subject VARCHAR(255) NOT NULL,
  player_id BIGINT UNSIGNED NOT NULL,
  email VARCHAR(320) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider, subject),
  UNIQUE KEY uniq_player_provider (player_id, provider),
  CONSTRAINT fk_logins_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS player_settings (
  player_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  sound TINYINT(1) NOT NULL DEFAULT 1,
  haptics TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Latest progress snapshot from the player's device, with the totals the leaderboards sort on.
CREATE TABLE IF NOT EXISTS player_progress (
  player_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  coins INT UNSIGNED NOT NULL DEFAULT 0,
  level INT UNSIGNED NOT NULL DEFAULT 1,
  stars INT UNSIGNED NOT NULL DEFAULT 0,
  score INT UNSIGNED NOT NULL DEFAULT 0,
  cleared INT UNSIGNED NOT NULL DEFAULT 0,
  -- Per-level records, owned and equipped cosmetics, as sent by the app.
  data LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_level (level),
  INDEX idx_stars (stars),
  INDEX idx_score (score),
  CONSTRAINT fk_progress_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Every coin change reported by the app (earned or spent), for support and abuse checks.
CREATE TABLE IF NOT EXISTS coin_ledger (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  player_id BIGINT UNSIGNED NOT NULL,
  amount INT NOT NULL,
  reason VARCHAR(16) NOT NULL,
  -- When it happened on the device (ms since epoch). With the other columns it de-duplicates resends.
  at BIGINT UNSIGNED NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_entry (player_id, at, reason, amount),
  INDEX idx_player_at (player_id, at),
  CONSTRAINT fk_ledger_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) ENGINE=InnoDB;
