CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(64) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(60) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(120) NOT NULL,
  entry_type VARCHAR(16) NOT NULL CHECK (entry_type IN ('SNIPPET', 'PROMPT')),
  language VARCHAR(40) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  visibility VARCHAR(16) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(24) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_entries_visibility_created
  ON entries (visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_entries_author
  ON entries (author_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_entries_category
  ON entries (category_id);

CREATE INDEX IF NOT EXISTS idx_entries_type
  ON entries (entry_type);

CREATE INDEX IF NOT EXISTS idx_entry_tags_tag
  ON entry_tags (tag_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_entry
  ON bookmarks (entry_id);
