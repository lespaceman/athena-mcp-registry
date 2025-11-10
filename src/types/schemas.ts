/**
 * Zod Validation Schemas for Enhanced MCP Server Registry
 * These schemas validate incoming data and can infer TypeScript types
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const DeploymentTypeSchema = z.enum(['local', 'remote', 'hybrid']);
export const TrustLevelSchema = z.enum(['verified', 'community', 'unverified']);
export const TransportTypeSchema = z.enum(['stdio', 'sse', 'http']);
export const RuntimeTypeSchema = z.enum(['nodejs', 'python', 'deno', 'bun', 'binary']);
export const InstallationTypeSchema = z.enum(['npm', 'pip', 'binary', 'docker']);
export const AuthTypeSchema = z.enum(['none', 'api_key', 'oauth2', 'custom', 'multiple']);
export const MatchTypeSchema = z.enum(['exact', 'wildcard', 'regex']);
export const OAuth2FlowTypeSchema = z.enum([
  'authorization_code',
  'implicit',
  'client_credentials',
  'device_code',
]);
export const ClientIdModeSchema = z.enum(['shared', 'user_provided', 'dynamic']);
export const AuthorizationUISchema = z.enum(['popup', 'redirect', 'embedded']);
export const PrerequisiteTypeSchema = z.enum(['runtime', 'credential', 'system', 'network']);

// ============================================================================
// DATABASE MODEL SCHEMAS
// ============================================================================

export const AuthorSchema = z.object({
  author_id: z.string(),
  name: z.string().min(1),
  url: z.string().url().optional(),
  verified: z.boolean(),
  created_at: z.number().int(),
  updated_at: z.number().int(),
});

export const ServerSchema = z.object({
  server_id: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string(),
  author_id: z.string().optional(),

  // Repository
  repository_type: z.string().optional(),
  repository_url: z.string().url().optional(),
  repository_directory: z.string().optional(),

  // Deployment and trust
  deployment_type: DeploymentTypeSchema,
  trust_level: TrustLevelSchema,

  // Categories and tags
  categories: z.array(z.string()),
  tags: z.array(z.string()),

  // Popularity
  popularity_score: z.number().int().min(0).default(0),
  install_count: z.number().int().min(0).default(0),

  // Metadata
  created_at: z.number().int(),
  updated_at: z.number().int(),
  last_updated: z.string().datetime().optional(),
});

export const ConfigurationSchema = z.object({
  config_id: z.string(),
  server_id: z.string(),

  runtime: RuntimeTypeSchema.optional(),
  transport: TransportTypeSchema,
  mode: z.enum(['local', 'remote']).optional(),

  // Installation
  installation_type: InstallationTypeSchema.optional(),
  installation_package: z.string().optional(),
  installation_version: z.string().optional(),
  installation_command: z.string().optional(),
  installation_data: z.string().optional(), // JSON

  // Execution
  execution_command: z.string().optional(),
  execution_args: z.string().optional(), // JSON array
  working_directory: z.string().optional(),
  timeout_ms: z.number().int().positive().optional(),
  execution_data: z.string().optional(), // JSON

  // Connection
  connection_base_url: z.string().url().optional(),
  connection_endpoint: z.string().optional(),
  connection_method: z.string().optional(),
  connection_protocol_version: z.string().optional(),
  connection_timeout_ms: z.number().int().positive().optional(),
  connection_data: z.string().optional(), // JSON

  // System requirements
  system_requirements: z.string().optional(), // JSON

  // Metadata
  is_default: z.boolean().default(false),
  recommended_for: z.string().optional(), // JSON array
  priority: z.number().int().default(0),

  created_at: z.number().int(),
});

export const EnvironmentVariableSchema = z.object({
  env_var_id: z.string(),
  config_id: z.string(),
  name: z.string().min(1),
  required: z.boolean().default(true),
  description: z.string().optional(),
  validation_regex: z.string().optional(),
  help_url: z.string().url().optional(),
  created_at: z.number().int(),
});

export const OAuthProviderSchema = z.object({
  provider_id: z.string(),
  provider_name: z.string().min(1),

  authorization_url: z.string().url(),
  token_url: z.string().url(),
  revocation_url: z.string().url().optional(),
  userinfo_url: z.string().url().optional(),
  device_code_url: z.string().url().optional(),

  supports_pkce: z.boolean().default(false),
  supports_refresh: z.boolean().default(true),
  default_flow_type: OAuth2FlowTypeSchema.default('authorization_code'),

  supported_scopes: z.string().optional(), // JSON

  created_at: z.number().int(),
  updated_at: z.number().int(),
});

export const AuthenticationConfigSchema = z.object({
  auth_id: z.string(),
  server_id: z.string(),

  auth_type: AuthTypeSchema,
  priority: z.number().int().default(1),
  is_default: z.boolean().default(false),
  required: z.boolean().default(true),
  recommended: z.boolean().default(true),

  display_name: z.string().optional(),
  description: z.string().optional(),
  reason: z.string().optional(),

  config_data: z.string(), // JSON

  created_at: z.number().int(),
});

export const DomainMappingSchema = z.object({
  mapping_id: z.string(),
  server_id: z.string(),

  domain_pattern: z.string().min(1),
  match_type: MatchTypeSchema,
  priority: z.number().int().default(1),

  context_requirements: z.string().optional(), // JSON
  auto_suggest: z.boolean().default(true),
  auto_install: z.boolean().default(false),
  sub_patterns: z.string().optional(), // JSON array

  created_at: z.number().int(),
});

export const ToolSchema = z.object({
  tool_id: z.string(),
  server_id: z.string(),

  tool_name: z.string().min(1),
  display_name: z.string().optional(),
  description: z.string().min(1),

  input_schema: z.string(), // JSON Schema
  requires_auth: z.boolean().default(false),
  min_auth_scopes: z.string().optional(), // JSON array

  rate_limit_data: z.string().optional(), // JSON
  examples: z.string().optional(), // JSON array

  created_at: z.number().int(),
});

export const ResourceSchema = z.object({
  resource_id: z.string(),
  server_id: z.string(),

  uri_template: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  mime_type: z.string().optional(),

  requires_auth: z.boolean().default(false),
  access_level: z.string().optional(),
  examples: z.string().optional(), // JSON array

  created_at: z.number().int(),
});

export const PromptSchema = z.object({
  prompt_id: z.string(),
  server_id: z.string(),

  prompt_name: z.string().min(1),
  display_name: z.string().optional(),
  description: z.string().min(1),

  arguments_schema: z.string().optional(), // JSON

  created_at: z.number().int(),
});

export const RegionSchema = z.object({
  region_id: z.string(),
  config_id: z.string(),
  region_code: z.string().min(1),
  region_url: z.string().url(),
  created_at: z.number().int(),
});

export const RateLimitSchema = z.object({
  rate_limit_id: z.string(),
  config_id: z.string(),
  requests_per_minute: z.number().int().positive().optional(),
  requests_per_hour: z.number().int().positive().optional(),
  requests_per_day: z.number().int().positive().optional(),
  concurrent_connections: z.number().int().positive().optional(),
  burst_allowance: z.number().int().positive().optional(),
  created_at: z.number().int(),
});

export const InstallationPrerequisiteSchema = z.object({
  prerequisite_id: z.string(),
  server_id: z.string(),
  prerequisite_type: PrerequisiteTypeSchema,
  name: z.string().min(1),
  version: z.string().optional(),
  description: z.string().optional(),
  check_command: z.string().optional(),
  install_url: z.string().url().optional(),
  created_at: z.number().int(),
});

// ============================================================================
// COMPLEX JSON STRUCTURE SCHEMAS
// ============================================================================

export const RepositoryInfoSchema = z.object({
  type: z.string(),
  url: z.string().url(),
  directory: z.string().optional(),
});

export const SystemRequirementsSchema = z.object({
  os: z.array(z.string()).optional(),
  min_nodejs_version: z.string().optional(),
  min_python_version: z.string().optional(),
  min_memory_mb: z.number().int().positive().optional(),
  min_disk_mb: z.number().int().positive().optional(),
  network_access: z.boolean().optional(),
  docker_required: z.boolean().optional(),
});

export const EnvVariableConfigSchema = z.object({
  required: z.boolean(),
  description: z.string().optional(),
  validation: z.string().optional(),
  help_url: z.string().url().optional(),
});

export const InstallationDetailsSchema = z.object({
  type: InstallationTypeSchema,
  package: z.string(),
  version: z.string().optional(),
  global: z.boolean().optional(),
  install_command: z.string(),
  additional_commands: z.array(z.string()).optional(),
});

export const ExecutionDetailsSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
  env_variables: z.record(z.string(), EnvVariableConfigSchema).optional(),
  working_directory: z.string().optional(),
  timeout: z.number().int().positive().optional(),
});

export const RetryConfigSchema = z.object({
  max_retries: z.number().int().min(0),
  backoff_ms: z.array(z.number().int().positive()),
});

export const ConnectionDetailsSchema = z.object({
  base_url: z.string().url(),
  endpoint: z.string(),
  protocol_version: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  retry_config: RetryConfigSchema.optional(),
});

export const ValidationConfigSchema = z.object({
  regex: z.string().optional(),
  length: z.number().int().positive().optional(),
  test_endpoint: z.string().url().optional(),
  test_method: z.string().optional(),
});

export const AcquisitionConfigSchema = z.object({
  instructions_url: z.string().url(),
  video_tutorial: z.string().url().optional(),
  steps: z.array(z.string()),
});

export const SecurityConfigSchema = z.object({
  storage: z.enum(['encrypted', 'plaintext']),
  expires: z.boolean().optional(),
  rotation_recommended_days: z.number().int().positive().optional(),
  min_permissions: z.array(z.string()).optional(),
  recommended_permissions: z.array(z.string()).optional(),
});

export const ApiKeyAuthConfigSchema = z.object({
  method: z.enum(['bearer', 'header', 'query_param']),
  token_location: z.enum(['env_variable', 'header', 'config_file']),
  env_variable_name: z.string().optional(),
  header_name: z.string().optional(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  scopes_required: z.array(z.string()).optional(),
  validation: ValidationConfigSchema.optional(),
  acquisition: AcquisitionConfigSchema.optional(),
  security: SecurityConfigSchema.optional(),
});

export const OAuth2EndpointsSchema = z.object({
  authorization_url: z.string().url(),
  token_url: z.string().url(),
  revocation_url: z.string().url().optional(),
  userinfo_url: z.string().url().optional(),
  device_code_url: z.string().url().optional(),
});

export const ClientCredentialsSchema = z.object({
  client_id_mode: ClientIdModeSchema,
  shared_client_id: z.string().optional(),
  client_secret_required: z.boolean().optional(),
  description: z.string().optional(),
});

export const OAuth2ScopesSchema = z.object({
  required: z.array(z.string()),
  optional: z.array(z.string()).optional(),
  scope_descriptions: z.record(z.string(), z.string()).optional(),
});

export const RedirectConfigSchema = z.object({
  redirect_uri: z.string().url(),
  custom_scheme: z.string().optional(),
  localhost_port: z.number().int().positive().optional(),
  state_parameter: z.boolean().optional(),
  pkce_required: z.boolean().optional(),
});

export const TokenManagementSchema = z.object({
  storage_location: z.string(),
  access_token_lifetime: z.number().int().positive().optional(),
  refresh_token_lifetime: z.number().int().positive().optional(),
  auto_refresh: z.boolean().optional(),
  revoke_on_uninstall: z.boolean().optional(),
});

export const ConsentScreenSchema = z.object({
  title: z.string(),
  description: z.string(),
  privacy_policy: z.string().url().optional(),
  terms_of_service: z.string().url().optional(),
});

export const UserExperienceSchema = z.object({
  consent_screen: ConsentScreenSchema.optional(),
  authorization_ui: AuthorizationUISchema.optional(),
  post_auth_message: z.string().optional(),
});

export const OAuth2AuthConfigSchema = z.object({
  flow_type: OAuth2FlowTypeSchema,
  provider: z.string(),
  provider_id: z.string().optional(),
  endpoints: OAuth2EndpointsSchema,
  client_credentials: ClientCredentialsSchema,
  scopes: OAuth2ScopesSchema,
  redirect_config: RedirectConfigSchema.optional(),
  token_management: TokenManagementSchema.optional(),
  user_experience: UserExperienceSchema.optional(),
});

export const PageIndicatorsSchema = z.object({
  meta_tags: z.array(z.string()).optional(),
  elements: z.array(z.string()).optional(),
  api_detection: z.string().optional(),
});

export const ContextRequirementsSchema = z.object({
  url_patterns: z.array(z.string()).optional(),
  page_indicators: PageIndicatorsSchema.optional(),
  api_detection: z.string().optional(),
  description: z.string().optional(),
});

export const SubPatternSchema = z.object({
  pattern: z.string(),
  context: z.string(),
  tools_filter: z.array(z.string()).optional(),
});

export const ToolExampleSchema = z.object({
  description: z.string(),
  input: z.record(z.string(), z.unknown()),
});

export const RateLimitDataSchema = z.object({
  calls_per_hour: z.number().int().positive().optional(),
  calls_per_minute: z.number().int().positive().optional(),
  shared_with: z.array(z.string()).optional(),
});

// ============================================================================
// API ENTRY SCHEMAS (for complete server entries)
// ============================================================================

export const RegionEntrySchema = z.object({
  region_id: z.string(),
  url: z.string().url(),
});

export const RateLimitEntrySchema = z.object({
  requests_per_minute: z.number().int().positive().optional(),
  concurrent_connections: z.number().int().positive().optional(),
  burst_allowance: z.number().int().positive().optional(),
});

export const ConfigurationEntrySchema = z.object({
  config_id: z.string(),
  runtime: RuntimeTypeSchema.optional(),
  transport: TransportTypeSchema,
  mode: z.enum(['local', 'remote']).optional(),

  installation: InstallationDetailsSchema.optional(),
  execution: ExecutionDetailsSchema.optional(),
  system_requirements: SystemRequirementsSchema.optional(),

  connection: ConnectionDetailsSchema.optional(),
  regions: z.array(RegionEntrySchema).optional(),
  rate_limits: RateLimitEntrySchema.optional(),
});

export const AuthenticationEntrySchema = z.object({
  auth_type: AuthTypeSchema,
  required: z.boolean(),
  supports_refresh: z.boolean().optional(),
  configurations: z.array(z.union([ApiKeyAuthConfigSchema, OAuth2AuthConfigSchema])).optional(),
});

export const DomainAssociationSchema = z.object({
  pattern: z.string(),
  match_type: MatchTypeSchema,
  priority: z.number().int(),
  context_requirements: ContextRequirementsSchema.optional(),
  auto_suggest: z.boolean(),
  auto_install: z.boolean(),
  sub_patterns: z.array(SubPatternSchema).optional(),
});

export const ToolEntrySchema = z.object({
  name: z.string(),
  display_name: z.string().optional(),
  description: z.string(),
  input_schema: z.record(z.string(), z.unknown()),
  requires_auth: z.boolean(),
  min_auth_scopes: z.array(z.string()).optional(),
  rate_limit: RateLimitDataSchema.optional(),
  examples: z.array(ToolExampleSchema).optional(),
});

export const ResourceEntrySchema = z.object({
  uri_template: z.string(),
  name: z.string(),
  description: z.string(),
  mime_type: z.string().optional(),
  requires_auth: z.boolean(),
  access_level: z.string().optional(),
  examples: z.array(z.string()).optional(),
});

export const ArgumentSchemaSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
});

export const PromptEntrySchema = z.object({
  name: z.string(),
  display_name: z.string().optional(),
  description: z.string(),
  arguments: z.array(ArgumentSchemaSchema).optional(),
});

export const ServerEntrySchema = z.object({
  server_id: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string(),

  author: z.object({
    name: z.string(),
    url: z.string().url().optional(),
    verified: z.boolean(),
  }),

  repository: RepositoryInfoSchema.optional(),

  deployment_type: DeploymentTypeSchema,
  configurations: z.array(ConfigurationEntrySchema),

  authentication: AuthenticationEntrySchema.optional(),

  domain_associations: z.array(DomainAssociationSchema).optional(),

  tools: z.array(ToolEntrySchema).optional(),
  resources: z.array(ResourceEntrySchema).optional(),
  prompts: z.array(PromptEntrySchema).optional(),

  category: z.array(z.string()),
  trust_level: TrustLevelSchema,
  tags: z.array(z.string()),
  popularity_score: z.number().int().min(0),
  install_count: z.number().int().min(0),
  last_updated: z.string().datetime(),
});

// ============================================================================
// INPUT SCHEMAS (for creating/updating records)
// ============================================================================

export const CreateServerInputSchema = ServerSchema.omit({
  created_at: true,
  updated_at: true,
}).partial({
  popularity_score: true,
  install_count: true,
  categories: true,
  tags: true,
});

export const UpdateServerInputSchema = CreateServerInputSchema.partial();

export const CreateConfigurationInputSchema = ConfigurationSchema.omit({
  created_at: true,
}).partial({
  is_default: true,
  priority: true,
});

export const CreateAuthenticationConfigInputSchema = AuthenticationConfigSchema.omit({
  created_at: true,
}).partial({
  priority: true,
  is_default: true,
  required: true,
  recommended: true,
});

export const CreateDomainMappingInputSchema = DomainMappingSchema.omit({
  created_at: true,
}).partial({
  priority: true,
  auto_suggest: true,
  auto_install: true,
});

export const CreateToolInputSchema = ToolSchema.omit({
  created_at: true,
}).partial({
  requires_auth: true,
});

export const CreateResourceInputSchema = ResourceSchema.omit({
  created_at: true,
}).partial({
  requires_auth: true,
});

export const CreatePromptInputSchema = PromptSchema.omit({
  created_at: true,
});

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const ServerQueryParamsSchema = z.object({
  deployment_type: DeploymentTypeSchema.optional(),
  trust_level: TrustLevelSchema.optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  author_id: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['popularity', 'install_count', 'updated_at', 'name']).default('popularity'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const DomainLookupParamsSchema = z.object({
  domain: z.string().min(1),
  url: z.string().url().optional(),
});
