import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateSkillDescriptor } from '@agent-hub/protocol';
import { SkillRepository } from '../db/repositories/skill-repository.js';
import type { Database, SkillTable } from '../db/schema.js';
import type { Kysely } from 'kysely';

interface SubmitSkillBody {
  descriptor: unknown;
}

interface SkillParams {
  name: string;
}

interface SkillQuery {
  q?: string;
  limit?: string;
}

export async function skillsRoutes(server: FastifyInstance) {
  const db = server.db as Kysely<Database>;
  const skillRepo = new SkillRepository(db);

  server.get('/skills', async (request: FastifyRequest<{ Querystring: SkillQuery }>, reply: FastifyReply) => {
    const { q, limit = '20' } = request.query;
    const limitNum = parseInt(limit, 10);

    let skills;
    if (q) {
      skills = await skillRepo.search(q, limitNum);
    } else {
      skills = await skillRepo.findAll(limitNum);
    }

    return { skills, total: skills.length };
  });

  server.get('/skills/:name', async (request: FastifyRequest<SkillParams>, reply: FastifyReply) => {
    const { name } = request.params;
    const skill = await skillRepo.findByName(name);

    if (!skill) {
      return reply.status(404).send({ error: 'Skill not found' });
    }

    await skillRepo.incrementDownload(skill.id);
    return skill;
  });

  server.post('/skills', async (request: FastifyRequest<{ Body: SubmitSkillBody }>, reply: FastifyReply) => {
    const { descriptor } = request.body;

    const validation = validateSkillDescriptor(descriptor);
    if (!validation.valid) {
      return reply.status(400).send({
        error: 'Invalid skill descriptor',
        details: validation.errors
      });
    }

    const existing = await skillRepo.findByName((descriptor as any).name);
    if (existing) {
      return reply.status(409).send({ error: 'Skill with this name already exists' });
    }

    const skill = await skillRepo.create({
      name: (descriptor as any).name,
      version: (descriptor as any).version,
      description: (descriptor as any).description,
      author: (descriptor as any).author?.name || null,
      rawDescriptor: descriptor as any,
      status: 'pending'
    });

    reply.status(201).send({
      id: skill.id,
      name: skill.name,
      status: skill.status,
      message: 'Skill submitted for review'
    });
  });
}
