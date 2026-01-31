#!/usr/bin/env node
/**
 * Initialize the SQLite database and create skills table from schema.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const projectRoot = process.cwd();
dotenv.config({ path: path.join(projectRoot, '.env') });

const dbPath = process.env.DB_PATH ?? path.join(projectRoot, 'db', 'skills.db');
const dbDir = path.dirname(dbPath);
const schemaPath = path.join(projectRoot, 'db', 'skills.schema.sql');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created directory: ${dbDir}`);
}

const schema = fs.readFileSync(schemaPath, 'utf-8');
const db = new Database(dbPath);

db.exec(schema);
db.close();

console.log(`Database initialized at: ${path.resolve(dbPath)}`);
