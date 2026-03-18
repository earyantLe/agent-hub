import { createServer } from './server.js';

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';

const server = await createServer();

try {
  await server.listen({ port, host });
  console.log(`Registry server running at http://${host}:${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
