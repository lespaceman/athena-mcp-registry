import { type Database as DatabaseType } from 'better-sqlite3';
import { initDatabase } from '../../infra/db.js';
import { runMigrations } from '../../infra/migrations.js';
import { FastifyInstance } from 'fastify';
import { createApp } from '../../app.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Create a test database (in-memory by default)
 */
export function createTestDb(useMemory: boolean = true): DatabaseType {
  let db: DatabaseType;

  if (useMemory) {
    db = initDatabase(':memory:');
  } else {
    // Create a temporary file
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'athena-test-'));
    const dbPath = path.join(tmpDir, 'test.sqlite');
    db = initDatabase(dbPath);
  }

  return db;
}

/**
 * Create a test database with migrations applied
 */
export function createTestDbWithMigrations(useMemory: boolean = true): DatabaseType {
  const db = createTestDb(useMemory);
  runMigrations(db);
  return db;
}

/**
 * Create a test Fastify app instance with a test database
 */
export function createTestApp(db?: DatabaseType): {
  app: FastifyInstance;
  db: DatabaseType;
  cleanup: () => Promise<void>;
} {
  const testDb = db || createTestDbWithMigrations();
  const app = createApp();

  const cleanup = async () => {
    await app.close();
    testDb.close();
  };

  return { app, db: testDb, cleanup };
}

/**
 * Helper for running database tests in isolation
 */
export function withTestDb<T>(
  test: (db: DatabaseType) => T | Promise<T>,
  useMemory: boolean = true,
): Promise<T> {
  const db = createTestDbWithMigrations(useMemory);

  try {
    const result = test(db);
    if (result instanceof Promise) {
      return result.finally(() => db.close());
    }
    db.close();
    return Promise.resolve(result);
  } catch (error) {
    db.close();
    throw error;
  }
}
