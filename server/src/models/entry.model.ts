import { DbClient, getDb, QueryResultRow } from '../db/client.js';
import type { ListEntriesQuery } from '../validators/entry.schema.js';

export type EntryType = 'SNIPPET' | 'PROMPT' | 'SKILL';
export type EntryVisibility = 'PUBLIC' | 'PRIVATE';

export interface EntryItem {
  id: number;
  title: string;
  entryType: EntryType;
  language: string;
  description: string;
  content: string;
  visibility: EntryVisibility;
  authorId: number;
  authorUsername: string;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags: string[];
  bookmarkCount: number;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EntryRow extends QueryResultRow {
  id: number;
  title: string;
  entry_type: EntryType;
  language: string;
  description: string;
  content: string;
  visibility: EntryVisibility;
  author_id: number;
  author_username: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  tags: string[] | string;
  bookmark_count: number;
  is_bookmarked: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

const ENTRY_JOIN_SELECT = `
  SELECT e.id, e.title, e.entry_type, e.language, e.description, e.content, e.visibility,
         e.author_id, u.username AS author_username,
         e.category_id, c.name AS category_name, c.slug AS category_slug,
         COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags,
         COUNT(DISTINCT b.user_id)::int AS bookmark_count,
         CASE
           WHEN $1::int IS NULL THEN FALSE
           ELSE EXISTS (
             SELECT 1 FROM bookmarks b2
             WHERE b2.entry_id = e.id AND b2.user_id = $1::int
           )
         END AS is_bookmarked,
         e.created_at, e.updated_at
  FROM entries e
  JOIN users u ON u.id = e.author_id
  LEFT JOIN categories c ON c.id = e.category_id
  LEFT JOIN entry_tags et ON et.entry_id = e.id
  LEFT JOIN tags t ON t.id = et.tag_id
  LEFT JOIN bookmarks b ON b.entry_id = e.id
`;

const ENTRY_GROUP_BY = 'GROUP BY e.id, u.username, c.name, c.slug';

const SORT_SQL: Record<'newest' | 'popular' | 'title', string> = {
  newest: 'e.created_at DESC, e.id DESC',
  popular: 'COUNT(DISTINCT b.user_id) DESC, e.created_at DESC, e.id DESC',
  title: 'LOWER(e.title) ASC, e.id DESC',
};

export function mapEntryRow(row: EntryRow): EntryItem {
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
    tags: rawTags
      .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
      .sort(),
    bookmarkCount: Number(row.bookmark_count ?? 0),
    isBookmarked: Boolean(row.is_bookmarked),
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function listPublicEntries(
  filters: ListEntriesQuery,
  viewerUserId: number | null = null,
): Promise<{
  data: EntryItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const db = await getDb();
  const conditions: string[] = [`e.visibility = 'PUBLIC'`];
  const filterParams: unknown[] = [];

  const pushFilterParam = (value: unknown): string => {
    filterParams.push(value);
    return `$${filterParams.length}`;
  };

  if (filters.q) {
    const p = pushFilterParam(`%${filters.q}%`);
    conditions.push(`(
      e.title ILIKE ${p}
      OR e.description ILIKE ${p}
      OR e.content ILIKE ${p}
      OR EXISTS (
        SELECT 1 FROM entry_tags etq
        JOIN tags tq ON tq.id = etq.tag_id
        WHERE etq.entry_id = e.id AND tq.name ILIKE ${p}
      )
    )`);
  }

  if (filters.type) {
    const p = pushFilterParam(filters.type);
    conditions.push(`e.entry_type = ${p}`);
  }

  if (filters.category) {
    const p = pushFilterParam(filters.category);
    conditions.push(`c.slug = ${p}`);
  }

  if (filters.language) {
    const p = pushFilterParam(filters.language);
    conditions.push(`LOWER(e.language) = LOWER(${p})`);
  }

  if (filters.tag) {
    const p = pushFilterParam(filters.tag);
    conditions.push(`EXISTS (
      SELECT 1 FROM entry_tags etf
      JOIN tags tf ON tf.id = etf.tag_id
      WHERE etf.entry_id = e.id AND LOWER(tf.name) = LOWER(${p})
    )`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM entries e
    LEFT JOIN categories c ON c.id = e.category_id
    ${whereClause}
  `;
  const countRes = await db.query<{ total: number }>(countSql, filterParams);
  const total = Number(countRes.rows[0]?.total ?? 0);

  // Shift filter parameter indices by +1 so $1 holds viewerUserId for is_bookmarked
  const shiftedWhere = whereClause.replace(/\$(\d+)/g, (_, idx) => `$${Number(idx) + 1}`);
  const limitParam = `$${filterParams.length + 2}`;
  const offsetParam = `$${filterParams.length + 3}`;
  const offset = (filters.page - 1) * filters.pageSize;

  const listSql = `
    ${ENTRY_JOIN_SELECT}
    ${shiftedWhere}
    ${ENTRY_GROUP_BY}
    ORDER BY ${SORT_SQL[filters.sortBy]}
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  const res = await db.query<EntryRow>(listSql, [
    viewerUserId,
    ...filterParams,
    filters.pageSize,
    offset,
  ]);

  return {
    data: res.rows.map(mapEntryRow),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
  };
}

export async function listEntriesByAuthor(authorId: number): Promise<EntryItem[]> {
  const db = await getDb();
  const res = await db.query<EntryRow>(
    `
    ${ENTRY_JOIN_SELECT}
    WHERE e.author_id = $1::int
    ${ENTRY_GROUP_BY}
    ORDER BY e.updated_at DESC, e.id DESC
    `,
    [authorId],
  );
  return res.rows.map(mapEntryRow);
}

export async function findEntryById(
  entryId: number,
  viewerUserId: number | null = null,
  dbOverride?: DbClient,
): Promise<EntryItem | null> {
  const db = dbOverride ?? (await getDb());
  const res = await db.query<EntryRow>(
    `
    ${ENTRY_JOIN_SELECT}
    WHERE e.id = $2
    ${ENTRY_GROUP_BY}
    `,
    [viewerUserId, entryId],
  );
  return res.rows[0] ? mapEntryRow(res.rows[0]) : null;
}

async function syncEntryTags(
  tx: DbClient,
  entryId: number,
  tags: string[],
): Promise<void> {
  await tx.query('DELETE FROM entry_tags WHERE entry_id = $1', [entryId]);

  for (const tagName of tags) {
    const tagRes = await tx.query<{ id: number }>(
      `INSERT INTO tags (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tagName],
    );
    await tx.query(
      `INSERT INTO entry_tags (entry_id, tag_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [entryId, tagRes.rows[0].id],
    );
  }
}

export async function createEntryWithTags(input: {
  authorId: number;
  categoryId: number | null;
  title: string;
  entryType: EntryType;
  language: string;
  description: string;
  content: string;
  visibility: EntryVisibility;
  tags: string[];
}): Promise<EntryItem> {
  const db = await getDb();
  const createdId = await db.transaction(async (tx) => {
    const inserted = await tx.query<{ id: number }>(
      `INSERT INTO entries (
         author_id, category_id, title, entry_type, language, description, content, visibility
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        input.authorId,
        input.categoryId,
        input.title,
        input.entryType,
        input.language,
        input.description,
        input.content,
        input.visibility,
      ],
    );

    const entryId = Number(inserted.rows[0].id);
    await syncEntryTags(tx, entryId, input.tags);
    return entryId;
  });

  const entry = await findEntryById(createdId, input.authorId);
  if (!entry) {
    throw new Error('Created entry could not be reloaded');
  }
  return entry;
}

export async function updateEntryWithTags(
  entryId: number,
  viewerUserId: number,
  input: {
    categoryId: number | null;
    title: string;
    entryType: EntryType;
    language: string;
    description: string;
    content: string;
    visibility: EntryVisibility;
    tags?: string[];
  },
): Promise<EntryItem | null> {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.query(
      `UPDATE entries
       SET category_id = $1,
           title = $2,
           entry_type = $3,
           language = $4,
           description = $5,
           content = $6,
           visibility = $7,
           updated_at = NOW()
       WHERE id = $8`,
      [
        input.categoryId,
        input.title,
        input.entryType,
        input.language,
        input.description,
        input.content,
        input.visibility,
        entryId,
      ],
    );

    if (input.tags !== undefined) {
      await syncEntryTags(tx, entryId, input.tags);
    }
  });

  return findEntryById(entryId, viewerUserId);
}

export async function deleteEntryById(entryId: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.query<{ id: number }>(
    'DELETE FROM entries WHERE id = $1 RETURNING id',
    [entryId],
  );
  return res.rows.length > 0;
}

export { ENTRY_JOIN_SELECT, ENTRY_GROUP_BY };
