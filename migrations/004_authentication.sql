-- Authentication Configuration
-- Migration 004: OAuth providers and authentication methods

-- ============================================================================
-- OAUTH PROVIDERS TABLE (reusable OAuth provider configurations)
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
-- AUTHENTICATION CONFIGS TABLE (server authentication methods)
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
-- TRIGGERS for updated_at timestamps
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS update_oauth_providers_timestamp
AFTER UPDATE ON oauth_providers
BEGIN
  UPDATE oauth_providers SET updated_at = strftime('%s', 'now') WHERE provider_id = NEW.provider_id;
END;
