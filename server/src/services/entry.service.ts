import { findCategoryById } from '../models/category.model.js';
import {
  createEntryWithTags,
  deleteEntryById,
  EntryItem,
  findEntryById,
  listEntriesByAuthor,
  listPublicEntries,
  updateEntryWithTags,
} from '../models/entry.model.js';
import type { PublicUser } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import {
  CreateEntryInput,
  ListEntriesQuery,
  normalizeTagList,
  UpdateEntryInput,
} from '../validators/entry.schema.js';

function assertCanViewEntry(entry: EntryItem, actor?: PublicUser): void {
  if (entry.visibility === 'PUBLIC') {
    return;
  }
  if (!actor || (entry.authorId !== actor.id && actor.role !== 'ADMIN')) {
    throw AppError.forbidden('You do not have access to this private entry');
  }
}

function assertCanMutateEntry(entry: EntryItem, actor: PublicUser): void {
  if (entry.authorId !== actor.id && actor.role !== 'ADMIN') {
    throw AppError.forbidden('Only the author or an admin can modify this entry');
  }
}

async function ensureValidCategory(categoryId: number | null | undefined): Promise<void> {
  if (categoryId === undefined || categoryId === null) {
    return;
  }
  const category = await findCategoryById(categoryId);
  if (!category) {
    throw AppError.notFound('Selected category does not exist');
  }
}

export function getPublicEntriesService(
  filters: ListEntriesQuery,
  viewer?: PublicUser,
) {
  return listPublicEntries(filters, viewer?.id ?? null);
}

export function getMyEntriesService(actor: PublicUser): Promise<EntryItem[]> {
  return listEntriesByAuthor(actor.id);
}

export async function getEntryDetailService(
  entryId: number,
  actor?: PublicUser,
): Promise<EntryItem> {
  const entry = await findEntryById(entryId, actor?.id ?? null);
  if (!entry) {
    throw AppError.notFound('Entry not found');
  }
  assertCanViewEntry(entry, actor);
  return entry;
}

export async function createEntryService(
  actor: PublicUser,
  input: CreateEntryInput,
): Promise<EntryItem> {
  await ensureValidCategory(input.categoryId);

  return createEntryWithTags({
    authorId: actor.id,
    categoryId: input.categoryId ?? null,
    title: input.title,
    entryType: input.entryType,
    language: input.language,
    description: input.description ?? '',
    content: input.content,
    visibility: input.visibility ?? 'PUBLIC',
    tags: normalizeTagList(input.tags ?? []),
  });
}

export async function updateEntryService(
  actor: PublicUser,
  entryId: number,
  input: UpdateEntryInput,
): Promise<EntryItem> {
  const existing = await findEntryById(entryId, actor.id);
  if (!existing) {
    throw AppError.notFound('Entry not found');
  }
  assertCanMutateEntry(existing, actor);

  const nextCategoryId =
    input.categoryId !== undefined ? input.categoryId : existing.categoryId;
  await ensureValidCategory(nextCategoryId);

  const updated = await updateEntryWithTags(entryId, actor.id, {
    categoryId: nextCategoryId,
    title: input.title ?? existing.title,
    entryType: input.entryType ?? existing.entryType,
    language: input.language ?? existing.language,
    description: input.description ?? existing.description,
    content: input.content ?? existing.content,
    visibility: input.visibility ?? existing.visibility,
    tags: input.tags !== undefined ? normalizeTagList(input.tags) : undefined,
  });

  if (!updated) {
    throw AppError.notFound('Entry not found');
  }
  return updated;
}

export async function deleteEntryService(
  actor: PublicUser,
  entryId: number,
): Promise<void> {
  const existing = await findEntryById(entryId, actor.id);
  if (!existing) {
    throw AppError.notFound('Entry not found');
  }
  assertCanMutateEntry(existing, actor);
  await deleteEntryById(entryId);
}
