/**
 * MCP Lookup Service
 * Handles domain-based lookup of MCP servers
 */

import * as db from '../infra/db.js';
import type {
  LookupQuery,
  LookupResponse,
  ServerMatch,
  ConfigurationSummary,
} from '../types/lookup.js';

// Simple in-memory cache
interface CacheEntry {
  data: LookupResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}

// Run cache cleanup every 5 minutes
// eslint-disable-next-line no-undef
setInterval(clearExpiredCache, 5 * 60 * 1000);

/**
 * Generate cache key from query parameters
 */
function getCacheKey(query: LookupQuery): string {
  return `${query.domain}:${query.trust_levels.sort().join(',')}:${query.deployment_types.sort().join(',')}:${query.max_results}:${query.include_categories}`;
}

/**
 * Main lookup function
 */
export async function lookupServers(query: LookupQuery): Promise<LookupResponse> {
  const startTime = Date.now();

  // Check cache
  const cacheKey = getCacheKey(query);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.data,
      match_metadata: {
        ...cached.data.match_metadata,
        cache_hit: true,
        search_time_ms: Date.now() - startTime,
      },
    };
  }

  // Stage 1: Exact domain match
  let matches = await findExactDomainMatches(query);

  // Stage 2: Wildcard pattern match (if not enough results)
  if (matches.length < query.max_results) {
    const wildcardMatches = await findWildcardMatches(query, matches.length);
    matches = [...matches, ...wildcardMatches];
  }

  // Stage 3: Category match (if enabled and not enough results)
  if (query.include_categories && matches.length < query.max_results) {
    const categoryMatches = await findCategoryMatches(query, matches.length);
    matches = [...matches, ...categoryMatches];
  }

  // Limit results
  matches = matches.slice(0, query.max_results);

  // Build response
  const searchTimeMs = Date.now() - startTime;
  const response: LookupResponse = {
    domain: query.domain,
    match_metadata: {
      match_count: matches.length,
      search_time_ms: searchTimeMs,
      cache_hit: false,
    },
    matches,
  };

  // Cache the response
  cache.set(cacheKey, {
    data: response,
    timestamp: Date.now(),
  });

  return response;
}

/**
 * Find exact domain matches
 */
async function findExactDomainMatches(query: LookupQuery): Promise<ServerMatch[]> {
  const sql = `
    SELECT
      s.server_id,
      s.name,
      s.description,
      s.version,
      s.deployment_type,
      s.trust_level,
      s.popularity_score,
      s.install_count,
      s.last_updated,
      s.categories,
      dm.priority,
      dm.auto_suggest
    FROM servers s
    JOIN domain_mappings dm ON s.server_id = dm.server_id
    WHERE
      dm.domain_pattern = ?
      AND dm.match_type = 'exact'
      AND s.trust_level IN (${query.trust_levels.map(() => '?').join(',')})
      AND s.deployment_type IN (${query.deployment_types.map(() => '?').join(',')})
    ORDER BY
      dm.priority ASC,
      s.popularity_score DESC
  `;

  const params = [query.domain, ...query.trust_levels, ...query.deployment_types];
  const rows = db.queryAll(sql, params) as Array<{
    server_id: string;
    name: string;
    description: string;
    version: string;
    deployment_type: string;
    trust_level: string;
    popularity_score: number;
    install_count: number;
    last_updated: string;
    categories: string;
    priority: number;
    auto_suggest: number;
  }>;

  const matches: ServerMatch[] = [];
  for (const row of rows) {
    const serverMatch = await buildServerMatch(row, 'exact', 100);
    matches.push(serverMatch);
  }

  return matches;
}

/**
 * Find wildcard pattern matches
 */
