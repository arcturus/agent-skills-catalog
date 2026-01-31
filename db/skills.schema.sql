-- Claude Skills catalog schema
-- Required: name, description
-- Optional: license, compatibility, metadata, disable-model-invocation
-- Plus: origin/source, ingestion timestamp

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Required fields (from SKILL.md)
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  -- Optional fields
  license TEXT,
  compatibility TEXT,
  metadata TEXT,
  disable_model_invocation INTEGER DEFAULT 0,
  -- Origin and ingestion
  source_repo TEXT NOT NULL,
  source_path TEXT NOT NULL,
  source_url TEXT,
  ingested_at TEXT NOT NULL DEFAULT (datetime('now')),
  raw_content TEXT,
  UNIQUE(source_repo, source_path)
);

CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_description ON skills(description);
CREATE INDEX IF NOT EXISTS idx_skills_ingested_at ON skills(ingested_at);
CREATE INDEX IF NOT EXISTS idx_skills_source_repo ON skills(source_repo);

-- Full-text search (SQLite FTS5) for name and description
CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
  name,
  description,
  content=skills,
  content_rowid=id
);
CREATE TRIGGER IF NOT EXISTS skills_ai AFTER INSERT ON skills BEGIN
  INSERT INTO skills_fts(rowid, name, description) VALUES (new.id, new.name, new.description);
END;
CREATE TRIGGER IF NOT EXISTS skills_ad AFTER DELETE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, name, description) VALUES ('delete', old.id, old.name, old.description);
END;
CREATE TRIGGER IF NOT EXISTS skills_au AFTER UPDATE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, name, description) VALUES ('delete', old.id, old.name, old.description);
  INSERT INTO skills_fts(rowid, name, description) VALUES (new.id, new.name, new.description);
END;
