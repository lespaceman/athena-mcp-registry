/**
 * MCP Lookup API Route
 * GET /api/v1/lookup
 */

import { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { LookupQuerySchema } from '../types/lookup.js';
import { lookupServers } from '../services/lookup.service.js';
import type { ErrorResponse } from '../types/lookup.js';

const plugin: FastifyPluginAsync = async (server) => {
  /**
   * GET /lookup
   * Look up MCP servers for a given domain
   */
  server.get('/lookup', async (request, reply) => {
    const startTime = Date.now();

    try {
      // Validate query parameters
      const query = LookupQuerySchema.parse(request.query);

      // Perform lookup
      const result = await lookupServers(query);

      // If no matches found, return 404
      if (result.matches.length === 0) {
        const errorResponse: ErrorResponse = {
          error: 'no_matches',
          message: 'No MCP servers found for this domain',
          domain: query.domain,
          suggestions: result.suggestions,
        };
        return reply.status(404).send(errorResponse);
      }

      // Return successful response
      return reply.status(200).send(result);
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const errorResponse: ErrorResponse = {
          error: 'invalid_request',
          message: firstError.message,
          details: {
            param: firstError.path.join('.'),
            code: firstError.code,
          },
        };
        return reply.status(400).send(errorResponse);
      }

      // Handle database errors
      if (error instanceof Error && error.message.includes('SQLITE')) {
        server.log.error(error);
        const errorResponse: ErrorResponse = {
          error: 'database_error',
          message: 'An error occurred while querying the database',
          request_id: `req_${Date.now()}`,
        };
        return reply.status(500).send(errorResponse);
      }

      // Handle unknown errors
      server.log.error(error);
      const errorResponse: ErrorResponse = {
        error: 'internal_error',
        message: 'An unexpected error occurred',
        request_id: `req_${Date.now()}`,
      };
      return reply.status(500).send(errorResponse);
    } finally {
      // Log request metrics
      const duration = Date.now() - startTime;
      server.log.info({
        path: request.url,
        method: request.method,
        duration,
        statusCode: reply.statusCode,
      });
    }
  });
};

export default plugin;
