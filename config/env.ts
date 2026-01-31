import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvOptional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config = {
  port: parseInt(getEnvOptional('PORT', '3000'), 10),
  dbPath: path.resolve(getEnvOptional('DB_PATH', './db/skills.db')),
  logPath: path.resolve(getEnvOptional('LOG_PATH', './logs')),
  logLevel: getEnvOptional('LOG_LEVEL', 'info'),
  githubRepos: getEnvOptional('GITHUB_REPOS', '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  ingestionIntervalMinutes: parseInt(
    getEnvOptional('INGESTION_INTERVAL_MINUTES', '0'),
    10
  ),
} as const;

export type Config = typeof config;
