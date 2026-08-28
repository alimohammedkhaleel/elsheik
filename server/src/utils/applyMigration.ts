import fs from 'fs';
import path from 'path';
import { query, closeDatabasePool } from '../config/database';
import { validateDatabaseEnv } from '../config/env';

async function run() {
  console.log('--- Applying Migration 003 ---');
  const { isConfigured, message } = validateDatabaseEnv();
  if (!isConfigured) {
    console.error('Database not configured:', message);
    process.exit(1);
  }

  const migrationPath = path.resolve(__dirname, '../../../database/migrations/003_final_production_enhancements.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    await query(sql);
    console.log('Migration 003 applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await closeDatabasePool();
  }
}

run();
