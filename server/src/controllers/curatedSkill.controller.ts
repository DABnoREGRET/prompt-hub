import { NextFunction, Request, Response } from 'express';
import {
  createCuratedSkillService,
  deleteCuratedSkillService,
  listCuratedSkillsService,
  updateCuratedSkillService,
} from '../services/curatedSkill.service.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateCuratedSkillInput,
  ListCuratedSkillsQuery,
  UpdateCuratedSkillInput,
} from '../validators/curatedSkill.schema.js';
import { parseEntryId } from './entry.controller.js';

export async function listCuratedSkillsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ListCuratedSkillsQuery;
    const skills = await listCuratedSkillsService(query);
    res.status(200).json({ skills });
  } catch (err) {
    next(err);
  }
}

export async function createCuratedSkillHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const skill = await createCuratedSkillService(
      req.user,
      req.body as CreateCuratedSkillInput,
    );
    res.status(201).json({ skill });
  } catch (err) {
    next(err);
  }
}

export async function updateCuratedSkillHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseEntryId(req.params.id);
    const skill = await updateCuratedSkillService(
      id,
      req.body as UpdateCuratedSkillInput,
    );
    res.status(200).json({ skill });
  } catch (err) {
    next(err);
  }
}

export async function deleteCuratedSkillHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseEntryId(req.params.id);
    await deleteCuratedSkillService(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
