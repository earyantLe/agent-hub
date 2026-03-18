import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './schema.js';

export function createDatabase(connectionString?: string): Kysely<Database> {
  const url = connectionString || process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const pool = new Pool({ connectionString: url });

  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool })
  });
}