async function findWildcardMatches(
  query: LookupQuery,
  currentCount: number,
): Promise<ServerMatch[]> {
  const limit = query.max_results - currentCount;
  if (limit <= 0) return [];

  // Find wildcard patterns that match the domain
  const sql = `
    SELECT
      s.server_id,
      s.name,
      s.description,
      s.version,
      s.deployment_type,
      s.trust_level,
      s.popularity_score,
      s.install_count,
      s.last_updated,
      s.categories,
      dm.priority,
      dm.auto_suggest,
      dm.domain_pattern
    FROM servers s
    JOIN domain_mappings dm ON s.server_id = dm.server_id
    WHERE
      dm.match_type = 'wildcard'
      AND s.trust_level IN (${query.trust_levels.map(() => '?').join(',')})
      AND s.deployment_type IN (${query.deployment_types.map(() => '?').join(',')})
    ORDER BY
      dm.priority ASC,
      s.popularity_score DESC
    LIMIT ?
  `;

  const params = [...query.trust_levels, ...query.deployment_types, limit];
  const rows = db.queryAll(sql, params) as Array<{
    server_id: string;
    name: string;
    description: string;
    version: string;
    deployment_type: string;
    trust_level: string;
    popularity_score: number;
    install_count: number;
    last_updated: string;
    categories: string;
    priority: number;
    auto_suggest: number;
    domain_pattern: string;
  }>;

  const matches: ServerMatch[] = [];
  for (const row of rows) {
    // Check if wildcard pattern matches the domain
    if (matchesWildcard(query.domain, row.domain_pattern)) {
      // Calculate confidence based on pattern specificity
      const confidence = calculateWildcardConfidence(query.domain, row.domain_pattern);
      const serverMatch = await buildServerMatch(row, 'wildcard', confidence);
      matches.push(serverMatch);
    }
  }

  return matches;
}

/**
 * Find category-based matches
 */
async function findCategoryMatches(
  query: LookupQuery,
  currentCount: number,
): Promise<ServerMatch[]> {
  const limit = query.max_results - currentCount;
  if (limit <= 0) return [];

  // For MVP, we'll skip this and return empty array
  // In production, you'd have a domain_categories table
  return [];
}

/**
 * Check if a domain matches a wildcard pattern
 */
function matchesWildcard(domain: string, pattern: string): boolean {
  // Convert wildcard pattern to regex
  // e.g., "*.github.com" -> "^.*\.github\.com$"
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/^/, '^')
    .replace(/$/, '$');

  const regex = new RegExp(regexPattern);
  return regex.test(domain);
}

/**
 * Calculate confidence score for wildcard match
 */
function calculateWildcardConfidence(domain: string, pattern: string): number {
  // More specific patterns get higher confidence
  const patternParts = pattern.split('.');
  const domainParts = domain.split('.');

  // If pattern has more specific parts, it's more confident
  const specificParts = patternParts.filter((p) => p !== '*').length;
  const totalParts = domainParts.length;

  // Base confidence for wildcard is 70, adjusted by specificity
  const specificityRatio = specificParts / totalParts;
  return Math.round(70 + specificityRatio * 20);
}

/**
 * Build a complete ServerMatch object
 */
async function buildServerMatch(
  serverRow: {
    server_id: string;
    name: string;
    description: string;
    version: string;
    deployment_type: string;
    trust_level: string;
    popularity_score: number;
    install_count: number;
    last_updated: string;
    categories: string;
    priority: number;
    auto_suggest: number;
  },
  matchType: 'exact' | 'wildcard' | 'category',
  confidence: number,
): Promise<ServerMatch> {
  // Get configurations
  const configs = await getConfigurationSummary(serverRow.server_id);

  // Get authentication info
  const authInfo = await getAuthenticationSummary(serverRow.server_id);

  // Get tools info
  const toolsInfo = await getToolsSummary(serverRow.server_id);

  // Get prerequisites
  const prereqInfo = await getPrerequisitesSummary(serverRow.server_id);

  // Check if resources are available
  const resourcesAvailable = await hasResources(serverRow.server_id);

  return {
    server_id: serverRow.server_id,
    name: serverRow.name,
    description: serverRow.description,
    version: serverRow.version,
    deployment_type: serverRow.deployment_type as 'local' | 'remote' | 'hybrid',
    match_type: matchType,
    match_confidence: confidence,
    priority: serverRow.priority,
    auto_suggest: serverRow.auto_suggest === 1,
    installation_complexity: prereqInfo.complexity,
    estimated_setup_minutes: prereqInfo.estimatedMinutes,
    requires_restart: prereqInfo.requiresRestart,
    prerequisites_summary: prereqInfo.summary,
    auth_required: authInfo.required,
    auth_type: authInfo.authType,
    oauth_ready: authInfo.oauthReady,
    auth_methods: authInfo.methods,
    configurations: configs,
    tools_count: toolsInfo.count,
    top_tools: toolsInfo.topTools,
    resources_available: resourcesAvailable,
    trust_level: serverRow.trust_level as 'verified' | 'community' | 'unverified',
    popularity_score: serverRow.popularity_score,
    install_count: serverRow.install_count,
    last_updated: serverRow.last_updated,
  };
}

