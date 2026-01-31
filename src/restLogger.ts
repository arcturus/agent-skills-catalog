/**
 * REST API logger: file (logs/rest.log) and console.
 */
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const projectRoot = process.cwd();
const logPath = process.env.LOG_PATH ?? path.join(projectRoot, 'logs');
const logFilePath = path.join(logPath, 'rest.log');

if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

export const logger = pino(
  { level: process.env.LOG_LEVEL ?? 'info' },
  pino.multistream([
    { stream: pino.destination({ dest: logFilePath, append: true, mkdir: true }) },
    { stream: process.stdout },
  ])
);
