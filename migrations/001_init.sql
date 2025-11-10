-- Initial migration
-- Create migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Additional application tables will be added in future migrations