/**
 * Get configuration summary for a server
 */
async function getConfigurationSummary(serverId: string): Promise<ConfigurationSummary[]> {
  const sql = `
    SELECT
      config_id,
      runtime,
      transport,
      installation_type
    FROM configurations
    WHERE server_id = ?
    ORDER BY priority ASC
  `;

  const rows = db.queryAll(sql, [serverId]) as Array<{
    config_id: string;
    runtime: string | null;
    transport: string;
    installation_type: string | null;
  }>;

  return rows.map((row) => ({
    config_id: row.config_id,
    runtime: row.runtime || undefined,
    transport: row.transport,
    quick_install: row.installation_type === 'npm' || row.installation_type === 'pip',
  }));
}

/**
 * Get authentication summary for a server
 */
async function getAuthenticationSummary(serverId: string): Promise<{
  required: boolean;
  authType?: string;
  oauthReady: boolean;
  methods: string[];
}> {
  const sql = `
    SELECT
      auth_type,
      required,
      config_data
    FROM authentication_configs
    WHERE server_id = ?
    ORDER BY priority ASC
  `;

  const rows = db.queryAll(sql, [serverId]) as Array<{
    auth_type: string;
    required: number;
    config_data: string;
  }>;

  if (rows.length === 0) {
    return {
      required: false,
      oauthReady: false,
      methods: [],
    };
  }

  const primaryAuth = rows[0];
  const allMethods = rows.map((r) => r.auth_type);

  return {
    required: primaryAuth.required === 1,
    authType: primaryAuth.auth_type,
    oauthReady: allMethods.includes('oauth2'),
    methods: allMethods,
  };
}

/**
 * Get tools summary for a server
 */
async function getToolsSummary(serverId: string): Promise<{
  count: number;
  topTools: string[];
}> {
  const sql = `
    SELECT
      tool_name,
      display_name
    FROM tools
    WHERE server_id = ?
    LIMIT 5
  `;

  const rows = db.queryAll(sql, [serverId]) as Array<{
    tool_name: string;
    display_name: string | null;
  }>;

  return {
    count: rows.length,
    topTools: rows.map((r) => r.display_name || r.tool_name),
  };
}

/**
 * Get prerequisites summary for a server
 */
async function getPrerequisitesSummary(serverId: string): Promise<{
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedMinutes: number;
  requiresRestart: boolean;
  summary?: string;
}> {
  const sql = `
    SELECT
      prerequisite_type,
      name,
      version
    FROM installation_prerequisites
    WHERE server_id = ?
  `;

  const rows = db.queryAll(sql, [serverId]) as Array<{
    prerequisite_type: string;
    name: string;
    version: string | null;
  }>;

  if (rows.length === 0) {
    return {
      complexity: 'simple',
      estimatedMinutes: 5,
      requiresRestart: false,
    };
  }

  // Determine complexity based on number and type of prerequisites
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (rows.length > 3) {
    complexity = 'complex';
  } else if (rows.length > 1) {
    complexity = 'moderate';
  }

  // Estimate setup time
  const estimatedMinutes = Math.min(rows.length * 5, 30);

  // Check if restart is needed (e.g., if runtime prerequisite)
  const requiresRestart = rows.some((r) => r.prerequisite_type === 'runtime');

  // Create summary
  const summary = rows.map((r) => `${r.name}${r.version ? ` ${r.version}` : ''}`).join(', ');

  return {
    complexity,
    estimatedMinutes,
    requiresRestart,
    summary: summary || undefined,
  };
}

/**
 * Check if server has resources
 */
async function hasResources(serverId: string): Promise<boolean> {
  const sql = `
    SELECT COUNT(*) as count
    FROM resources
    WHERE server_id = ?
  `;

  const result = db.query(sql, [serverId]) as { count: number };
  return result.count > 0;
}

/**
 * Clear the entire cache (useful for testing)
 */
export function clearCache() {
  cache.clear();
}
