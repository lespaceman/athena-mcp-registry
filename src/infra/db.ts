import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { config } from '../config/index.js';
import fs from 'fs';

// Ensure data directory exists
const dbPath = path.resolve(process.cwd(), config.DB_PATH);
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Open SQLite database
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

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
};
