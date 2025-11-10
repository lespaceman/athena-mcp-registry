-- Server Configurations and Environment Variables
-- Migration 003: Runtime-specific server configurations

-- ============================================================================
-- CONFIGURATIONS TABLE (runtime-specific server configurations)
-- ============================================================================
CREATE TABLE configurations (
  config_id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,

  -- Configuration type
  runtime TEXT, -- nodejs, python, deno, bun, binary (for local)
  transport TEXT NOT NULL CHECK (transport IN ('stdio', 'sse', 'http')),
  mode TEXT CHECK (mode IN ('local', 'remote')), -- for hybrid servers

  -- Installation details (JSON for local servers)
  installation_type TEXT, -- npm, pip, binary, docker
  installation_package TEXT,
  installation_version TEXT,
  installation_command TEXT,
  installation_data TEXT, -- JSON for additional install config

  -- Execution details (JSON for local servers)
  execution_command TEXT,
  execution_args TEXT, -- JSON array
  working_directory TEXT,
  timeout_ms INTEGER,
  execution_data TEXT, -- JSON for additional exec config

  -- Connection details (JSON for remote servers)
  connection_base_url TEXT,
  connection_endpoint TEXT,
  connection_method TEXT, -- GET, POST for HTTP
  connection_protocol_version TEXT,
  connection_timeout_ms INTEGER,
  connection_data TEXT, -- JSON for retry configs, etc.

  -- System requirements (JSON)
  system_requirements TEXT, -- JSON: {os, min_memory_mb, network_access, etc}

  -- Metadata
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  recommended_for TEXT, -- JSON array of use cases
  priority INTEGER DEFAULT 0,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_configs_server ON configurations(server_id);
CREATE INDEX IF NOT EXISTS idx_configs_transport ON configurations(transport);
CREATE INDEX IF NOT EXISTS idx_configs_runtime ON configurations(runtime);
CREATE INDEX IF NOT EXISTS idx_configs_default ON configurations(server_id, is_default);

-- ============================================================================
-- ENVIRONMENT VARIABLES TABLE (for configuration env vars)
-- ============================================================================
CREATE TABLE environment_variables (
  env_var_id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,

  name TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0, 1)),
  description TEXT,
  validation_regex TEXT,
  help_url TEXT,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (config_id) REFERENCES configurations(config_id) ON DELETE CASCADE,
  UNIQUE(config_id, name)
);

CREATE INDEX IF NOT EXISTS idx_env_vars_config ON environment_variables(config_id);
