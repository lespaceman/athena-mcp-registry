import Fastify, { FastifyInstance } from 'fastify';
import * as Sentry from '@sentry/node';
import { config } from './config/index.js';
import healthRoutes from './routes/health.js';
import metricsRoutes from './routes/metrics.js';

// Initialize Sentry if DSN is provided
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    // Performance Monitoring
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

export function createApp(): FastifyInstance {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'production'
        ? {
            level: config.LOG_LEVEL,
            formatters: {
              level: (label) => {
                return { level: label };
              },
            },
          }
        : {
            level: config.LOG_LEVEL,
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            },
          },
  });

  // Register routes with API prefix
  app.register(healthRoutes, { prefix: '/_api' });
  app.register(metricsRoutes, { prefix: '/_api' });

  // Add Sentry error handler if initialized
  if (config.SENTRY_DSN) {
    app.setErrorHandler((error, _request, reply) => {
      Sentry.captureException(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    });
  }

  return app;
}
