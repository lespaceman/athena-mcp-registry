import { FastifyPluginAsync } from 'fastify';
import * as db from '../infra/db.js';

const plugin: FastifyPluginAsync = async (server) => {
  server.get('/health', async (_request, reply) => {
    // Simple DB probe: SELECT 1
    try {
      db.query('SELECT 1');
      return {
        status: 'ok',
        uptime: process.uptime(),
        db: 'ok',
      };
    } catch (err) {
      server.log.error(err);
      return reply.status(503).send({
        status: 'fail',
        db: 'error',
      });
    }
  });
};

export default plugin;
