import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createApp } from '../app.js';

describe('Health endpoint', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
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
