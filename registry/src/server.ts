import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyRateLimit from '@fastify/rate-limit';
import pino from 'pino';
import type { LoggerOptions } from 'pino';
import { createDatabase } from './db/database.js';
import { migrate } from './db/schema.js';
import { skillsRoutes } from './routes/skills.js';
import { transformerRoutes } from '@agent-hub/transformer';
import type { Kysely } from 'kysely';
import type { Database } from './db/schema.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Kysely<Database>;
  }
}

const isDev = process.env.NODE_ENV !== 'production';

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    : undefined
};

const logger = pino.default(loggerOptions);

export async function createServer() {
  const server = Fastify({
    logger,
    bodyLimit: 1048576 // 1MB limit
  });

  // 请求日志中间件
  server.addHook('onRequest', (request, reply, done) => {
    server.log.info({ method: request.method, url: request.url }, 'incoming request');
    done();
  });

  server.addHook('onResponse', (request, reply, done) => {
    server.log.info({
      method: request.method,
      url: request.url,
      status: reply.statusCode,
      responseTime: reply.elapsedTime
    }, 'request completed');
    done();
  });

  // Swagger 文档
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Agent Hub Registry API',
        description: 'Agent 技能注册中心 REST API',
        version: '0.1.0'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: '开发环境'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // 速率限制
  await server.register(fastifyRateLimit, {
    global: false, // 默认不全局启用，按需配置
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', '::1'], // 本地地址不限
    errorResponseBuilder: (_request, _context) => ({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Try again later.',
      statusCode: 429
    })
  });

  // 全局错误处理
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message
      });
    }

    if (error.code === 'NOT_FOUND') {
      return reply.status(404).send({ error: 'Not Found' });
    }

    if (error.code === 'BAD_REQUEST') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error.message
      });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: isDev ? error.message : 'An unexpected error occurred'
    });
  });

  // 404 处理
  server.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: 'Not Found',
      path: request.url
    });
  });

  await server.register(cors, {
    origin: true,
    credentials: true
  });

  // 初始化数据库
  const db = createDatabase();
  server.decorate('db', db);

  // 运行迁移
  await migrate(db);

  // 注册路由
  await server.register(skillsRoutes, { prefix: '/api' });
  await server.register(transformerRoutes, { prefix: '/api' });

  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  server.get('/', async () => ({
    name: 'Agent Hub Registry',
    version: '0.1.0',
    docs: '/docs'
  }));

  return server;
}
