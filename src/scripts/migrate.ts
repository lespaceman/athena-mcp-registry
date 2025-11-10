#!/usr/bin/env node
import { getDatabase } from '../infra/db.js';
import { runMigrations, getMigrationStatus } from '../infra/migrations.js';

const command = process.argv[2];

if (command === 'status') {
  const db = getDatabase();
  const status = getMigrationStatus(db);

  console.log('Migration Status:');
  console.log('================');
  console.log(`Applied: ${status.applied.length}`);
  status.applied.forEach((name) => console.log(`  ✓ ${name}`));

  if (status.pending.length > 0) {
    console.log(`\nPending: ${status.pending.length}`);
    status.pending.forEach((name) => console.log(`  - ${name}`));
  } else {
    console.log('\nNo pending migrations');
  }
} else {
  // Default: run migrations
  const db = getDatabase();
  runMigrations(db);
}
