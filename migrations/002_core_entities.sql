-- Core Entities: Authors and Servers
-- Migration 002: Foundation tables for MCP server registry

-- ============================================================================
-- AUTHORS TABLE (for server publishers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authors (
  author_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_authors_verified ON authors(verified);

-- ============================================================================
-- SERVERS TABLE (enhanced with new fields)
-- ============================================================================
-- Drop existing simple servers table if it exists
DROP TABLE IF EXISTS servers;

CREATE TABLE servers (
  server_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL,
  author_id TEXT,

  -- Repository information (stored as JSON)
  repository_type TEXT, -- github, gitlab, bitbucket, etc.
  repository_url TEXT,
  repository_directory TEXT,

  -- Deployment and trust
  deployment_type TEXT NOT NULL CHECK (deployment_type IN ('local', 'remote', 'hybrid')),
  trust_level TEXT NOT NULL DEFAULT 'unverified' CHECK (trust_level IN ('verified', 'community', 'unverified')),

  -- Categories and tags (stored as JSON arrays)
  categories TEXT NOT NULL DEFAULT '[]', -- JSON array
  tags TEXT NOT NULL DEFAULT '[]', -- JSON array

  -- Popularity metrics
  popularity_score INTEGER DEFAULT 0,
  install_count INTEGER DEFAULT 0,

  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  last_updated TEXT, -- ISO 8601 timestamp from source

  FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_servers_deployment ON servers(deployment_type);
CREATE INDEX IF NOT EXISTS idx_servers_trust ON servers(trust_level);
CREATE INDEX IF NOT EXISTS idx_servers_author ON servers(author_id);
CREATE INDEX IF NOT EXISTS idx_servers_popularity ON servers(popularity_score DESC);

-- ============================================================================
-- TRIGGERS for updated_at timestamps
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS update_authors_timestamp
AFTER UPDATE ON authors
BEGIN
  UPDATE authors SET updated_at = strftime('%s', 'now') WHERE author_id = NEW.author_id;
END;

CREATE TRIGGER IF NOT EXISTS update_servers_timestamp
AFTER UPDATE ON servers
BEGIN
  UPDATE servers SET updated_at = strftime('%s', 'now') WHERE server_id = NEW.server_id;
END;
