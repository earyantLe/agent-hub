import Fastify from 'fastify';
import cors from '@fastify/cors';
import { pino } from 'pino';
import { createDatabase, migrate } from './db/database.js';
import { skillsRoutes } from './routes/skills.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  }
});

export async function createServer() {
  const server = Fastify({
    logger
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

  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  server.get('/', async () => ({
    name: 'Agent Hub Registry',
    version: '0.1.0',
    docs: '/docs'
  }));

  return server;
}
