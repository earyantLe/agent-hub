import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillRepository } from './skill-repository.js';
import type { Kysely } from 'kysely';
import type { Database } from '../schema.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockQueryBuilder = any;

describe('SkillRepository', () => {
  let db: Kysely<Database>;
  let repo: SkillRepository;
  let mockQueryBuilder: MockQueryBuilder;

  beforeEach(() => {
    mockQueryBuilder = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
      executeTakeFirst: vi.fn().mockResolvedValue(undefined),
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue({})
    };

    db = {
      selectFrom: vi.fn(() => mockQueryBuilder),
      insertInto: vi.fn(() => mockQueryBuilder),
      updateTable: vi.fn(() => mockQueryBuilder),
      deleteFrom: vi.fn(() => mockQueryBuilder),
      schema: {} as unknown
    } as unknown as Kysely<Database>;

    repo = new SkillRepository(db);
  });

  describe('findAll', () => {
    it('should call selectFrom with correct parameters', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);

      await repo.findAll(20, 0);

      expect(db.selectFrom).toHaveBeenCalledWith('skills');
      expect(mockQueryBuilder.selectAll).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('status', '=', 'approved');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('downloadCount', 'desc');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
    });

    it('should default to limit 20 and offset 0', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);

      await repo.findAll();

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
    });
  });

  describe('findByName', () => {
    it('should find skill by name', async () => {
      const mockSkill = { id: 1, name: 'test-skill', version: '1.0.0' };
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(mockSkill);

      const result = await repo.findByName('test-skill');

      expect(db.selectFrom).toHaveBeenCalledWith('skills');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('name', '=', 'test-skill');
      expect(result).toEqual(mockSkill);
    });

    it('should return undefined when not found', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(undefined);

      const result = await repo.findByName('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should find skill by id', async () => {
      const mockSkill = { id: 1, name: 'test-skill', version: '1.0.0' };
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(mockSkill);

      const result = await repo.findById(1);

      expect(db.selectFrom).toHaveBeenCalledWith('skills');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', '=', 1);
      expect(result).toEqual(mockSkill);
    });

    it('should return undefined when not found', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(undefined);

      const result = await repo.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('search', () => {
    it('should search by name and description', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);

      await repo.search('test', 20);

      expect(db.selectFrom).toHaveBeenCalledWith('skills');
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
    });

    it('should default to limit 20', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);

      await repo.search('test');

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
    });
  });

  describe('create', () => {
    it('should create a new skill', async () => {
      const mockSkill = { id: 1, name: 'test-skill', version: '1.0.0' };
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockSkill);

      const result = await repo.create({
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test skill',
        author: 'Author',
        rawDescriptor: {},
        status: 'pending'
      });

      expect(db.insertInto).toHaveBeenCalledWith('skills');
      expect(result).toEqual(mockSkill);
    });
  });

  describe('update', () => {
    it('should update skill', async () => {
      const mockSkill = { id: 1, name: 'test-skill', version: '2.0.0' };
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(mockSkill);

      const result = await repo.update(1, { version: '2.0.0' });

      expect(db.updateTable).toHaveBeenCalledWith('skills');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', '=', 1);
      expect(result).toEqual(mockSkill);
    });

    it('should return null when not found', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(null);

      const result = await repo.update(999, { version: '2.0.0' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should return true when deleted', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue({ numDeletedRows: 1 });

      const result = await repo.delete(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('skills');
      expect(result).toBe(true);
    });

    it('should return false when not deleted', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue({ numDeletedRows: 0 });

      const result = await repo.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('incrementDownload', () => {
    it('should increment download count', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);

      await repo.incrementDownload(1);

      expect(db.updateTable).toHaveBeenCalledWith('skills');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', '=', 1);
    });
  });
});
