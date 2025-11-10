-- Installation Prerequisites
-- Migration 008: Server installation requirements and dependencies

-- ============================================================================
-- INSTALLATION PREREQUISITES TABLE
-- ============================================================================
CREATE TABLE installation_prerequisites (
  prerequisite_id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,

  prerequisite_type TEXT NOT NULL CHECK (prerequisite_type IN ('runtime', 'credential', 'system', 'network')),
  name TEXT NOT NULL,
  version TEXT, -- version requirement (for runtimes)
  description TEXT,

  -- Verification
  check_command TEXT,
  install_url TEXT,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prerequisites_server ON installation_prerequisites(server_id);
CREATE INDEX IF NOT EXISTS idx_prerequisites_type ON installation_prerequisites(prerequisite_type);
