/**
 * Type definitions for the MCP Lookup API
 */

import { z } from 'zod';

// ============================================================================
// REQUEST TYPES
// ============================================================================

export const LookupQuerySchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(253, 'Domain must be less than 253 characters')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      'Invalid domain format',
    ),
  include_categories: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
  trust_levels: z
    .string()
    .optional()
    .default('verified,community')
    .transform((val) => {
      if (!val) return ['verified', 'community'];
      return val.split(',').map((s) => s.trim()) as ('verified' | 'community' | 'unverified')[];
    }),
  max_results: z
    .string()
    .optional()
    .default('10')
    .transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1 || num > 50) return 10;
      return num;
    }),
  deployment_types: z
    .string()
    .optional()
    .default('local,remote,hybrid')
    .transform((val) => {
      if (!val) return ['local', 'remote', 'hybrid'];
      return val.split(',').map((s) => s.trim()) as ('local' | 'remote' | 'hybrid')[];
    }),
  user_context: z.string().optional(),
});

export type LookupQuery = z.infer<typeof LookupQuerySchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export type MatchType = 'exact' | 'wildcard' | 'category' | 'ai_suggested';

export interface ServerMatch {
  // Core Identity
  server_id: string;
  name: string;
  description: string;
  version: string;
  deployment_type: 'local' | 'remote' | 'hybrid';

  // Match Context
  match_type: MatchType;
  match_confidence: number; // 0-100
  priority: number;
  auto_suggest: boolean;

  // Installation Requirements (abbreviated)
  installation_complexity: 'simple' | 'moderate' | 'complex';
  estimated_setup_minutes: number;
  requires_restart: boolean;
  prerequisites_summary?: string;

  // Authentication Summary
  auth_required: boolean;
  auth_type?: string;
  oauth_ready: boolean;
  auth_methods: string[];

  // Configuration Preview
  configurations: ConfigurationSummary[];

  // Capabilities Summary
  tools_count: number;
  top_tools: string[];
  resources_available: boolean;

  // Trust & Quality
  trust_level: 'verified' | 'community' | 'unverified';
  popularity_score: number;
  install_count: number;
  last_updated?: string;
}

export interface ConfigurationSummary {
  config_id: string;
  runtime?: string;
  transport: string;
  quick_install: boolean;
}

export interface MatchMetadata {
  match_count: number;
  search_time_ms: number;
  cache_hit: boolean;
}

export interface SimilarDomain {
  domain: string;
  available_servers: string[];
}

export interface CategoryMatch {
  category: string;
  server_id: string;
  confidence: number;
}

export interface AISuggestion {
  server_id: string;
  reason: string;
}

export interface Suggestions {
  similar_domains?: SimilarDomain[];
  category_matches?: CategoryMatch[];
  ai_suggestions?: AISuggestion[];
}

export interface LookupResponse {
  domain: string;
  match_metadata: MatchMetadata;
  matches: ServerMatch[];
  suggestions?: Suggestions;
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  domain?: string;
  suggestions?: Suggestions;
  retry_after?: number;
  limit?: string;
  request_id?: string;
}
