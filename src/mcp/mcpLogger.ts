/**
 * MCP activity logger: logs to logs/mcp.log and console with distinct prefix and color.
 */
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const projectRoot = process.cwd();
const logPath = process.env.LOG_PATH ?? path.join(projectRoot, 'logs');
const logFilePath = path.join(logPath, 'mcp.log');

if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

const MCP_PREFIX = '\x1b[36m[MCP]\x1b[0m'; // cyan

const logger = pino(
  { level: process.env.LOG_LEVEL ?? 'info' },
  pino.multistream([
    { stream: pino.destination({ dest: logFilePath, append: true, mkdir: true }) },
    {
      stream: {
        write(msg: string) {
          process.stdout.write(`${MCP_PREFIX} ${msg}`);
        },
      },
    },
  ])
);

export function logMcpRequest(method: string, id?: number | string): void {
  logger.info({ method, id }, 'MCP request');
}

export function logMcpResponse(method: string, id?: number | string, durationMs?: number): void {
  logger.info({ method, id, durationMs }, 'MCP response');
}

export function logMcpError(method: string, err: unknown, id?: number | string): void {
  logger.error({ err, method, id }, 'MCP error');
}

export default logger;
