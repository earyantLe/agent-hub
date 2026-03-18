import { Kysely, PostgresDialect, sql } from 'kysely';
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

export async function migrate(database: Kysely<Database>) {
  await database.schema
    .createTable('skills')
    .ifNotExists()
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar(255)', col => col.unique().notNull())
    .addColumn('version', 'varchar(64)', col => col.notNull())
    .addColumn('description', 'text', col => col.notNull())
    .addColumn('author', 'varchar(255)')
    .addColumn('rawDescriptor', 'jsonb', col => col.notNull())
    .addColumn('status', 'varchar(32)', col => col.notNull().defaultTo('pending'))
    .addColumn('downloadCount', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'timestamptz', col => col.defaultTo(sql`now()`).notNull())
    .addColumn('updatedAt', 'timestamptz', col => col.defaultTo(sql`now()`).notNull())
    .execute();

  await database.schema
    .createTable('capability')
    .ifNotExists()
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('skillId', 'integer', col => col.references('skills.id').onDelete('cascade').notNull())
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('description', 'text', col => col.notNull())
    .execute();

  await database.schema
    .createIndex('idx_skills_name')
    .on('skills')
    .column('name')
    .execute();

  await database.schema
    .createIndex('idx_capability_skill_id')
    .on('capability')
    .column('skillId')
    .execute();
}
