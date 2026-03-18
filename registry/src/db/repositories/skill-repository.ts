import type { Kysely } from 'kysely';
import type { Database, SkillTable } from '../db/schema.js';

export class SkillRepository {
  constructor(private db: Kysely<Database>) {}

  async findAll(limit = 20, offset = 0): Promise<SkillTable[]> {
    return this.db
      .selectFrom('skills')
      .selectAll()
      .where('status', '=', 'approved')
      .orderBy('downloadCount', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  async findByName(name: string): Promise<SkillTable | null> {
    return this.db
      .selectFrom('skills')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst();
  }

  async search(query: string, limit = 20): Promise<SkillTable[]> {
    return this.db
      .selectFrom('skills')
      .selectAll()
      .where('status', '=', 'approved')
      .where(eb => eb.or([
        eb('name', 'ilike', `%${query}%`),
        eb('description', 'ilike', `%${query}%`)
      ]))
      .limit(limit)
      .execute();
  }

  async create(skill: Omit<SkillTable, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>): Promise<SkillTable> {
    return this.db
      .insertInto('skills')
      .values(skill)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: number, updates: Partial<SkillTable>): Promise<SkillTable | null> {
    return this.db
      .updateTable('skills')
      .set({ ...updates, updatedAt: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async incrementDownload(id: number): Promise<void> {
    await this.db
      .updateTable('skills')
      .set({
        downloadCount: sql`download_count + 1`,
        updatedAt: new Date()
      })
      .where('id', '=', id)
      .execute();
  }
}
