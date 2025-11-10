-- Domain Mappings
-- Migration 005: Domain associations for servers

-- ============================================================================
-- DOMAIN MAPPINGS TABLE (domain associations for servers)
-- ============================================================================
CREATE TABLE domain_mappings (
  mapping_id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,

  -- Domain pattern matching
  domain_pattern TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'wildcard', 'regex')),
  priority INTEGER DEFAULT 1,

  -- Context requirements (JSON)
  context_requirements TEXT, -- JSON: {url_patterns, page_indicators, etc}

  -- Behavior
  auto_suggest INTEGER NOT NULL DEFAULT 1 CHECK (auto_suggest IN (0, 1)),
  auto_install INTEGER NOT NULL DEFAULT 0 CHECK (auto_install IN (0, 1)),

  -- Sub-patterns for complex domains (JSON array)
  sub_patterns TEXT, -- JSON: [{pattern, context, tools_filter}]

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_domain_pattern ON domain_mappings(domain_pattern);
CREATE INDEX IF NOT EXISTS idx_domain_server ON domain_mappings(server_id);
CREATE INDEX IF NOT EXISTS idx_domain_priority ON domain_mappings(priority DESC);
CREATE INDEX IF NOT EXISTS idx_domain_auto_suggest ON domain_mappings(auto_suggest);
