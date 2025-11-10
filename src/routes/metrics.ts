import { FastifyPluginAsync } from 'fastify';

const plugin: FastifyPluginAsync = async (server) => {
  server.get('/metrics', async (_request, reply) => {
    // Placeholder for Prometheus metrics
    // In a production environment, you would use a library like prom-client
    // to expose real metrics here
    return reply
      .code(200)
      .header('Content-Type', 'text/plain; version=0.0.4')
      .send('# Prometheus metrics endpoint (placeholder)\n# TODO: Implement with prom-client\n');
  });
};

export default plugin;
