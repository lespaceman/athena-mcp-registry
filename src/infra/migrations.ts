import { type Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

/**
 * Initialize the migrations tracking table
 */
function initMigrationsTable(db: DatabaseType): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
}

/**
 * Get list of applied migrations
 */
function getAppliedMigrations(db: DatabaseType): Set<string> {
  const rows = db.prepare('SELECT name FROM _migrations').all() as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

/**
 * Apply a single migration
 */
function applyMigration(db: DatabaseType, name: string, sql: string): void {
  const transaction = db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(name);
  });

  transaction();
}

/**
 * Run all pending migrations
 */
export function runMigrations(db: DatabaseType, migrationsDir?: string): void {
  // Default to migrations/ directory at project root
  const migrationsPath = migrationsDir || path.resolve(process.cwd(), 'migrations');

  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsPath)) {
    console.log('No migrations directory found, skipping migrations');
    return;
  }

  // Initialize migrations tracking table
  initMigrationsTable(db);

  // Get list of applied migrations
  const appliedMigrations = getAppliedMigrations(db);

  // Get all SQL files from migrations directory
  const files = fs
    .readdirSync(migrationsPath)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found');
    return;
  }

  let appliedCount = 0;

  // Apply each migration that hasn't been applied yet
  for (const file of files) {
    if (!appliedMigrations.has(file)) {
      const filePath = path.join(migrationsPath, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`Applying migration: ${file}`);
      applyMigration(db, file, sql);
      appliedCount++;
    }
  }

  if (appliedCount === 0) {
    console.log('All migrations already applied');
  } else {
    console.log(`Applied ${appliedCount} migration(s)`);
  }
}

/**
 * Get migration status
 */
export function getMigrationStatus(
  db: DatabaseType,
  migrationsDir?: string,
): {
  applied: string[];
  pending: string[];
} {
  const migrationsPath = migrationsDir || path.resolve(process.cwd(), 'migrations');

  initMigrationsTable(db);
  const appliedMigrations = getAppliedMigrations(db);

  const allFiles = fs.existsSync(migrationsPath)
    ? fs
        .readdirSync(migrationsPath)
        .filter((file) => file.endsWith('.sql'))
        .sort()
    : [];

  const pending = allFiles.filter((file) => !appliedMigrations.has(file));
  const applied = allFiles.filter((file) => appliedMigrations.has(file));

  return { applied, pending };
}
