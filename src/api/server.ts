/**
 * Express REST API server: /skills list, search, download; /mcp for MCP JSON-RPC.
 */
import express from 'express';
import path from 'path';
import skillsRouter from './routes/skills';
import mcpRouter from '../mcp/routes';
import { logger } from '../restLogger';
import { config } from '../../config/env';

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  if (req.path.startsWith('/mcp')) return next();
  logger.info({ method: req.method, path: req.path }, 'REST request');
  next();
});

app.use('/skills', skillsRouter);
app.use('/mcp', mcpRouter);

app.get('/repos', (_req, res) => {
  res.json({ repos: config.githubRepos });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

export function startRestServer(): void {
  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'REST API listening');
  });
}

export default app;
