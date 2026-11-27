import { getDb, QueryResultRow } from '../db/client.js';

export interface CategoryRecord {
  id: number;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
}

export interface CategorySummary extends CategoryRecord {
  entryCount: number;
}

export interface TagItem {
  id: number;
  name: string;
}

interface CategoryRow extends QueryResultRow {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string | Date;
  entry_count?: number;
}

interface TagRow extends QueryResultRow {
  id: number;
  name: string;
}

function mapCategoryRow(row: CategoryRow): CategoryRecord {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ''),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function listCategoriesWithCounts(): Promise<CategorySummary[]> {
  const db = await getDb();
  const res = await db.query<CategoryRow>(
    `SELECT c.id, c.name, c.slug, c.description, c.created_at,
            COUNT(e.id)::int AS entry_count
     FROM categories c
     LEFT JOIN entries e ON e.category_id = c.id AND e.visibility = 'PUBLIC'
     GROUP BY c.id
     ORDER BY c.name ASC`,
  );

  return res.rows.map((row) => ({
    ...mapCategoryRow(row),
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

export async function findCategoryById(id: number): Promise<CategoryRecord | null> {
  const db = await getDb();
  const res = await db.query<CategoryRow>(
    `SELECT id, name, slug, description, created_at
     FROM categories
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return res.rows[0] ? mapCategoryRow(res.rows[0]) : null;
}

export async function findCategoryConflict(
  name: string,
  slug: string,
  excludeId?: number,
): Promise<CategoryRecord | null> {
  const db = await getDb();
  const params: unknown[] = [name, slug];
  let sql = `SELECT id, name, slug, description, created_at
             FROM categories
             WHERE (LOWER(name) = LOWER($1) OR slug = $2)`;

  if (excludeId !== undefined) {
    params.push(excludeId);
    sql += ' AND id <> $3';
  }
  sql += ' LIMIT 1';

  const res = await db.query<CategoryRow>(sql, params);
  return res.rows[0] ? mapCategoryRow(res.rows[0]) : null;
}

export async function insertCategory(input: {
  name: string;
  slug: string;
  description: string;
}): Promise<CategoryRecord> {
  const db = await getDb();
  const res = await db.query<CategoryRow>(
    `INSERT INTO categories (name, slug, description)
     VALUES ($1, $2, $3)
     RETURNING id, name, slug, description, created_at`,
    [input.name, input.slug, input.description],
  );
  return mapCategoryRow(res.rows[0]);
}

export async function updateCategoryById(
  id: number,
  input: { name: string; slug: string; description: string },
): Promise<CategoryRecord | null> {
  const db = await getDb();
  const res = await db.query<CategoryRow>(
    `UPDATE categories
     SET name = $1, slug = $2, description = $3
     WHERE id = $4
     RETURNING id, name, slug, description, created_at`,
    [input.name, input.slug, input.description, id],
  );
  return res.rows[0] ? mapCategoryRow(res.rows[0]) : null;
}

export async function deleteCategoryById(id: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.query<{ id: number }>(
    'DELETE FROM categories WHERE id = $1 RETURNING id',
    [id],
  );
  return res.rows.length > 0;
}
