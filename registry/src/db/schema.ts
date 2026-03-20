import { Kysely, Generated, sql } from 'kysely';

export interface Database {
  skills: SkillTable;
  capability: CapabilityTable;
}

export type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
export interface JsonArray extends Array<JsonValue> {}
export interface JsonObject { [key: string]: JsonValue }

export interface SkillTable {
  id: Generated<number>;
  name: string;
  version: string;
  description: string;
  author: string | null;
  rawDescriptor: JsonValue;
  status: 'pending' | 'approved' | 'rejected';
  downloadCount: number;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface CapabilityTable {
  id: Generated<number>;
  skillId: number;
  name: string;
  description: string;
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
    .ifNotExists()
    .execute();

  await database.schema
    .createIndex('idx_capability_skill_id')
    .on('capability')
    .column('skillId')
    .ifNotExists()
    .execute();
}
