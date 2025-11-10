-- Remote Server Configuration
-- Migration 007: Geographic regions and rate limiting for remote servers

-- ============================================================================
-- REGIONS TABLE (for remote server geographic distribution)
-- ============================================================================
CREATE TABLE regions (
  region_id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,

  region_code TEXT NOT NULL, -- us-east-1, eu-west-1, etc.
  region_url TEXT NOT NULL,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (config_id) REFERENCES configurations(config_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_regions_config ON regions(config_id);

-- ============================================================================
-- RATE LIMITS TABLE (for remote server rate limiting)
-- ============================================================================
CREATE TABLE rate_limits (
  rate_limit_id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,

  requests_per_minute INTEGER,
  requests_per_hour INTEGER,
  requests_per_day INTEGER,
  concurrent_connections INTEGER,
  burst_allowance INTEGER,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (config_id) REFERENCES configurations(config_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_config ON rate_limits(config_id);
