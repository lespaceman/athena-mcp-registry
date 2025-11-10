-- Enhanced MCP Server Registry Schema
-- Migration 002: Complete data model for deployment types, authentication, and domain associations

-- ============================================================================
-- 1. AUTHORS TABLE (for server publishers)
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
-- 2. SERVERS TABLE (enhanced with new fields)
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
-- 3. CONFIGURATIONS TABLE (runtime-specific server configurations)
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
-- 4. ENVIRONMENT VARIABLES TABLE (for configuration env vars)
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

-- ============================================================================
-- 5. OAUTH PROVIDERS TABLE (reusable OAuth provider configurations)
-- ============================================================================
CREATE TABLE oauth_providers (
  provider_id TEXT PRIMARY KEY,
  provider_name TEXT NOT NULL UNIQUE, -- google, github, microsoft, etc.

  -- OAuth endpoints
  authorization_url TEXT NOT NULL,
  token_url TEXT NOT NULL,
  revocation_url TEXT,
  userinfo_url TEXT,
  device_code_url TEXT, -- for device code flow

  -- Provider capabilities
  supports_pkce INTEGER NOT NULL DEFAULT 0 CHECK (supports_pkce IN (0, 1)),
  supports_refresh INTEGER NOT NULL DEFAULT 1 CHECK (supports_refresh IN (0, 1)),
  default_flow_type TEXT DEFAULT 'authorization_code', -- authorization_code, device_code, client_credentials

  -- Common scopes (JSON)
  supported_scopes TEXT, -- JSON object with scope descriptions

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_oauth_provider_name ON oauth_providers(provider_name);

-- ============================================================================
-- 6. AUTHENTICATION CONFIGS TABLE (server authentication methods)
-- ============================================================================
CREATE TABLE authentication_configs (
  auth_id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,

  -- Auth type and priority
  auth_type TEXT NOT NULL CHECK (auth_type IN ('none', 'api_key', 'oauth2', 'custom', 'multiple')),
  priority INTEGER DEFAULT 1,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0, 1)),
  recommended INTEGER NOT NULL DEFAULT 1 CHECK (recommended IN (0, 1)),

  -- Display info
  display_name TEXT,
  description TEXT,
  reason TEXT, -- why this auth method is recommended/not recommended

  -- Auth configuration data (JSON - structure varies by auth_type)
  -- For api_key: {method, token_location, env_variable_name, validation, acquisition, security}
  -- For oauth2: {flow_type, provider_id, endpoints, scopes, client_credentials, redirect_config, etc}
  config_data TEXT NOT NULL DEFAULT '{}',

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_configs_server ON authentication_configs(server_id);
CREATE INDEX IF NOT EXISTS idx_auth_configs_type ON authentication_configs(auth_type);
CREATE INDEX IF NOT EXISTS idx_auth_configs_priority ON authentication_configs(server_id, priority);

-- ============================================================================
-- 7. DOMAIN MAPPINGS TABLE (domain associations for servers)
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

-- ============================================================================
-- 8. TOOLS TABLE (server-provided tools)
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
-- 9. RESOURCES TABLE (server-provided resources)
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
-- 10. PROMPTS TABLE (server-provided prompts)
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

-- ============================================================================
-- 11. REGIONS TABLE (for remote server geographic distribution)
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
-- 12. RATE LIMITS TABLE (for remote server rate limiting)
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

-- ============================================================================
-- 13. INSTALLATION PREREQUISITES TABLE
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

-- ============================================================================
-- TRIGGERS for updated_at timestamps
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS update_servers_timestamp
AFTER UPDATE ON servers
BEGIN
  UPDATE servers SET updated_at = strftime('%s', 'now') WHERE server_id = NEW.server_id;
END;

CREATE TRIGGER IF NOT EXISTS update_authors_timestamp
AFTER UPDATE ON authors
BEGIN
  UPDATE authors SET updated_at = strftime('%s', 'now') WHERE author_id = NEW.author_id;
END;

CREATE TRIGGER IF NOT EXISTS update_oauth_providers_timestamp
AFTER UPDATE ON oauth_providers
BEGIN
  UPDATE oauth_providers SET updated_at = strftime('%s', 'now') WHERE provider_id = NEW.provider_id;
END;
