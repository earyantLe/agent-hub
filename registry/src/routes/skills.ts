import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateSkillDescriptor, type SkillDescriptor } from '@agent-hub/protocol';
import { SkillRepository } from '../db/repositories/skill-repository.js';
import type { Database } from '../db/schema.js';
import type { Kysely } from 'kysely';

interface SubmitSkillBody {
  descriptor: SkillDescriptor;
}

interface SkillQuery {
  q?: string;
  limit?: string;
  offset?: string;
  tag?: string;
}

interface SkillParams {
  name: string;
}

interface SkillIdParams {
  id: string;
}

interface BatchOperationBody {
  ids: number[];
}

interface UpdateSkillBody {
  descriptor?: SkillDescriptor;
  status?: 'pending' | 'approved' | 'rejected';
}

const skillSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '技能唯一标识' },
    version: { type: 'string', description: '语义化版本号' },
    description: { type: 'string', description: '技能描述' },
    author: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        url: { type: 'string' }
      }
    },
    capabilities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          inputSchema: { type: 'object' }
        }
      }
    },
    auth: { type: 'object' }
  }
};

export async function skillsRoutes(server: FastifyInstance) {
  const db = server.db as Kysely<Database>;
  const skillRepo = new SkillRepository(db);

  server.get('/skills', {
    schema: {
      tags: ['skills'],
      summary: '获取技能列表',
      description: '返回已审核通过的技能列表，支持搜索和分页',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', description: '搜索关键词' },
          tag: { type: 'string', description: '按标签筛选' },
          limit: { type: 'string', description: '每页数量', default: '20' },
          offset: { type: 'string', description: '偏移量', default: '0' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            skills: { type: 'array', items: skillSchema },
            total: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: SkillQuery }>, _reply: FastifyReply) => {
    const { q, tag, limit = '20', offset = '0' } = request.query;
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    let skills;
    if (tag) {
      skills = await skillRepo.findByTag(tag, limitNum);
    } else if (q) {
      skills = await skillRepo.search(q, limitNum);
    } else {
      skills = await skillRepo.findAll(limitNum, offsetNum);
    }

    const total = await skillRepo.count();
    return { skills, total };
  });

  server.get('/skills/:name', {
    schema: {
      tags: ['skills'],
      summary: '获取技能详情',
      description: '根据名称获取单个技能的完整信息，默认返回最新版，可通过 ?version= 指定版本',
      params: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '技能名称' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          version: { type: 'string', description: '指定版本号，不传则返回最新版' }
        }
      },
      response: {
        200: skillSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: SkillParams; Querystring: { version?: string } }>, reply: FastifyReply) => {
    const { name } = request.params;
    const { version } = request.query;
    const skill = await skillRepo.findByName(name, version);

    if (!skill) {
      return reply.status(404).send({ error: 'Skill not found' });
    }

    await skillRepo.incrementDownload(skill.id);
    return skill;
  });

  server.post('/skills', {
    schema: {
      tags: ['skills'],
      summary: '提交新技能',
      description: '提交新的技能描述符进行审核，支持版本管理（同名技能可提交不同版本）',
      body: {
        type: 'object',
        properties: {
          descriptor: skillSchema
        },
        required: ['descriptor']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            version: { type: 'string' },
            status: { type: 'string' },
            isLatest: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' }
          }
        },
        409: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: SubmitSkillBody }>, reply: FastifyReply) => {
    const { descriptor } = request.body;

    const validation = validateSkillDescriptor(descriptor);
    if (!validation.valid) {
      return reply.status(400).send({
        error: 'Invalid skill descriptor',
        details: validation.errors
      });
    }

    try {
      const skill = await skillRepo.create({
        name: descriptor.name,
        version: descriptor.version,
        description: descriptor.description,
        author: descriptor.author?.name || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawDescriptor: descriptor as any,
        status: 'pending'
      });

      reply.status(201).send({
        id: skill.id,
        name: skill.name,
        version: skill.version,
        status: skill.status,
        isLatest: skill.isLatest,
        message: 'Skill submitted for review'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.status(409).send({ error: error.message });
      }
      throw error;
    }
  });

  server.put('/skills/:id', {
    schema: {
      tags: ['skills'],
      summary: '更新技能',
      description: '更新技能信息或审核状态',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '技能 ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          descriptor: skillSchema,
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] }
        }
      },
      response: {
        200: skillSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: SkillIdParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { descriptor, status } = request.body as UpdateSkillBody;
    const skillId = parseInt(id, 10);

    const existing = await skillRepo.findById(skillId);
    if (!existing) {
      return reply.status(404).send({ error: 'Skill not found' });
    }

    const updates: Record<string, unknown> = {};

    if (descriptor) {
      const validation = validateSkillDescriptor(descriptor);
      if (!validation.valid) {
        return reply.status(400).send({
          error: 'Invalid skill descriptor',
          details: validation.errors
        });
      }
      updates.name = descriptor.name;
      updates.version = descriptor.version;
      updates.description = descriptor.description;
      updates.author = descriptor.author?.name || null;
      updates.rawDescriptor = descriptor;
    }

    if (status) {
      updates.status = status;
    }

    const updated = await skillRepo.update(skillId, updates);
    return updated || existing;
  });

  server.delete('/skills/:id', {
    schema: {
      tags: ['skills'],
      summary: '删除技能',
      description: '根据 ID 删除技能',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '技能 ID' }
        }
      },
      response: {
        204: { type: 'null' },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: SkillIdParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const skillId = parseInt(id, 10);

    const existing = await skillRepo.findById(skillId);
    if (!existing) {
      return reply.status(404).send({ error: 'Skill not found' });
    }

    await skillRepo.delete(skillId);
    return reply.status(204).send();
  });

  server.post('/skills/batch/delete', {
    schema: {
      tags: ['skills'],
      summary: '批量删除技能',
      description: '批量删除多个技能',
      body: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'number' },
            description: '要删除的技能 ID 列表'
          }
        },
        required: ['ids']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            deletedCount: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: BatchOperationBody }>, reply: FastifyReply) => {
    const { ids } = request.body;
    let deletedCount = 0;

    for (const id of ids) {
      const skill = await skillRepo.findById(id);
      if (skill) {
        await skillRepo.delete(id);
        deletedCount++;
      }
    }

    return reply.status(200).send({ deletedCount });
  });

  server.post('/skills/batch/approve', {
    schema: {
      tags: ['skills'],
      summary: '批量审核技能',
      description: '批量审核多个技能',
      body: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'number' },
            description: '要审核的技能 ID 列表'
          },
          status: {
            type: 'string',
            enum: ['approved', 'rejected'],
            description: '审核状态'
          }
        },
        required: ['ids', 'status']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            updatedCount: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: BatchOperationBody & { status: 'approved' | 'rejected' } }>, reply: FastifyReply) => {
    const { ids, status } = request.body;
    let updatedCount = 0;

    for (const id of ids) {
      const skill = await skillRepo.findById(id);
      if (skill) {
        await skillRepo.update(id, { status });
        updatedCount++;
      }
    }

    return reply.status(200).send({ updatedCount });
  });

  // 版本管理端点
  server.get('/skills/:name/versions', {
    schema: {
      tags: ['skills'],
      summary: '获取技能的所有版本',
      description: '返回指定技能的所有已审核版本列表',
      params: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '技能名称' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            versions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  version: { type: 'string' },
                  description: { type: 'string' },
                  isLatest: { type: 'boolean' },
                  downloadCount: { type: 'number' },
                  createdAt: { type: 'string' }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: SkillParams }>, reply: FastifyReply) => {
    const { name } = request.params;
    const versions = await skillRepo.findVersions(name);

    if (versions.length === 0) {
      return reply.status(404).send({ error: 'Skill not found' });
    }

    return {
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        description: v.description,
        isLatest: v.isLatest,
        downloadCount: v.downloadCount,
        createdAt: v.createdAt.toISOString()
      }))
    };
  });

  server.post('/skills/:name/versions/:version/set-latest', {
    schema: {
      tags: ['skills'],
      summary: '设置最新版本的技能',
      description: '将指定版本设置为最新版',
      params: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '技能名称' },
          version: { type: 'string', description: '版本号' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            version: { type: 'string' },
            isLatest: { type: 'boolean' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: SkillParams & { version: string } }>, reply: FastifyReply) => {
    const { name, version } = request.params;
    const skill = await skillRepo.findByName(name, version);

    if (!skill) {
      return reply.status(404).send({ error: 'Skill version not found' });
    }

    const updated = await skillRepo.setLatestVersion(skill.id);
    if (!updated) {
      return reply.status(500).send({ error: 'Failed to set latest version' });
    }

    return {
      id: updated.id,
      name: updated.name,
      version: updated.version,
      isLatest: updated.isLatest
    };
  });
}
