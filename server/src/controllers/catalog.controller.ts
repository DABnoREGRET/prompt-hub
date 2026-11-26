import { NextFunction, Request, Response } from 'express';
import {
  listAllTags,
  listCategoriesWithCounts,
  listEntriesByAuthor,
  listPublicEntries,
} from '../models/catalog.model.js';
import { AppError } from '../utils/AppError.js';

export async function getCategories(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await listCategoriesWithCounts();
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
    const tags = await listAllTags();
    res.status(200).json({ tags });
  } catch (err) {
    next(err);
  }
}

export async function getPublicEntries(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1) || 1;
    const pageSize = Number(req.query.pageSize ?? 12) || 12;
    const result = await listPublicEntries(page, pageSize);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMyEntries(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const data = await listEntriesByAuthor(req.user.id);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}
