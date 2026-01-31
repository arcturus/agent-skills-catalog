/**
 * Ingestion worker: finds SKILL.md files in configured GitHub repos,
 * parses metadata, and inserts into SQLite. Logs and skips malformed files.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { parseSkillMd } from './parseSkillMd';
import pino from 'pino';

dotenv.config();

const projectRoot = process.cwd();
const dbPath = process.env.DB_PATH ?? path.join(projectRoot, 'db', 'skills.db');
const logPath = process.env.LOG_PATH ?? path.join(projectRoot, 'logs');
const logFilePath = path.join(logPath, 'ingestion.log');

function ensureLogDir(): void {
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true });
  }
}

const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  pino.multistream([
    { stream: pino.destination({ dest: logFilePath, append: true, mkdir: true }) },
    { stream: process.stdout },
  ])
);

const GITHUB_API = 'https://api.github.com';
let hasLogged401 = false;

interface CodeSearchItem {
  path: string;
  name: string;
  repository: { full_name: string; html_url: string };
  html_url: string;
}

async function searchSkillMdInRepo(repo: string): Promise<{ path: string; repo: string }[]> {
  const [owner, repoName] = repo.split('/').filter(Boolean);
  if (!owner || !repoName) {
    logger.warn({ repo }, 'Invalid repo format, expected owner/name');
    return [];
  }
  const url = `${GITHUB_API}/search/code?q=filename:SKILL.md+repo:${owner}/${repoName}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    },
  });
  if (!res.ok) {
    if (res.status === 401 && !hasLogged401) {
      hasLogged401 = true;
      logger.warn(
        'GitHub API returned 401. Set GITHUB_TOKEN in .env (create at https://github.com/settings/tokens — no scopes needed for public repos).'
      );
    }
    logger.warn({ repo, status: res.status }, 'GitHub search failed');
    return [];
  }
  const data = (await res.json()) as { items?: CodeSearchItem[] };
  const items = data.items ?? [];
  return items.map((item) => ({ path: item.path, repo: item.repository.full_name }));
}

async function getFileContent(repo: string, filePath: string): Promise<string> {
  const [owner, repoName] = repo.split('/').filter(Boolean);
  const url = `${GITHUB_API}/repos/${owner}/${repoName}/contents/${filePath}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3.raw',
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}

function getSourceUrl(repo: string, filePath: string): string {
  return `https://github.com/${repo}/blob/HEAD/${filePath}`;
}

function main(): void {
  ensureLogDir();
  const reposStr = process.env.GITHUB_REPOS ?? '';
  const repos = reposStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (repos.length === 0) {
    logger.info('No GITHUB_REPOS configured. Set GITHUB_REPOS=owner/repo in .env');
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    logger.warn(
      'GITHUB_TOKEN is not set. GitHub Search API requires authentication. Add GITHUB_TOKEN to your .env (create at https://github.com/settings/tokens — no scopes needed for public repos).'
    );
  }

  const db = new Database(dbPath);
  const insert = db.prepare(`
    INSERT INTO skills (
      name, description, license, compatibility, metadata, disable_model_invocation,
      source_repo, source_path, source_url, raw_content
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_repo, source_path) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      license = excluded.license,
      compatibility = excluded.compatibility,
      metadata = excluded.metadata,
      disable_model_invocation = excluded.disable_model_invocation,
      source_url = excluded.source_url,
      raw_content = excluded.raw_content,
      ingested_at = datetime('now')
  `);

  const runInsert = db.transaction(
    (row: {
      name: string;
      description: string;
      license?: string;
      compatibility?: string;
      metadata?: string;
      disableModelInvocation?: boolean;
      sourceRepo: string;
      sourcePath: string;
      sourceUrl: string;
      rawContent: string;
    }) => {
      insert.run(
        row.name,
        row.description,
        row.license ?? null,
        row.compatibility ?? null,
        row.metadata ?? null,
        row.disableModelInvocation ? 1 : 0,
        row.sourceRepo,
        row.sourcePath,
        row.sourceUrl,
        row.rawContent
      );
    }
  );

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  async function run(): Promise<void> {
    for (const repo of repos) {
      logger.info({ repo }, 'Searching for SKILL.md files');
      let files: { path: string; repo: string }[];
      try {
        files = await searchSkillMdInRepo(repo);
      } catch (err) {
        logger.error({ err, repo }, 'Failed to search repo');
        errors += 1;
        continue;
      }
      for (const { path: filePath, repo: fullRepo } of files) {
        try {
          const content = await getFileContent(fullRepo, filePath);
          const meta = parseSkillMd(content);
          if (!meta) {
            logger.warn({ repo: fullRepo, path: filePath }, 'Missing name or description, skipping');
            skipped += 1;
            continue;
          }
          runInsert({
            name: meta.name,
            description: meta.description,
            license: meta.license,
            compatibility: meta.compatibility,
            metadata: meta.metadata,
            disableModelInvocation: meta.disableModelInvocation,
            sourceRepo: fullRepo,
            sourcePath: filePath,
            sourceUrl: getSourceUrl(fullRepo, filePath),
            rawContent: content,
          });
          processed += 1;
          logger.info({ name: meta.name, path: filePath }, 'Ingested skill');
        } catch (err) {
          logger.error({ err, repo: fullRepo, path: filePath }, 'Failed to fetch or parse file');
          errors += 1;
        }
      }
    }
    db.close();
    logger.info({ processed, skipped, errors }, 'Ingestion complete');
  }

  run().catch((err) => {
    logger.error({ err }, 'Ingestion failed');
    process.exit(1);
  });
}

main();
