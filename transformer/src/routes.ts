import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { transformWebsite } from './transformer.js';

interface TransformBody {
  url: string;
  name?: string;
  version?: string;
  author?: { name: string; email?: string };
}

export async function transformerRoutes(server: FastifyInstance) {
  server.post('/transform', {
    schema: {
      tags: ['transformer'],
      summary: '转换网站为 Skill',
      description: '分析指定网站并生成 Skill Descriptor',
      body: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '要转换的网站 URL' },
          name: { type: 'string', description: '技能名称（可选）' },
          version: { type: 'string', description: '版本号（可选）' },
          author: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' }
            }
          }
        },
        required: ['url']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            descriptor: { type: 'object' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: TransformBody }>, reply: FastifyReply) => {
    const { url, name, version, author } = request.body;

    // 验证 URL
    try {
      new URL(url);
    } catch {
      return reply.status(400).send({
        success: false,
        error: '无效的 URL 格式'
      });
    }

    server.log.info({ url }, '开始转换网站');

    const result = await transformWebsite({ url, name, version, author });

    if (result.success) {
      server.log.info({ name: result.descriptor?.name }, '转换成功');
      return { success: true, descriptor: result.descriptor };
    } else {
      server.log.error({ error: result.error }, '转换失败');
      return reply.status(500).send({
        success: false,
        error: result.error
      });
    }
  });

  server.get('/transform/preview', {
    schema: {
      tags: ['transformer'],
      summary: '预览网站信息',
      description: '获取网站的基本信息（标题、描述等）',
      querystring: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '网站 URL' }
        },
        required: ['url']
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { url: string } }>, reply: FastifyReply) => {
    const { url } = request.query;

    try {
      new URL(url);
    } catch {
      return reply.status(400).send({ error: '无效的 URL 格式' });
    }

    // 简化的预览实现（完整版本需要单独的 fetch 函数）
    return {
      url,
      preview: '网站预览功能开发中'
    };
  });
}
