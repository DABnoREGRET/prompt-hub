import { NextFunction, Request, Response } from 'express';
import {
  addBookmarkService,
  listBookmarksService,
  removeBookmarkService,
} from '../services/bookmark.service.js';
import { AppError } from '../utils/AppError.js';
import { parseEntryId } from './entry.controller.js';

export async function postBookmarkHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const entryId = parseEntryId(req.params.id);
    const result = await addBookmarkService(req.user, entryId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteBookmarkHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const entryId = parseEntryId(req.params.id);
    const result = await removeBookmarkService(req.user, entryId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listBookmarksHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const data = await listBookmarksService(req.user);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}
