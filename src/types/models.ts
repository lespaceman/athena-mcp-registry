/**
 * TypeScript Type Definitions for Enhanced MCP Server Registry Data Models
 * These types correspond to the database schema and JSON structures
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type DeploymentType = 'local' | 'remote' | 'hybrid';
export type TrustLevel = 'verified' | 'community' | 'unverified';
export type TransportType = 'stdio' | 'sse' | 'http';
export type RuntimeType = 'nodejs' | 'python' | 'deno' | 'bun' | 'binary';
export type InstallationType = 'npm' | 'pip' | 'binary' | 'docker';
export type AuthType = 'none' | 'api_key' | 'oauth2' | 'custom' | 'multiple';
export type MatchType = 'exact' | 'wildcard' | 'regex';
export type OAuth2FlowType =
  | 'authorization_code'
  | 'implicit'
  | 'client_credentials'
  | 'device_code';
export type ClientIdMode = 'shared' | 'user_provided' | 'dynamic';
export type AuthorizationUI = 'popup' | 'redirect' | 'embedded';
export type PrerequisiteType = 'runtime' | 'credential' | 'system' | 'network';

// ============================================================================
// CORE MODELS (Database Tables)
// ============================================================================

export interface Author {
  author_id: string;
  name: string;
  url?: string;
  verified: boolean;
  created_at: number;
  updated_at: number;
}

export interface Server {
  server_id: string;
  name: string;
  description: string;
  version: string;
  author_id?: string;

  // Repository
  repository_type?: string;
  repository_url?: string;
  repository_directory?: string;

  // Deployment and trust
  deployment_type: DeploymentType;
  trust_level: TrustLevel;

  // Categories and tags (stored as JSON in DB)
  categories: string[]; // JSON array in DB
  tags: string[]; // JSON array in DB

  // Popularity
  popularity_score: number;
  install_count: number;

  // Metadata
  created_at: number;
  updated_at: number;
  last_updated?: string; // ISO 8601
}

export interface Configuration {
  config_id: string;
  server_id: string;

  // Configuration type
  runtime?: RuntimeType;
  transport: TransportType;
  mode?: 'local' | 'remote'; // for hybrid servers

  // Installation (local servers)
  installation_type?: InstallationType;
  installation_package?: string;
  installation_version?: string;
  installation_command?: string;
  installation_data?: string; // JSON

  // Execution (local servers)
  execution_command?: string;
  execution_args?: string; // JSON array
  working_directory?: string;
  timeout_ms?: number;
  execution_data?: string; // JSON

  // Connection (remote servers)
  connection_base_url?: string;
  connection_endpoint?: string;
  connection_method?: string;
  connection_protocol_version?: string;
  connection_timeout_ms?: number;
  connection_data?: string; // JSON

  // System requirements
  system_requirements?: string; // JSON

  // Metadata
  is_default: boolean;
  recommended_for?: string; // JSON array
  priority: number;

  created_at: number;
}

export interface EnvironmentVariable {
  env_var_id: string;
  config_id: string;
  name: string;
  required: boolean;
  description?: string;
  validation_regex?: string;
  help_url?: string;
  created_at: number;
}

export interface OAuthProvider {
  provider_id: string;
  provider_name: string;

  // OAuth endpoints
  authorization_url: string;
  token_url: string;
  revocation_url?: string;
  userinfo_url?: string;
  device_code_url?: string;

  // Capabilities
  supports_pkce: boolean;
  supports_refresh: boolean;
  default_flow_type: OAuth2FlowType;

  // Scopes
  supported_scopes?: string; // JSON

  created_at: number;
  updated_at: number;
}

export interface AuthenticationConfig {
  auth_id: string;
  server_id: string;

  auth_type: AuthType;
  priority: number;
  is_default: boolean;
  required: boolean;
  recommended: boolean;

  display_name?: string;
  description?: string;
  reason?: string;

  config_data: string; // JSON - structure varies by auth_type

  created_at: number;
}

export interface DomainMapping {
  mapping_id: string;
  server_id: string;

  domain_pattern: string;
  match_type: MatchType;
  priority: number;

  context_requirements?: string; // JSON
  auto_suggest: boolean;
  auto_install: boolean;
  sub_patterns?: string; // JSON array

  created_at: number;
}

export interface Tool {
  tool_id: string;
  server_id: string;

  tool_name: string;
  display_name?: string;
  description: string;

  input_schema: string; // JSON Schema
  requires_auth: boolean;
  min_auth_scopes?: string; // JSON array

  rate_limit_data?: string; // JSON
  examples?: string; // JSON array

  created_at: number;
}

export interface Resource {
  resource_id: string;
  server_id: string;

  uri_template: string;
  name: string;
  description: string;
  mime_type?: string;

  requires_auth: boolean;
  access_level?: string;
  examples?: string; // JSON array

  created_at: number;
}

export interface Prompt {
  prompt_id: string;
  server_id: string;

  prompt_name: string;
  display_name?: string;
  description: string;

  arguments_schema?: string; // JSON

  created_at: number;
}

export interface Region {
  region_id: string;
  config_id: string;

  region_code: string;
  region_url: string;

  created_at: number;
}

export interface RateLimit {
  rate_limit_id: string;
  config_id: string;

  requests_per_minute?: number;
  requests_per_hour?: number;
  requests_per_day?: number;
  concurrent_connections?: number;
  burst_allowance?: number;

  created_at: number;
}

export interface InstallationPrerequisite {
  prerequisite_id: string;
  server_id: string;

  prerequisite_type: PrerequisiteType;
  name: string;
  version?: string;
  description?: string;

  check_command?: string;
  install_url?: string;

  created_at: number;
}

// ============================================================================
// COMPLEX JSON STRUCTURES (for JSON fields in database)
// ============================================================================

// Repository Information
export interface RepositoryInfo {
  type: string; // github, gitlab, bitbucket
  url: string;
  directory?: string;
}

// System Requirements (for configurations)
export interface SystemRequirements {
  os?: string[]; // ['linux', 'macos', 'windows']
  min_nodejs_version?: string;
  min_python_version?: string;
  min_memory_mb?: number;
  min_disk_mb?: number;
  network_access?: boolean;
  docker_required?: boolean;
}

// Installation Details (local configurations)
export interface InstallationDetails {
  type: InstallationType;
  package: string;
  version?: string;
  global?: boolean;
  install_command: string;
  additional_commands?: string[];
}

// Execution Details (local configurations)
export interface ExecutionDetails {
  command: string;
  args: string[];
  env_variables?: Record<string, EnvVariableConfig>;
  working_directory?: string;
  timeout?: number;
}

export interface EnvVariableConfig {
  required: boolean;
  description?: string;
  validation?: string; // regex
  help_url?: string;
}

// Connection Details (remote configurations)
export interface ConnectionDetails {
  base_url: string;
  endpoint: string;
  protocol_version?: string;
  timeout?: number;
  retry_config?: RetryConfig;
}

export interface RetryConfig {
  max_retries: number;
  backoff_ms: number[];
}

// API Key Authentication Config
export interface ApiKeyAuthConfig {
  method: 'bearer' | 'header' | 'query_param';
  token_location: 'env_variable' | 'header' | 'config_file';
  env_variable_name?: string;
  header_name?: string;
  display_name?: string;
  description?: string;
  scopes_required?: string[];
  validation?: ValidationConfig;
  acquisition?: AcquisitionConfig;
  security?: SecurityConfig;
}

export interface ValidationConfig {
  regex?: string;
  length?: number;
  test_endpoint?: string;
  test_method?: string;
}

export interface AcquisitionConfig {
  instructions_url: string;
  video_tutorial?: string;
  steps: string[];
}

export interface SecurityConfig {
  storage: 'encrypted' | 'plaintext';
  expires?: boolean;
  rotation_recommended_days?: number;
  min_permissions?: string[];
  recommended_permissions?: string[];
}

// OAuth2 Authentication Config
export interface OAuth2AuthConfig {
  flow_type: OAuth2FlowType;
  provider: string;
  provider_id?: string; // reference to oauth_providers table
  endpoints: OAuth2Endpoints;
  client_credentials: ClientCredentials;
  scopes: OAuth2Scopes;
  redirect_config?: RedirectConfig;
  token_management?: TokenManagement;
  user_experience?: UserExperience;
}

export interface OAuth2Endpoints {
  authorization_url: string;
  token_url: string;
  revocation_url?: string;
  userinfo_url?: string;
  device_code_url?: string;
}

export interface ClientCredentials {
  client_id_mode: ClientIdMode;
  shared_client_id?: string;
  client_secret_required?: boolean;
  description?: string;
}

export interface OAuth2Scopes {
  required: string[];
  optional?: string[];
  scope_descriptions?: Record<string, string>;
}

export interface RedirectConfig {
  redirect_uri: string;
  custom_scheme?: string;
  localhost_port?: number;
  state_parameter?: boolean;
  pkce_required?: boolean;
}

export interface TokenManagement {
  storage_location: string;
  access_token_lifetime?: number;
  refresh_token_lifetime?: number;
  auto_refresh?: boolean;
  revoke_on_uninstall?: boolean;
}

export interface UserExperience {
  consent_screen?: ConsentScreen;
  authorization_ui?: AuthorizationUI;
  post_auth_message?: string;
}

export interface ConsentScreen {
  title: string;
  description: string;
  privacy_policy?: string;
  terms_of_service?: string;
}

// Multiple Authentication Methods
export interface MultipleAuthMethods {
  default_method: string;
  methods: AuthMethod[];
  selection_criteria?: SelectionCriteria;
}

export interface AuthMethod {
  auth_id: string;
  auth_type: AuthType;
  priority: number;
  recommended: boolean;
  reason?: string;
  configurations: ApiKeyAuthConfig[] | OAuth2AuthConfig[];
}

export interface SelectionCriteria {
  prefer_oauth_if?: string[];
  prefer_api_key_if?: string[];
}

// Domain Context Requirements
export interface ContextRequirements {
  url_patterns?: string[];
  page_indicators?: PageIndicators;
  api_detection?: string;
  description?: string;
}

export interface PageIndicators {
  meta_tags?: string[];
  elements?: string[];
  api_detection?: string;
}

// Sub-patterns for domain mappings
export interface SubPattern {
  pattern: string;
  context: string;
  tools_filter?: string[];
}

// Tool Examples
export interface ToolExample {
  description: string;
  input: Record<string, unknown>;
}

// Rate Limit Data
export interface RateLimitData {
  calls_per_hour?: number;
  calls_per_minute?: number;
  shared_with?: string[];
}

// ============================================================================
// COMPLETE SERVER ENTRY (for API responses)
// ============================================================================

export interface ServerEntry {
  server_id: string;
  name: string;
  description: string;
  version: string;

  author: {
    name: string;
    url?: string;
    verified: boolean;
  };

  repository?: RepositoryInfo;

  deployment_type: DeploymentType;
  configurations: ConfigurationEntry[];

  authentication?: AuthenticationEntry;

  domain_associations?: DomainAssociation[];

  tools?: ToolEntry[];
  resources?: ResourceEntry[];
  prompts?: PromptEntry[];

  category: string[];
  trust_level: TrustLevel;
  tags: string[];
  popularity_score: number;
  install_count: number;
  last_updated: string;
}

export interface ConfigurationEntry {
  config_id: string;
  runtime?: RuntimeType;
  transport: TransportType;
  mode?: 'local' | 'remote';

  // Local configuration
  installation?: InstallationDetails;
  execution?: ExecutionDetails;
  system_requirements?: SystemRequirements;

  // Remote configuration
  connection?: ConnectionDetails;
  regions?: RegionEntry[];
  rate_limits?: RateLimitEntry;
}

export interface RegionEntry {
  region_id: string;
  url: string;
}

export interface RateLimitEntry {
  requests_per_minute?: number;
  concurrent_connections?: number;
  burst_allowance?: number;
}

export interface AuthenticationEntry {
  auth_type: AuthType;
  required: boolean;
  supports_refresh?: boolean;
  configurations?: (ApiKeyAuthConfig | OAuth2AuthConfig)[];
}

export interface DomainAssociation {
  pattern: string;
  match_type: MatchType;
  priority: number;
  context_requirements?: ContextRequirements;
  auto_suggest: boolean;
  auto_install: boolean;
  sub_patterns?: SubPattern[];
}

export interface ToolEntry {
  name: string;
  display_name?: string;
  description: string;
  input_schema: Record<string, unknown>;
  requires_auth: boolean;
  min_auth_scopes?: string[];
  rate_limit?: RateLimitData;
  examples?: ToolExample[];
}

export interface ResourceEntry {
  uri_template: string;
  name: string;
  description: string;
  mime_type?: string;
  requires_auth: boolean;
  access_level?: string;
  examples?: string[];
}

export interface PromptEntry {
  name: string;
  display_name?: string;
  description: string;
  arguments?: ArgumentSchema[];
}

export interface ArgumentSchema {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}
