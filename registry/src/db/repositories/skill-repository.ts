import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database, JsonValue } from '../schema.js';

export interface SkillRow {
  id: number;
  name: string;
  version: string;
  description: string;
  author: string | null;
  rawDescriptor: JsonValue;
  status: 'pending' | 'approved' | 'rejected';
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SkillRepository {
  constructor(private db: Kysely<Database>) {}

  async findAll(limit = 20, offset = 0): Promise<SkillRow[]> {
    return this.db
      .selectFrom('skills')
      .selectAll()
      .where('status', '=', 'approved')
      .orderBy('downloadCount', 'desc')
      .limit(limit)
      .offset(offset)
      .execute() as Promise<SkillRow[]>;
  }

  async findByName(name: string): Promise<SkillRow | null> {
    const result = await this.db
      .selectFrom('skills')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst();
    return result as SkillRow | null;
  }

  async search(query: string, limit = 20): Promise<SkillRow[]> {
    return this.db
      .selectFrom('skills')
      .selectAll()
      .where('status', '=', 'approved')
      .where(eb => eb.or([
        eb('name', 'ilike', `%${query}%`),
        eb('description', 'ilike', `%${query}%`)
      ]))
      .limit(limit)
      .execute() as Promise<SkillRow[]>;
  }

  async create(skill: {
    name: string;
    version: string;
    description: string;
    author: string | null;
    rawDescriptor: JsonValue;
    status: 'pending' | 'approved' | 'rejected';
  }): Promise<SkillRow> {
    return this.db
      .insertInto('skills')
      .values({ ...skill, downloadCount: 0 })
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<SkillRow>;
  }

  async update(id: number, updates: Partial<SkillRow>): Promise<SkillRow | null> {
    return this.db
      .updateTable('skills')
      .set({ ...updates, updatedAt: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst() as Promise<SkillRow | null>;
  }

  async incrementDownload(id: number): Promise<void> {
    await this.db
      .updateTable('skills')
      .set({
        downloadCount: sql`"downloadCount" + 1`,
        updatedAt: new Date()
      })
      .where('id', '=', id)
      .execute();
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .deleteFrom('skills')
      .where('id', '=', id)
      .executeTakeFirst();
    return result.numDeletedRows > 0;
  }

  async findById(id: number): Promise<SkillRow | null> {
    const result = await this.db
      .selectFrom('skills')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result as SkillRow | null;
  }

  async findByTag(tag: string, limit = 20): Promise<SkillRow[]> {
    return this.db
      .selectFrom('skills')
      .selectAll()
      .where('status', '=', 'approved')
      .where('rawDescriptor', '@>', sql<string>`{ metadata: { tags: [${sql.ref(tag)}] } }`)
      .orderBy('downloadCount', 'desc')
      .limit(limit)
      .execute() as Promise<SkillRow[]>;
  }

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('skills')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('status', '=', 'approved')
      .executeTakeFirst();
    return Number(result?.count ?? 0);
  }
}
