import { NextFunction, Request, Response } from 'express';
import {
  createEntryService,
  deleteEntryService,
  getEntryDetailService,
  getMyEntriesService,
  getPublicEntriesService,
  updateEntryService,
} from '../services/entry.service.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateEntryInput,
  ListEntriesQuery,
  UpdateEntryInput,
} from '../validators/entry.schema.js';

export function parseEntryId(raw: string): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw AppError.badRequest('Invalid entry ID');
  }
  return parsed;
}

export async function listPublicEntriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as ListEntriesQuery;
    const result = await getPublicEntriesService(filters, req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listMyEntriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const data = await getMyEntriesService(req.user);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getEntryDetailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseEntryId(req.params.id);
    const entry = await getEntryDetailService(id, req.user);
    res.status(200).json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function createEntryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const entry = await createEntryService(req.user, req.body as CreateEntryInput);
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function updateEntryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const id = parseEntryId(req.params.id);
    const entry = await updateEntryService(
      req.user,
      id,
      req.body as UpdateEntryInput,
    );
    res.status(200).json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function deleteEntryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const id = parseEntryId(req.params.id);
    await deleteEntryService(req.user, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
