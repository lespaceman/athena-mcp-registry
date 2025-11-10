import Fastify, { FastifyInstance } from 'fastify';
import { config } from './config/index.js';
import healthRoutes from './routes/health.js';

export function createApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  // Register routes with API prefix
  app.register(healthRoutes, { prefix: '/_api' });

  return app;
}
