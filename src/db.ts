/**
 * Database access for skills. Uses config for DB path.
 */
import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const projectRoot = process.cwd();
const dbPath = process.env.DB_PATH ?? path.join(projectRoot, 'db', 'skills.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath, { readonly: false });
  }
  return db;
}

export interface SkillRow {
  id: number;
  name: string;
  description: string;
  license: string | null;
  compatibility: string | null;
  metadata: string | null;
  disable_model_invocation: number;
  source_repo: string;
  source_path: string;
  source_url: string | null;
  ingested_at: string;
  raw_content: string | null;
}

export function listSkills(): SkillRow[] {
  const database = getDb();
  return database.prepare('SELECT * FROM skills ORDER BY ingested_at DESC').all() as SkillRow[];
}

export function searchSkills(q: string): SkillRow[] {
  const database = getDb();
  if (!q.trim()) return listSkills();
  try {
    const ids = database.prepare('SELECT rowid FROM skills_fts WHERE skills_fts MATCH ?').all(q) as { rowid: number }[];
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    return database
      .prepare(`SELECT * FROM skills WHERE id IN (${placeholders}) ORDER BY ingested_at DESC`)
      .all(...ids.map((r) => r.rowid)) as SkillRow[];
  } catch {
    return database
      .prepare(
        'SELECT * FROM skills WHERE name LIKE ? OR description LIKE ? ORDER BY ingested_at DESC'
      )
      .all(`%${q}%`, `%${q}%`) as SkillRow[];
  }
}

export function getSkillById(id: number): SkillRow | undefined {
  const database = getDb();
  return database.prepare('SELECT * FROM skills WHERE id = ?').get(id) as SkillRow | undefined;
}
