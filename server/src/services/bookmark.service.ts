import {
  countEntryBookmarks,
  deleteBookmark,
  insertBookmark,
  listBookmarkedEntriesByUser,
} from '../models/bookmark.model.js';
import { EntryItem, findEntryById } from '../models/entry.model.js';
import type { PublicUser } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';

export async function addBookmarkService(
  actor: PublicUser,
  entryId: number,
): Promise<{ bookmarked: true; bookmarkCount: number }> {
  const entry = await findEntryById(entryId, actor.id);
  if (!entry) {
    throw AppError.notFound('Entry not found');
  }
  if (
    entry.visibility === 'PRIVATE' &&
    entry.authorId !== actor.id &&
    actor.role !== 'ADMIN'
  ) {
    throw AppError.forbidden('You cannot bookmark another user\'s private entry');
  }

  await insertBookmark(actor.id, entryId);
  const bookmarkCount = await countEntryBookmarks(entryId);
  return { bookmarked: true, bookmarkCount };
}

export async function removeBookmarkService(
  actor: PublicUser,
  entryId: number,
): Promise<{ bookmarked: false; bookmarkCount: number }> {
  const entry = await findEntryById(entryId, actor.id);
  if (!entry) {
    throw AppError.notFound('Entry not found');
  }

  await deleteBookmark(actor.id, entryId);
  const bookmarkCount = await countEntryBookmarks(entryId);
  return { bookmarked: false, bookmarkCount };
}

export function listBookmarksService(actor: PublicUser): Promise<EntryItem[]> {
  return listBookmarkedEntriesByUser(actor.id);
}
