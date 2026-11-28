ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_entry_type_check;
ALTER TABLE entries ADD CONSTRAINT entries_entry_type_check CHECK (entry_type IN ('SNIPPET', 'PROMPT', 'SKILL'));

CREATE TABLE IF NOT EXISTS curated_skills (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  harness VARCHAR(60) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  repo_url VARCHAR(500) NOT NULL,
  docs_url VARCHAR(500) NOT NULL DEFAULT '',
  install_command VARCHAR(255) NOT NULL DEFAULT '',
  skill_md_content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_curated_skills_featured
  ON curated_skills (is_featured DESC, created_at DESC);
