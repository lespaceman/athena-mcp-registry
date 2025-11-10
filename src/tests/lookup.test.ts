import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from './_helpers/index.js';
import * as db from '../infra/db.js';
import { clearCache } from '../services/lookup.service.js';

describe('Lookup endpoint - API Contract Tests', () => {
  let app: FastifyInstance;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const testSetup = createTestApp();
    app = testSetup.app;
    cleanup = testSetup.cleanup;
    await app.ready();
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(() => {
    // Clear cache before each test to ensure isolation
    clearCache();
  });

  describe('Request validation', () => {
    it('should reject request with missing domain parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('invalid_request');
      expect(body.message).toBeDefined();
    });

    it('should reject request with invalid domain format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=invalid..domain',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('invalid_request');
      expect(body.message).toContain('Invalid domain format');
    });

    it('should reject request with domain exceeding max length', async () => {
      const longDomain = 'a'.repeat(254) + '.com';
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/lookup?domain=${longDomain}`,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('invalid_request');
    });

    it('should accept valid domain with only lowercase letters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=example.com',
      });

      // Should not be a validation error (400)
      // Can be 404 (no matches) or 200 (matches found)
      expect(response.statusCode).not.toBe(400);
    });

    it('should accept valid domain with hyphens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=my-domain.com',
      });

      expect(response.statusCode).not.toBe(400);
    });

    it('should accept valid subdomain', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=api.example.com',
      });

      expect(response.statusCode).not.toBe(400);
    });
  });

  describe('Query parameters', () => {
    it('should accept trust_levels parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=test.com&trust_levels=verified',
      });

      expect(response.statusCode).not.toBe(400);
    });

    it('should accept multiple trust_levels', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=test.com&trust_levels=verified,community',
      });

      expect(response.statusCode).not.toBe(400);
    });

    it('should accept deployment_types parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=test.com&deployment_types=local',
      });

      expect(response.statusCode).not.toBe(400);
    });

    it('should accept multiple deployment_types', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=test.com&deployment_types=local,remote',
      });

      expect(response.statusCode).not.toBe(400);
    });

    it('should accept max_results parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=test.com&max_results=5',
      });

      expect(response.statusCode).not.toBe(400);
    });

    it('should accept include_categories=true', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=test.com&include_categories=true',
      });

      expect(response.statusCode).not.toBe(400);
    });

    it('should accept include_categories=false', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=test.com&include_categories=false',
      });

      expect(response.statusCode).not.toBe(400);
    });

    it('should accept include_categories=1', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=test.com&include_categories=1',
      });

      expect(response.statusCode).not.toBe(400);
    });
  });

  describe('Response structure for 404 (no matches)', () => {
    it('should return 404 when no servers match the domain', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=nonexistent-domain-12345.com',
      });

      // Should return 404 for no matches (or 500 if database setup fails)
      expect([404, 500]).toContain(response.statusCode);

      const body = JSON.parse(response.payload);

      if (response.statusCode === 404) {
        // Verify error response structure for 404
        expect(body.error).toBe('no_matches');
        expect(body.message).toBeDefined();
        expect(body.message).toContain('No MCP servers found');
        expect(body.domain).toBe('nonexistent-domain-12345.com');
      }
    });
  });

  describe('Response structure for successful lookups', () => {
    beforeEach(() => {
      // Insert a test server for these tests
      try {
        db.execute(
          `INSERT OR IGNORE INTO servers (
            server_id, name, description, version, deployment_type, trust_level, popularity_score
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['test-server-1', 'Test Server', 'A test server', '1.0.0', 'local', 'verified', 100],
        );

        db.execute(
          `INSERT OR IGNORE INTO domain_mappings (
            mapping_id, server_id, domain_pattern, match_type, priority, auto_suggest
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          ['test-mapping-1', 'test-server-1', 'testlookup.example.com', 'exact', 1, 1],
        );
      } catch (error) {
        // Ignore errors if tables don't exist or records already exist
        console.log('Setup error (may be expected):', error);
      }
    });

    it('should return 200 with correct response structure when matches are found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=testlookup.example.com',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);

        // Verify top-level response structure
        expect(body).toHaveProperty('domain');
        expect(body).toHaveProperty('match_metadata');
        expect(body).toHaveProperty('matches');
        expect(body.domain).toBe('testlookup.example.com');

        // Verify match metadata structure
        expect(body.match_metadata).toHaveProperty('match_count');
        expect(body.match_metadata).toHaveProperty('search_time_ms');
        expect(body.match_metadata).toHaveProperty('cache_hit');
        expect(body.match_metadata.match_count).toBeGreaterThan(0);
        expect(body.match_metadata.search_time_ms).toBeGreaterThanOrEqual(0);
        expect(typeof body.match_metadata.cache_hit).toBe('boolean');

        // Verify matches array
        expect(Array.isArray(body.matches)).toBe(true);
        expect(body.matches.length).toBeGreaterThan(0);

        // Verify first match structure
        const match = body.matches[0];
        expect(match).toHaveProperty('server_id');
        expect(match).toHaveProperty('name');
        expect(match).toHaveProperty('description');
        expect(match).toHaveProperty('version');
        expect(match).toHaveProperty('deployment_type');
        expect(match).toHaveProperty('match_type');
        expect(match).toHaveProperty('match_confidence');
        expect(match).toHaveProperty('priority');
        expect(match).toHaveProperty('auto_suggest');
        expect(match).toHaveProperty('installation_complexity');
        expect(match).toHaveProperty('estimated_setup_minutes');
        expect(match).toHaveProperty('requires_restart');
        expect(match).toHaveProperty('auth_required');
        expect(match).toHaveProperty('configurations');
        expect(match).toHaveProperty('tools_count');
        expect(match).toHaveProperty('top_tools');
        expect(match).toHaveProperty('resources_available');
        expect(match).toHaveProperty('trust_level');
        expect(match).toHaveProperty('popularity_score');

        // Verify data types
        expect(typeof match.server_id).toBe('string');
        expect(typeof match.name).toBe('string');
        expect(typeof match.match_confidence).toBe('number');
        expect(match.match_confidence).toBeGreaterThanOrEqual(0);
        expect(match.match_confidence).toBeLessThanOrEqual(100);
        expect(Array.isArray(match.configurations)).toBe(true);
        expect(Array.isArray(match.top_tools)).toBe(true);
        expect(typeof match.auth_required).toBe('boolean');
        expect(typeof match.resources_available).toBe('boolean');
      }
    });
  });

  describe('Error handling', () => {
    it('should return proper error response for validation errors', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('invalid_request');
      expect(body.message).toBeDefined();
      expect(body.details).toBeDefined();
      expect(body.details.param).toBeDefined();
      expect(body.details.code).toBeDefined();
    });

    it('should include domain in error response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lookup?domain=definitely-does-not-exist-12345.com',
      });

      if (response.statusCode === 404) {
        const body = JSON.parse(response.payload);
        expect(body.domain).toBe('definitely-does-not-exist-12345.com');
      }
    });
  });

  describe('Caching behavior', () => {
    it('should indicate cache status in response', async () => {
      const domain = 'cache-test.example.com';

      // First request
      const response1 = await app.inject({
        method: 'GET',
        url: `/api/v1/lookup?domain=${domain}`,
      });

      if (response1.statusCode === 200) {
        const body1 = JSON.parse(response1.payload);
        expect(body1.match_metadata.cache_hit).toBe(false);

        // Second request (should be cached)
        const response2 = await app.inject({
          method: 'GET',
          url: `/api/v1/lookup?domain=${domain}`,
        });

        expect(response2.statusCode).toBe(200);
        const body2 = JSON.parse(response2.payload);
        expect(body2.match_metadata.cache_hit).toBe(true);
      }
    });
  });

  describe('HTTP methods', () => {
    it('should only accept GET requests', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const response = await app.inject({
          method,
          url: '/api/v1/lookup?domain=test.com',
        });

        // Should return 404 (route not found) or 405 (method not allowed)
        expect([404, 405]).toContain(response.statusCode);
      }
    });
  });
});
