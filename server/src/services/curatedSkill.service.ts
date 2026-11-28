import {
  CuratedSkillItem,
  deleteCuratedSkillById,
  findCuratedSkillById,
  findCuratedSkillBySlug,
  insertCuratedSkill,
  listCuratedSkills,
  updateCuratedSkillById,
} from '../models/curatedSkill.model.js';
import type { PublicUser } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { toSlug } from '../utils/slug.js';
import type {
  CreateCuratedSkillInput,
  ListCuratedSkillsQuery,
  UpdateCuratedSkillInput,
} from '../validators/curatedSkill.schema.js';
import { normalizeTagList } from '../validators/entry.schema.js';

export function listCuratedSkillsService(
  filters: ListCuratedSkillsQuery,
): Promise<CuratedSkillItem[]> {
  return listCuratedSkills(filters);
}

export async function createCuratedSkillService(
  actor: PublicUser,
  input: CreateCuratedSkillInput,
): Promise<CuratedSkillItem> {
  const slug = toSlug(input.title);
  if (!slug) {
    throw AppError.validation('Title must include alphanumeric characters');
  }

  const existing = await findCuratedSkillBySlug(slug);
  if (existing) {
    throw AppError.conflict('A curated skill with this title already exists', 'SKILL_EXISTS');
  }

  return insertCuratedSkill({
    title: input.title,
    slug,
    harness: input.harness,
    category: input.category,
    description: input.description ?? '',
    repoUrl: input.repoUrl,
    docsUrl: input.docsUrl ?? '',
    installCommand: input.installCommand ?? '',
    skillMdContent: input.skillMdContent,
    tags: normalizeTagList(input.tags ?? []),
    isFeatured: input.isFeatured ?? true,
    createdBy: actor.id,
  });
}

export async function updateCuratedSkillService(
  id: number,
  input: UpdateCuratedSkillInput,
): Promise<CuratedSkillItem> {
  const existing = await findCuratedSkillById(id);
  if (!existing) {
    throw AppError.notFound('Curated skill not found');
  }

  const nextTitle = input.title ?? existing.title;
  const nextSlug = toSlug(nextTitle);
  if (!nextSlug) {
    throw AppError.validation('Title must include alphanumeric characters');
  }

  if (nextSlug !== existing.slug) {
    const duplicate = await findCuratedSkillBySlug(nextSlug);
    if (duplicate && duplicate.id !== id) {
      throw AppError.conflict('Another curated skill already uses this slug', 'SKILL_EXISTS');
    }
  }

  const updated = await updateCuratedSkillById(id, {
    title: nextTitle,
    slug: nextSlug,
    harness: input.harness ?? existing.harness,
    category: input.category ?? existing.category,
    description: input.description ?? existing.description,
    repoUrl: input.repoUrl ?? existing.repoUrl,
    docsUrl: input.docsUrl ?? existing.docsUrl,
    installCommand: input.installCommand ?? existing.installCommand,
    skillMdContent: input.skillMdContent ?? existing.skillMdContent,
    tags: input.tags !== undefined ? normalizeTagList(input.tags) : existing.tags,
    isFeatured: input.isFeatured ?? existing.isFeatured,
  });

  if (!updated) {
    throw AppError.notFound('Curated skill not found');
  }
  return updated;
}

export async function deleteCuratedSkillService(id: number): Promise<void> {
  const deleted = await deleteCuratedSkillById(id);
  if (!deleted) {
    throw AppError.notFound('Curated skill not found');
  }
}
