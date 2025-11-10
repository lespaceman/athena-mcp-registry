import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from './_helpers/index.js';

describe('Health endpoint', () => {
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

  it('GET /_api/health returns ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/_api/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.uptime).toBeTypeOf('number');
  });
});
