-- Server Capabilities
-- Migration 006: Tools, resources, and prompts provided by servers

-- ============================================================================
-- TOOLS TABLE (server-provided tools)
-- ============================================================================
CREATE TABLE tools (
  tool_id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,

  tool_name TEXT NOT NULL,
  display_name TEXT,
  description TEXT NOT NULL,

  -- Input schema (JSON Schema)
  input_schema TEXT NOT NULL DEFAULT '{}',

  -- Authentication requirements
  requires_auth INTEGER NOT NULL DEFAULT 0 CHECK (requires_auth IN (0, 1)),
  min_auth_scopes TEXT, -- JSON array

  -- Rate limiting (JSON)
  rate_limit_data TEXT, -- JSON: {calls_per_hour, shared_with: [...]}

  -- Examples (JSON array)
  examples TEXT, -- JSON: [{description, input}, ...]

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE,
  UNIQUE(server_id, tool_name)
);

CREATE INDEX IF NOT EXISTS idx_tools_server ON tools(server_id);
CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(tool_name);
CREATE INDEX IF NOT EXISTS idx_tools_auth ON tools(requires_auth);

-- ============================================================================
-- RESOURCES TABLE (server-provided resources)
-- ============================================================================
CREATE TABLE resources (
  resource_id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,

  uri_template TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  mime_type TEXT,

  -- Access control
  requires_auth INTEGER NOT NULL DEFAULT 0 CHECK (requires_auth IN (0, 1)),
  access_level TEXT, -- public, private, public_and_private

  -- Examples (JSON array)
  examples TEXT, -- JSON array of example URIs

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resources_server ON resources(server_id);
CREATE INDEX IF NOT EXISTS idx_resources_auth ON resources(requires_auth);

-- ============================================================================
-- PROMPTS TABLE (server-provided prompts)
-- ============================================================================
CREATE TABLE prompts (
  prompt_id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,

  prompt_name TEXT NOT NULL,
  display_name TEXT,
  description TEXT NOT NULL,

  -- Arguments schema (JSON)
  arguments_schema TEXT, -- JSON array of argument definitions

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE,
  UNIQUE(server_id, prompt_name)
);

CREATE INDEX IF NOT EXISTS idx_prompts_server ON prompts(server_id);
CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts(prompt_name);
