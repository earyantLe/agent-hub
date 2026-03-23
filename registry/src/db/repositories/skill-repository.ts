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
  isLatest: boolean;
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
      .where('isLatest', '=', true)
      .orderBy('downloadCount', 'desc')
      .limit(limit)
      .offset(offset)
      .execute() as Promise<SkillRow[]>;
  }

  async findByName(name: string, version?: string): Promise<SkillRow | null> {
    let query = this.db
      .selectFrom('skills')
      .selectAll()
      .where('name', '=', name);

    if (version) {
      query = query.where('version', '=', version);
    } else {
      query = query.where('isLatest', '=', true);
    }

    const result = await query.executeTakeFirst();
    return result as SkillRow | null;
  }

  async findVersions(name: string): Promise<SkillRow[]> {
    return this.db
      .selectFrom('skills')
      .selectAll()
      .where('name', '=', name)
      .where('status', '=', 'approved')
      .orderBy('createdAt', 'desc')
      .execute() as Promise<SkillRow[]>;
  }

  async findLatestVersion(name: string): Promise<SkillRow | null> {
    const result = await this.db
      .selectFrom('skills')
      .selectAll()
      .where('name', '=', name)
      .where('isLatest', '=', true)
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
    // 检查是否存在同名同版本的技能
    const existing = await this.findByName(skill.name, skill.version);
    if (existing) {
      throw new Error(`Skill '${skill.name}' version '${skill.version}' already exists`);
    }

    // 如果是该技能的第一个版本，设置为 latest
    const latestVersion = await this.findLatestVersion(skill.name);
    const isLatest = !latestVersion;

    return this.db
      .insertInto('skills')
      .values({ ...skill, downloadCount: 0, isLatest })
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<SkillRow>;
  }

  async setLatestVersion(id: number): Promise<SkillRow | null> {
    // 获取当前 skill 的 name
    const skill = await this.findById(id);
    if (!skill) return null;

    // 使用事务更新版本
    return this.db
      .transaction()
      .execute(async (trx) => {
        // 取消当前 latest 版本
        await trx
          .updateTable('skills')
          .set({ isLatest: false, updatedAt: new Date() })
          .where('name', '=', skill.name)
          .where('isLatest', '=', true)
          .execute();

        // 设置新版本为 latest
        const result = await trx
          .updateTable('skills')
          .set({ isLatest: true, updatedAt: new Date() })
          .where('id', '=', id)
          .returningAll()
          .executeTakeFirst();
        return result as SkillRow | null;
      });
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
