import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { config } from '../config/index.js';
import fs from 'fs';

/**
 * Initialize a database connection
 * Supports :memory: for in-memory databases or file paths
 */
export function initDatabase(databaseUrl: string = config.DATABASE_URL): DatabaseType {
  let dbPath = databaseUrl;

  // If not in-memory, ensure the directory exists
  if (databaseUrl !== ':memory:') {
    dbPath = path.resolve(process.cwd(), databaseUrl);
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  // Open SQLite database
  const db = new Database(dbPath);

  // Set a busy timeout to handle concurrent access (5 seconds)
  // This prevents immediate SQLITE_BUSY errors when multiple connections access the database
  db.pragma('busy_timeout = 5000');

  // Enable WAL mode for better concurrency (skip for in-memory)
  if (databaseUrl !== ':memory:') {
    try {
      // WAL mode is persistent - if it's already set, this will return 'wal'
      // If another connection has a lock, this might fail with SQLITE_BUSY
      // The busy_timeout will make it retry, but we handle failures gracefully
      db.pragma('journal_mode = WAL');
    } catch (error) {
      // If setting WAL mode fails (e.g., database locked), log but continue
      // The database will use the existing journal mode
      if (config.NODE_ENV !== 'test') {
        console.warn('Failed to set WAL mode (database may already be in WAL mode):', error);
      }
    }
  }

  return db;
}

// Default database instance
const sqlite = initDatabase();

/**
 * Execute a simple query and return a single result
 */
export function query(sql: string, params: unknown[] = []): unknown {
  const stmt = sqlite.prepare(sql);
  return stmt.get(...params);
}

/**
 * Execute a query and return all results
 */
export function queryAll(sql: string, params: unknown[] = []): unknown[] {
  const stmt = sqlite.prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
export function execute(sql: string, params: unknown[] = []) {
  const stmt = sqlite.prepare(sql);
  return stmt.run(...params);
}

/**
 * Close the database connection
 */
export function close() {
  sqlite.close();
}

/**
 * Get the raw database instance (use sparingly)
 */
export function getDatabase(): DatabaseType {
  return sqlite;
}

export default {
  query,
  queryAll,
  execute,
  close,
  getDatabase,
  initDatabase,
};
