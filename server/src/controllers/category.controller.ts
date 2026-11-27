import { NextFunction, Request, Response } from 'express';
import {
  createCategory,
  listCategories,
  listTags,
  removeCategory,
  updateCategory,
} from '../services/category.service.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../validators/category.schema.js';

function parseCategoryId(raw: string): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw AppError.badRequest('Invalid category ID');
  }
  return parsed;
}

export async function getCategories(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await listCategories();
    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function getTags(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tags = await listTags();
    res.status(200).json({ tags });
  } catch (err) {
    next(err);
  }
}

export async function postCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await createCategory(req.body as CreateCategoryInput);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function patchCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseCategoryId(req.params.id);
    const category = await updateCategory(id, req.body as UpdateCategoryInput);
    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseCategoryId(req.params.id);
    await removeCategory(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
