import {
  CategoryRecord,
  CategorySummary,
  deleteCategoryById,
  findCategoryById,
  findCategoryConflict,
  insertCategory,
  listAllTags,
  listCategoriesWithCounts,
  TagItem,
  updateCategoryById,
} from '../models/category.model.js';
import { AppError } from '../utils/AppError.js';
import { toSlug } from '../utils/slug.js';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../validators/category.schema.js';

export function listCategories(): Promise<CategorySummary[]> {
  return listCategoriesWithCounts();
}

export function listTags(): Promise<TagItem[]> {
  return listAllTags();
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<CategoryRecord> {
  const slug = toSlug(input.name);
  if (slug.length < 2) {
    throw AppError.validation('Category name must produce a valid slug', {
      name: ['Category name must include at least two alphanumeric characters'],
    });
  }

  const conflict = await findCategoryConflict(input.name, slug);
  if (conflict) {
    throw AppError.conflict(
      'CATEGORY_EXISTS',
      'A category with this name or slug already exists',
    );
  }

  return insertCategory({
    name: input.name,
    slug,
    description: input.description ?? '',
  });
}

export async function updateCategory(
  id: number,
  input: UpdateCategoryInput,
): Promise<CategoryRecord> {
  const existing = await findCategoryById(id);
  if (!existing) {
    throw AppError.notFound('Category not found');
  }

  const nextName = input.name ?? existing.name;
  const nextSlug = toSlug(nextName);
  if (nextSlug.length < 2) {
    throw AppError.validation('Category name must produce a valid slug', {
      name: ['Category name must include at least two alphanumeric characters'],
    });
  }

  const conflict = await findCategoryConflict(nextName, nextSlug, id);
  if (conflict) {
    throw AppError.conflict(
      'CATEGORY_EXISTS',
      'A category with this name or slug already exists',
    );
  }

  const updated = await updateCategoryById(id, {
    name: nextName,
    slug: nextSlug,
    description: input.description ?? existing.description,
  });

  if (!updated) {
    throw AppError.notFound('Category not found');
  }

  return updated;
}

export async function removeCategory(id: number): Promise<void> {
  const deleted = await deleteCategoryById(id);
  if (!deleted) {
    throw AppError.notFound('Category not found');
  }
}
