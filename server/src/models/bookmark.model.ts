import { getDb } from '../db/client.js';
import {
  ENTRY_GROUP_BY,
  ENTRY_JOIN_SELECT,
  EntryItem,
  EntryRow,
  mapEntryRow,
} from './entry.model.js';

export async function insertBookmark(userId: number, entryId: number): Promise<void> {
  const db = await getDb();
  await db.query(
    `INSERT INTO bookmarks (user_id, entry_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, entry_id) DO NOTHING`,
    [userId, entryId],
  );
}

export async function deleteBookmark(userId: number, entryId: number): Promise<void> {
  const db = await getDb();
  await db.query(
    'DELETE FROM bookmarks WHERE user_id = $1 AND entry_id = $2',
    [userId, entryId],
  );
}

export async function countEntryBookmarks(entryId: number): Promise<number> {
  const db = await getDb();
  const res = await db.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM bookmarks WHERE entry_id = $1',
    [entryId],
  );
  return Number(res.rows[0]?.count ?? 0);
}

export async function listBookmarkedEntriesByUser(userId: number): Promise<EntryItem[]> {
  const db = await getDb();
  const res = await db.query<EntryRow>(
    `
    ${ENTRY_JOIN_SELECT}
    INNER JOIN bookmarks bm ON bm.entry_id = e.id AND bm.user_id = $1::int
    WHERE (e.visibility = 'PUBLIC' OR e.author_id = $1::int)
    ${ENTRY_GROUP_BY}
    ORDER BY MAX(bm.created_at) DESC, e.id DESC
    `,
    [userId],
  );
  return res.rows.map(mapEntryRow);
}
