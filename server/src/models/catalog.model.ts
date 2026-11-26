import { getDb, QueryResultRow } from '../db/client.js';

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
  description: string;
  entryCount: number;
}

export interface TagItem {
  id: number;
  name: string;
}

export interface EntryListItem {
  id: number;
  title: string;
  entryType: 'SNIPPET' | 'PROMPT';
  language: string;
  description: string;
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  authorId: number;
  authorUsername: string;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags: string[];
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryRow extends QueryResultRow {
  id: number;
  name: string;
  slug: string;
  description: string;
  entry_count: number;
}

interface TagRow extends QueryResultRow {
  id: number;
  name: string;
}

interface EntryRow extends QueryResultRow {
  id: number;
  title: string;
  entry_type: 'SNIPPET' | 'PROMPT';
  language: string;
  description: string;
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  author_id: number;
  author_username: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  tags: string[] | string;
  bookmark_count: number;
  created_at: string | Date;
  updated_at: string | Date;
}

function mapEntryRow(row: EntryRow): EntryListItem {
  const rawTags = Array.isArray(row.tags) ? row.tags : [];
  return {
    id: Number(row.id),
    title: String(row.title),
    entryType: row.entry_type,
    language: String(row.language),
    description: String(row.description ?? ''),
    content: String(row.content),
    visibility: row.visibility,
    authorId: Number(row.author_id),
    authorUsername: String(row.author_username),
    categoryId: row.category_id === null ? null : Number(row.category_id),
    categoryName: row.category_name === null ? null : String(row.category_name),
    categorySlug: row.category_slug === null ? null : String(row.category_slug),
    tags: rawTags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0),
    bookmarkCount: Number(row.bookmark_count ?? 0),
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function listCategoriesWithCounts(): Promise<CategorySummary[]> {
  const db = await getDb();
  const res = await db.query<CategoryRow>(
    `SELECT c.id, c.name, c.slug, c.description,
            COUNT(e.id)::int AS entry_count
     FROM categories c
     LEFT JOIN entries e ON e.category_id = c.id AND e.visibility = 'PUBLIC'
     GROUP BY c.id
     ORDER BY c.name ASC`,
  );

  return res.rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ''),
    entryCount: Number(row.entry_count ?? 0),
  }));
}

export async function listAllTags(): Promise<TagItem[]> {
  const db = await getDb();
  const res = await db.query<TagRow>('SELECT id, name FROM tags ORDER BY name ASC');
  return res.rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
  }));
}

export async function listPublicEntries(
  page: number,
  pageSize: number,
): Promise<{
  data: EntryListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const db = await getDb();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;

  const countRes = await db.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM entries WHERE visibility = 'PUBLIC'`,
  );
  const total = Number(countRes.rows[0]?.total ?? 0);

  const res = await db.query<EntryRow>(
    `SELECT e.id, e.title, e.entry_type, e.language, e.description, e.content, e.visibility,
            e.author_id, u.username AS author_username,
            e.category_id, c.name AS category_name, c.slug AS category_slug,
            COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags,
            COUNT(DISTINCT b.user_id)::int AS bookmark_count,
            e.created_at, e.updated_at
     FROM entries e
     JOIN users u ON u.id = e.author_id
     LEFT JOIN categories c ON c.id = e.category_id
     LEFT JOIN entry_tags et ON et.entry_id = e.id
     LEFT JOIN tags t ON t.id = et.tag_id
     LEFT JOIN bookmarks b ON b.entry_id = e.id
     WHERE e.visibility = 'PUBLIC'
     GROUP BY e.id, u.username, c.name, c.slug
     ORDER BY e.created_at DESC, e.id DESC
     LIMIT $1 OFFSET $2`,
    [safePageSize, offset],
  );

  return {
    data: res.rows.map(mapEntryRow),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    },
  };
}

export async function listEntriesByAuthor(authorId: number): Promise<EntryListItem[]> {
  const db = await getDb();
  const res = await db.query<EntryRow>(
    `SELECT e.id, e.title, e.entry_type, e.language, e.description, e.content, e.visibility,
            e.author_id, u.username AS author_username,
            e.category_id, c.name AS category_name, c.slug AS category_slug,
            COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags,
            COUNT(DISTINCT b.user_id)::int AS bookmark_count,
            e.created_at, e.updated_at
     FROM entries e
     JOIN users u ON u.id = e.author_id
     LEFT JOIN categories c ON c.id = e.category_id
     LEFT JOIN entry_tags et ON et.entry_id = e.id
     LEFT JOIN tags t ON t.id = et.tag_id
     LEFT JOIN bookmarks b ON b.entry_id = e.id
     WHERE e.author_id = $1
     GROUP BY e.id, u.username, c.name, c.slug
     ORDER BY e.updated_at DESC, e.id DESC`,
    [authorId],
  );

  return res.rows.map(mapEntryRow);
}
